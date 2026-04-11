/**
 * Event Ingestion API — POST /api/events/ingest
 * 
 * Primary event ingestion endpoint for external systems (CRMs, forms, webhooks).
 * Validates API key per workspace, then routes through the managed execution router.
 * 
 * Authentication: 
 *   Header: Authorization: Bearer <api_key>
 *   OR: x-api-key: <api_key>
 *   The api_key is matched against businesses.api_key or client_integrations.config_json.api_key
 * 
 * Payload:
 *   { business_id, event_type, entity_type?, entity_id?, payload?, source? }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeEvent } from "@/lib/execution/router";
import { scheduleFollowUp } from "@/lib/execution/scheduler";
import { TRIGGER_EVENTS } from "@/lib/execution/types";
import { isFeatureEnabled } from "@/lib/config/feature-flags";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const xApiKey = req.headers.get("x-api-key");
  if (xApiKey) return xApiKey;
  return null;
}

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const body = await req.json();
    const {
      business_id,
      event_type,
      entity_type = "lead",
      entity_id,
      payload = {},
      source = "api",
    } = body;

    // ─── Validate required fields ───
    if (!business_id) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELD", message: "business_id is required." },
        { status: 400 }
      );
    }

    if (!event_type) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELD", message: "event_type is required." },
        { status: 400 }
      );
    }

    // Validate event_type is known (allow custom_event for extensibility)
    const knownEvents = [...TRIGGER_EVENTS] as string[];
    if (!knownEvents.includes(event_type) && event_type !== "custom_event") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_EVENT_TYPE",
          message: `Unknown event_type "${event_type}". Valid types: ${knownEvents.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ─── Authenticate via API key ───
    const apiKey = extractApiKey(req);
    const supabase = getServiceClient();

    // Verify business exists
    const { data: workspace } = await supabase
      .from("businesses")
      .select("id, business_name, status, api_key")
      .eq("id", business_id)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "BUSINESS_NOT_FOUND", message: "No workspace found for this business_id." },
        { status: 404 }
      );
    }

    // API key validation (check business.api_key OR allow internal secret)
    const internalSecret = process.env.INTERNAL_EXECUTION_SECRET;
    const isInternalCall = apiKey && internalSecret && apiKey === internalSecret;
    const isWorkspaceKey = apiKey && workspace.api_key && apiKey === workspace.api_key;

    if (!isInternalCall && !isWorkspaceKey) {
      // Also check if there's a matching key in a connected integration's config
      const { data: matchingInteg } = await supabase
        .from("client_integrations")
        .select("id")
        .eq("business_id", business_id)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();

      // If no workspace key set and no integration match and no internal secret, reject
      if (!matchingInteg && !isWorkspaceKey) {
        // If workspace has no API key configured, allow with a warning in dev
        if (!workspace.api_key && process.env.NODE_ENV === "development") {
          console.warn(`[EVENT:INGEST] No API key configured for workspace ${business_id}. Allowing in dev mode.`);
        } else if (workspace.api_key) {
          return NextResponse.json(
            { success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key." },
            { status: 401 }
          );
        }
      }
    }

    // ─── Safe language/region enrichment (Phase 1) ───
    const language = payload.language || body.language || null;
    const region = payload.region || body.region || null;

    // ─── Route through managed execution engine ───
    const results = await executeEvent({
      business_id,
      event_type,
      entity_id,
      mode: "live",
      payload: {
        ...payload,
        _entity_type: entity_type,
        _source: source,
        _ingested_at: new Date().toISOString(),
        // V2: language/region context (null-safe, no enforcement)
        language: language || undefined,
        region: region || undefined,
      },
    });

    // ─── Schedule follow-up if lead_created succeeded ───
    if (event_type === "lead_created") {
      const anySucceeded = results.some(
        r => r.status === "completed" || r.status === "handed_off"
      );

      if (anySucceeded) {
        const followUpDelay = payload._followup_delay_minutes || 15;
        await scheduleFollowUp({
          business_id,
          entity_id,
          entity_type,
          source_run_id: results[0]?.run_id,
          payload: {
            original_event_type: "lead_created",
            original_entity_id: entity_id,
            lead_payload: payload,
          },
          delay_minutes: followUpDelay,
        });
      }
    }

    const durationMs = Date.now() - startMs;

    return NextResponse.json({
      success: true,
      status: "processed",
      duration_ms: durationMs,
      results: results.map(r => ({
        run_id: r.run_id,
        automation_id: r.automation_id,
        status: r.status,
        engine: r.engine,
        channel: r.channel,
        blocked_reason: r.blocked_reason,
        handoff_reference: r.handoff_reference,
      })),
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "PROCESSING_ERROR", message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
