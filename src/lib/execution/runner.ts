import { createClient } from "@supabase/supabase-js";
import { validateActionExecution } from "./validation";
import { generateMessagePayload } from "./generation";
import { sendWhatsApp, sendEmail } from "./delivery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function runExecutionCycle(limit: number = 20) {
  // 1. ACTION PICKUP (Claim / Lock logic) Constraint 1 & Phase 9 pickup constraints
  // Pick actions that are 'queued' OR 'scheduled' where scheduled_for is either null or past-due.
  const { data: rawQueue } = await supabase
    .from("actions")
    .select("*")
    .in("status", ["queued", "scheduled"])
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rawQueue || rawQueue.length === 0) return { actions_processed: 0, results: [] };

  const results = [];

  for (const act of rawQueue) {
    // ATOMIC CLAIM -> Verify it is STILL queued and update to 'processing'
    const { data: claimed, error: claimErr } = await supabase
      .from("actions")
      .update({ status: "processing" })
      .eq("id", act.id)
      .eq("status", act.status) // Must match the state we saw, prevents double claim
      .select()
      .maybeSingle();

    if (claimErr || !claimed) {
      console.log(`Action ${act.id} already claimed by another worker.`);
      continue;
    }

    try {
      const execRes = await executeSingleAction(claimed);
      results.push(execRes);
    } catch (e: any) {
      // 10. UNHANDLED FAILURE HANDLING (Fallback)
      const errorPayload = await handleActionFailure(claimed, e, false);
      results.push({ action_id: claimed.id, status: errorPayload.status, reason: e.message });
    }
  }

  return { actions_processed: results.length, results };
}

// Helper accessor for payload state (Phase 9 constraint logic)
function getRetryState(action: any) {
  const payload = action.payload_json || {};
  return {
    retry_count: payload._retry_count || 0,
    last_error: payload._last_error || null
  };
}

async function handleActionFailure(action: any, error: any, isRetryable: boolean = false) {
  const { retry_count } = getRetryState(action);
  const MAX_RETRIES = 3;

  if (isRetryable && retry_count < MAX_RETRIES) {
    const newCount = retry_count + 1;
    // Exponential backoff: Base 5 mins * count
    const delayMinutes = 5 * newCount;
    const rTime = new Date(Date.now() + (delayMinutes * 60000)).toISOString();
    
    // Update payload safely mapping retry logic
    const newPayload = { ...action.payload_json, _retry_count: newCount, _last_error: error.message };
    
    await supabase.from("actions").update({ 
      status: "scheduled", 
      scheduled_for: rTime,
      payload_json: newPayload
    }).eq("id", action.id);

    await supabase.from("audit_logs").insert({
      business_id: action.business_id, action_id: action.id, log_type: "execution_retried",
      log_data_json: { error: error.message, retry_count: newCount, scheduled_for: rTime }
    });

    return { status: "scheduled", reason: `Retrying (${newCount}/${MAX_RETRIES}): ${error.message}` };
  }

  // Terminal failure
  const finalPayload = { ...action.payload_json, _last_error: error.message };
  await supabase.from("actions").update({ status: "failed", payload_json: finalPayload }).eq("id", action.id);
  
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, action_id: action.id, log_type: "execution_failed",
    log_data_json: { error: error.message, terminal: true }
  });

  return { status: "failed", reason: "Terminal error reached. " + error.message };
}

async function executeSingleAction(action: any) {
  const startMs = Date.now();
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, action_id: action.id, log_type: "execution_started",
    log_data_json: { retry_count: getRetryState(action).retry_count }
  });

  // 2. VALIDATION LAYER
  const validation = await validateActionExecution(supabase, action);
  
  if (!validation.valid) {
    if (validation.shouldReschedule) {
      const rTime = new Date(Date.now() + (validation.retryAfterMinutes! * 60000)).toISOString();
      await supabase.from("actions").update({ status: "scheduled", scheduled_for: rTime }).eq("id", action.id);
      return { action_id: action.id, status: "rescheduled", reason: validation.reason };
    }

    // Unrecoverable state validation failure
    await supabase.from("actions").update({ status: "cancelled" }).eq("id", action.id);
    await supabase.from("audit_logs").insert({
        business_id: action.business_id, action_id: action.id, log_type: "execution_cancelled",
        log_data_json: { reason: validation.reason }
    });
    return { action_id: action.id, status: "cancelled", reason: validation.reason };
  }

  // 3. AI MESSAGE GENERATION
  const channel = action.action_type === "send_whatsapp" ? "whatsapp" : "email";
  
  const gCtx = {
    playbook_type: action.payload_json?.intent || "unknown",
    action_type: action.action_type,
    trigger_event: action.payload_json?.trigger_event || "signal",
    business_tone: "professional", // would fetch from business profile config
    contact_first_name: "Customer"  // would fetch from contact
  };

  const genMsg = await generateMessagePayload(channel, gCtx);
  
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, action_id: action.id, log_type: "ai_output_generated",
    log_data_json: { used_fallback: genMsg.is_fallback, generated_length: genMsg.body.length }
  });

  // 4. DELIVERY LAYER
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, action_id: action.id, log_type: "delivery_attempted",
    log_data_json: { channel }
  });

  const { data: businessSettings } = await supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", action.business_id)
      .single();

  const mockPayload = { to: "user@example.com", body: genMsg.body, subject: genMsg.subject };
  let delivery;

  if (channel === "whatsapp") {
    delivery = await sendWhatsApp(mockPayload, businessSettings, true); // true forces Simulated Mode for Phase 8
  } else {
    delivery = await sendEmail(mockPayload, businessSettings, true);
  }

  // 5. MESSAGE PERSISTENCE & FAILURE HANDLING
  const msgInsert = await supabase.from("messages").insert({
    business_id: action.business_id,
    contact_id: action.contact_id,
    action_id: action.id,
    channel: channel,
    subject: genMsg.subject,
    body: genMsg.body,
    delivery_status: delivery.success ? "sent" : "failed",
    sent_at: delivery.success ? new Date().toISOString() : null
  }).select().single();

  if (!delivery.success) {
    // Determine if it was a transient provider failure vs hard config mapping fail
    const isRetryable = delivery.error?.toLowerCase().includes("timeout") || delivery.error?.toLowerCase().includes("rate limit");
    return await handleActionFailure(action, new Error(delivery.error), isRetryable);
  }

  const durationMs = Date.now() - startMs;

  // Success
  await supabase.from("actions").update({ status: "completed", executed_at: new Date().toISOString() }).eq("id", action.id);
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, action_id: action.id, log_type: "delivery_succeeded",
    log_data_json: { provider_id: delivery.provider_id, message_id: msgInsert.data?.id, duration_ms: durationMs }
  });

  return { action_id: action.id, status: "completed", provider_id: delivery.provider_id };
}
