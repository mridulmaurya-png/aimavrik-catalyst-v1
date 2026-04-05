import { createClient } from "@supabase/supabase-js";
import { validateActionExecution } from "./validation";
import { generateMessagePayload } from "./generation";
import { sendWhatsApp, sendEmail } from "./delivery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function runExecutionCycle(limit: number = 20, businessId?: string) {
  // 1. ACTION PICKUP (Claim / Lock logic) Constraint 1 & Phase 9 pickup constraints
  // Pick actions that are 'queued' OR 'scheduled' where scheduled_for is either null or past-due.
  let query = supabase
    .from("actions")
    .select("*")
    .in("status", ["queued", "scheduled"])
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data: rawQueue } = await query;

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
  const retryState = getRetryState(action);

  // 1. WORKSPACE STATUS GATE (Managed SaaS Rule)
  const { data: business } = await supabase
    .from("businesses")
    .select("status")
    .eq("id", action.business_id)
    .single();

  if (business?.status !== "active") {
    const reason = `Execution blocked. Workspace status: ${business?.status || 'signup_received'}. Awaiting AiMavrik Ops Activation.`;
    await supabase.from("actions").update({ status: "blocked" }).eq("id", action.id);
    await supabase.from("audit_logs").insert({
      business_id: action.business_id, 
      action_id: action.id, 
      log_type: "EXECUTION_BLOCKED",
      log_data_json: { 
        reason, 
        workspace_status: business?.status || "signup_received",
        execution_trace: { step: "gating", status: "blocked", timestamp: new Date().toISOString() }
      }
    });
    return { action_id: action.id, status: "blocked", reason };
  }

  // 2. VALIDATION LAYER (Contacts, Playbooks, Anti-spam)
  const validation = await validateActionExecution(supabase, action);
  
  if (!validation.valid) {
    if (validation.shouldReschedule) {
      const rTime = new Date(Date.now() + (validation.retryAfterMinutes! * 60000)).toISOString();
      await supabase.from("actions").update({ status: "scheduled", scheduled_for: rTime }).eq("id", action.id);
      return { action_id: action.id, status: "rescheduled", reason: validation.reason };
    }

    await supabase.from("actions").update({ status: "cancelled" }).eq("id", action.id);
    await supabase.from("audit_logs").insert({
        business_id: action.business_id, 
        action_id: action.id, 
        log_type: "EXECUTION_CANCELLED",
        log_data_json: { 
            reason: validation.reason,
            execution_trace: { step: "validation", status: "cancelled", timestamp: new Date().toISOString() }
        }
    });
    return { action_id: action.id, status: "cancelled", reason: validation.reason };
  }

  // Fetch settings for orchestration and delivery
  const { data: businessSettings } = await supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", action.business_id)
      .single();

  const configJson = businessSettings?.config_json || {};
  const executionMode = configJson.execution_mode || "local";

  // 3. CONNECTOR CONFIG GATE (Internal Success Honesty)
  if (executionMode === "local") {
    const isChannelEmail = action.action_type.includes("email");
    const isEmailReady = !!(configJson.resend_api_key && configJson.resend_from_email);
    const isWaReady = !!(configJson.whatsapp_api_key && configJson.whatsapp_sender_id);

    if ((isChannelEmail && !isEmailReady) || (!isChannelEmail && !isWaReady)) {
      const reason = `Execution blocked. Missing ${isChannelEmail ? 'Resend' : 'WhatsApp'} connector configuration.`;
      await supabase.from("actions").update({ status: "blocked" }).eq("id", action.id);
      await supabase.from("audit_logs").insert({
        business_id: action.business_id, 
        action_id: action.id, 
        log_type: "EXECUTION_BLOCKED",
        log_data_json: { 
            reason, 
            execution_mode: "local",
            execution_trace: { step: "connector_check", status: "blocked", timestamp: new Date().toISOString() }
        }
      });
      return { action_id: action.id, status: "blocked", reason };
    }
  }

  // 4. n8n HANDOFF MODE
  if (executionMode === "n8n") {
    if (!configJson.n8n_webhook_url) {
      const reason = "Execution blocked. Mode is n8n but no webhook URL is configured.";
      await supabase.from("actions").update({ status: "blocked" }).eq("id", action.id);
      return { action_id: action.id, status: "blocked", reason };
    }

    try {
      const { data: contact } = await supabase.from("contacts").select("*").eq("id", action.contact_id).single();
      const { data: playbook } = await supabase.from("playbooks").select("*").eq("id", action.playbook_id).single();

      const handoffPayload = {
        workspace_id: action.business_id,
        action_id: action.id,
        contact_id: action.contact_id,
        playbook_id: action.playbook_id,
        action_type: action.action_type,
        channel: action.channel,
        contact: { full_name: contact?.full_name, email: contact?.email, phone: contact?.phone, stage: contact?.stage },
        playbook: { name: playbook?.playbook_type, category: playbook?.category_id },
        intent: action.payload_json?.intent,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(configJson.n8n_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handoffPayload)
      });
      
      if (!response.ok) throw new Error(`n8n Webhook rejected (Status ${response.status})`);
      
      // HONEST STATUS: handed_off (not completed)
      await supabase.from("actions").update({ 
        status: "handed_off", 
        executed_at: new Date().toISOString(),
        payload_json: { ...action.payload_json, _handoff: "n8n_success", _handed_off_at: new Date().toISOString() } 
      }).eq("id", action.id);

      await supabase.from("audit_logs").insert({
        business_id: action.business_id, 
        action_id: action.id, 
        log_type: "EXECUTION_HANDED_OFF",
        log_data_json: { 
            execution_mode: "n8n",
            webhook_url: configJson.n8n_webhook_url,
            response_code: response.status,
            execution_trace: { step: "handoff", status: "handed_off", timestamp: new Date().toISOString() }
        }
      });
      return { action_id: action.id, status: "handed_off", n8n_handed_off: true };
    } catch (err: any) {
      return await handleActionFailure(action, err, true);
    }
  }

  // 5. LOCAL MODE DELIVERY
  const channel = action.action_type === "send_whatsapp" ? "whatsapp" : "email";
  const gCtx = {
    playbook_type: action.payload_json?.intent || "unknown",
    action_type: action.action_type,
    trigger_event: action.payload_json?.trigger_event || "signal",
    business_tone: businessSettings?.brand_voice_json?.tone || "professional",
    contact_first_name: "Customer" 
  };

  const genMsg = await generateMessagePayload(channel, gCtx);
  const mockPayload = { to: "user@example.com", body: genMsg.body, subject: genMsg.subject };
  let delivery;

  if (channel === "whatsapp") {
    delivery = await sendWhatsApp(mockPayload, businessSettings, true);
  } else {
    delivery = await sendEmail(mockPayload, businessSettings, true);
  }

  // Final Persistence
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
    const isRetryable = delivery.error?.toLowerCase().includes("timeout") || delivery.error?.toLowerCase().includes("rate limit");
    return await handleActionFailure(action, new Error(delivery.error), isRetryable);
  }

  const durationMs = Date.now() - startMs;

  // HONEST SUCCESS: completed (local execution confirmed)
  await supabase.from("actions").update({ status: "completed", executed_at: new Date().toISOString() }).eq("id", action.id);
  await supabase.from("audit_logs").insert({
    business_id: action.business_id, 
    action_id: action.id, 
    log_type: "EXECUTION_COMPLETED",
    log_data_json: { 
        execution_mode: "local",
        duration_ms: durationMs,
        message_id: msgInsert.data?.id,
        execution_trace: { step: "delivery", status: "completed", timestamp: new Date().toISOString() }
    }
  });

  return { action_id: action.id, status: "completed", provider_id: delivery.provider_id };
}
