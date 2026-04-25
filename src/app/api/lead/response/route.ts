/**
 * Lead Response API — POST /api/lead/response
 * 
 * Accepts inbound lead replies from n8n/webhooks and:
 * 1. Finds the lead by phone number (last-10-digit match)
 * 2. Records the response in lead_responses
 * 3. Updates lead stage based on sentiment analysis
 * 4. Cancels pending follow-ups (lead has responded)
 * 5. Triggers follow-up workflow if lead is interested (with dedup guard)
 * 
 * Auth: x-api-key (INTERNAL_API_KEY) + origin restriction
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { guardInternalRoute } from "@/lib/api/guard";
import { executeEvent } from "@/lib/execution/router";
import { cancelFollowUps } from "@/lib/execution/scheduler";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

// ─── Phone normalization ───
// Strips all non-digits, then keeps only the last 10 digits.
// This handles: "+91 98765 43210", "0091-9876543210", "9876543210", "(098) 765-43210"
function normalizeLast10(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  return digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
}

// ─── Sentiment classification (keyword-based) ───
// TODO: Upgrade to LLM classification via Gemini for edge cases like
// "I will think", "Call me later", "Maybe next week" — currently these
// fall to "engaged" which is safe but imprecise. Keep keyword-based
// for now to maintain zero external API cost.
const INTERESTED_KEYWORDS = ["yes", "interested", "sure", "tell me more", "how much", "sign me up", "let's do it", "okay", "sounds good", "go ahead", "i want", "book", "schedule"];
const NOT_INTERESTED_KEYWORDS = ["no", "not now", "not interested", "stop", "unsubscribe", "remove", "don't contact", "do not contact", "later", "no thanks"];

function classifySentiment(message: string): "interested" | "not_interested" | "engaged" {
  const lower = message.toLowerCase().trim();

  for (const keyword of INTERESTED_KEYWORDS) {
    if (lower.includes(keyword)) return "interested";
  }

  for (const keyword of NOT_INTERESTED_KEYWORDS) {
    if (lower.includes(keyword)) return "not_interested";
  }

  return "engaged";
}

// ─── Stage mapping from sentiment ───
function sentimentToStage(sentiment: string, currentStage: string): string {
  switch (sentiment) {
    case "interested":
      return "qualified";
    case "not_interested":
      return "disqualified";
    case "engaged":
      // Only upgrade stage — never downgrade
      if (currentStage === "new" || currentStage === "contacted") {
        return "engaged";
      }
      return currentStage; // Keep current stage if already higher
    default:
      return currentStage;
  }
}

// ─── Duplicate trigger cooldown (minutes) ───
// If lead was already classified as "interested" within this window,
// skip re-triggering the automation to prevent duplicate workflows.
const INTERESTED_COOLDOWN_MINUTES = 30;

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    // Security: Validate x-api-key + origin
    const authError = guardInternalRoute(req);
    if (authError) return authError;

    const body = await req.json();
    const { phone, message, channel = "whatsapp", business_id } = body;

    const trace_id = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ─── Validate required fields ───
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELD", message: "phone is required." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELD", message: "message is required." },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // ─── Step 1: Find lead by phone (last-10-digit match) ───
    const last10 = normalizeLast10(phone);

    if (last10.length < 7) {
      return NextResponse.json(
        { success: false, error: "INVALID_PHONE", message: "Phone number too short." },
        { status: 400 }
      );
    }

    // Use ILIKE with suffix pattern to match last 10 digits regardless of stored format
    // e.g. stored "+919876543210" matches query for "9876543210"
    let query = supabase
      .from("contacts")
      .select("id, business_id, full_name, stage, last_response_at, response_count")
      .ilike("phone", `%${last10}`);

    // If business_id provided, scope to that workspace
    if (business_id) {
      query = query.eq("business_id", business_id);
    }

    const { data: leads, error: lookupError } = await query
      .order("last_active_at", { ascending: false })
      .limit(1);

    if (lookupError) {
      console.error("[Lead:Response] DB lookup error:", lookupError.code);
      return NextResponse.json(
        { success: false, error: "LOOKUP_ERROR", message: "Failed to find lead." },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: "LEAD_NOT_FOUND", message: "No lead found with this phone number." },
        { status: 404 }
      );
    }

    const lead = leads[0];
    const leadBusinessId = lead.business_id;

    // ─── Step 2: Classify sentiment ───
    const sentiment = classifySentiment(message);
    const newStage = sentimentToStage(sentiment, lead.stage);

    // Sanitized log — no PII
    console.log("[Lead:Response]", { trace_id, sentiment, stage_transition: `${lead.stage} → ${newStage}`, channel });

    // ─── Step 3: Store the response ───
    const { error: insertError } = await supabase.from("lead_responses").insert({
      business_id: leadBusinessId,
      lead_id: lead.id,
      message,
      channel,
      sentiment,
    });

    if (insertError) {
      console.error("[Lead:Response] Insert error:", insertError.code);
      return NextResponse.json(
        { success: false, error: "STORAGE_ERROR", message: "Failed to store response." },
        { status: 500 }
      );
    }

    // ─── Step 4: Update contact record ───
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      last_response_at: now,
      last_active_at: now,
      response_count: (lead.response_count || 0) + 1,
    };

    // Only update stage if it changed
    if (newStage !== lead.stage) {
      updatePayload.stage = newStage;
    }

    const { error: updateError } = await supabase
      .from("contacts")
      .update(updatePayload)
      .eq("id", lead.id);

    if (updateError) {
      console.error("[Lead:Response] Contact update error:", updateError.code);
      // Non-fatal — response is already stored
    }

    // ─── Step 5: Cancel pending follow-ups (lead has responded) ───
    await cancelFollowUps(leadBusinessId, lead.id);

    // ─── Step 6: Trigger follow-up workflow if interested (with dedup) ───
    let executionResults = null;
    let executionSkipped = false;
    let skipReason: string | null = null;

    if (sentiment === "interested") {
      // ── Guard 1: Stage-based dedup (instant) ──
      // If stage was already "qualified" BEFORE this response, it means
      // a prior "interested" reply already triggered the automation.
      // No need to trigger again — skip immediately.
      if (lead.stage === "qualified") {
        executionSkipped = true;
        skipReason = "stage_already_qualified";
        console.log(`[Lead:Response] Dedup: skipped for ${trace_id} — stage already qualified`);
      }

      // ── Guard 2: Cooldown window dedup ──
      // Even if stage wasn't qualified yet (e.g. race condition, manual override),
      // check if another "interested" response was logged within the cooldown window.
      if (!executionSkipped) {
        const cooldownCutoff = new Date(Date.now() - INTERESTED_COOLDOWN_MINUTES * 60 * 1000).toISOString();

        const { data: recentTriggers } = await supabase
          .from("lead_responses")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("sentiment", "interested")
          .gte("created_at", cooldownCutoff)
          .order("created_at", { ascending: false })
          .limit(2); // 2 because the current one is already inserted

        if (recentTriggers && recentTriggers.length > 1) {
          executionSkipped = true;
          skipReason = "cooldown_window";
          console.log(`[Lead:Response] Dedup: skipped for ${trace_id} — duplicate interested within ${INTERESTED_COOLDOWN_MINUTES}m`);
        }
      }

      // ── Fire automation only if both guards pass ──
      if (!executionSkipped) {
        try {
          const results = await executeEvent({
            business_id: leadBusinessId,
            event_type: "customer_replied",
            entity_id: lead.id,
            mode: "live",
            payload: {
              trace_id,
              sentiment,
              channel,
              stage: newStage,
              response_type: "interested",
              _source: "lead_response_api",
            },
          });

          executionResults = results.map(r => ({
            run_id: r.run_id,
            status: r.status,
            engine: r.engine,
            channel: r.channel,
          }));
        } catch (err: any) {
          console.error("[Lead:Response] Execution trigger error:", err.message);
          // Non-fatal — response is already tracked
        }
      }
    }

    // ─── Step 7: Log to audit trail ───
    await supabase.from("audit_logs").insert({
      business_id: leadBusinessId,
      contact_id: lead.id,
      log_type: "lead_response_received",
      log_data_json: {
        trace_id,
        sentiment,
        channel,
        stage_transition: lead.stage !== newStage ? `${lead.stage} → ${newStage}` : null,
        triggered_execution: !!executionResults,
        execution_skipped_dedup: executionSkipped,
        skip_reason: skipReason,
      },
    });

    const durationMs = Date.now() - startMs;

    return NextResponse.json({
      success: true,
      trace_id,
      lead_id: lead.id,
      sentiment,
      stage: newStage,
      stage_changed: lead.stage !== newStage,
      follow_ups_cancelled: true,
      execution_triggered: !!executionResults,
      execution_skipped_dedup: executionSkipped,
      execution_results: executionResults,
      duration_ms: durationMs,
    });

  } catch (err: any) {
    console.error("[Lead:Response] Internal error:", err.message);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD", message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Internal processing error." },
      { status: 500 }
    );
  }
}
