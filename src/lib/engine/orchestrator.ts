import { createClient } from "@supabase/supabase-js";
import { normalizePayload } from "./normalize";
import { resolveAndUpsertContact } from "./contact";
import { evaluateAndCreateActions } from "./rules";

// Using Service Role key to process events independently of authenticated user session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function processIncomingEvent(businessId: string, payload: any, source: string) {
  // 1. Normalize Event
  const normalized = normalizePayload(payload, source);

  // 2. Event Deduplication constraint (Idempotent processing)
  const { data: existingEvent, error: dedupErr } = await supabase
    .from("events")
    .select("id")
    .eq("business_id", businessId)
    .eq("dedupe_key", normalized.dedupe_key)
    .maybeSingle();

  if (existingEvent) {
    // We already processed this event. Log and drop early.
    return {
      status: "duplicate",
      event_id: existingEvent.id,
      contact_id: null,
      matched: 0,
      actions_created: 0,
      message: "Duplicate event ignored to prevent duplicate actions."
    };
  }

  // 3. Contact Resolution & Safe Upsert
  let contact;
  try {
    contact = await resolveAndUpsertContact(supabase, businessId, normalized);
  } catch (err: any) {
     return { status: "error", message: `Contact resolution failed: ${err.message}` };
  }

  // 4. Ingest Event into Database (Status: 'processed')
  const { data: storedEvent, error: eventErr } = await supabase
    .from("events")
    .insert({
      business_id: businessId,
      contact_id: contact.id,
      event_type: normalized.event_type,
      source: normalized.source,
      dedupe_key: normalized.dedupe_key,
      payload_json: normalized.raw_payload,
      status: "processed", 
    })
    .select()
    .single();

  if (eventErr || !storedEvent) {
     return { status: "error", message: `Event persist failed: ${eventErr?.message}` };
  }

  // 5. Rule Engine & Action Creation (Step-Aware Playbook Evaluation)
  // Determine if a playbook should be triggered based on this event and contact phase.
  const evaluationResult = await evaluateAndCreateActions(
    supabase,
    businessId,
    storedEvent.id,
    contact,
    normalized
  );

  // 6. Return standard structured response
  return {
    status: "success",
    event_id: storedEvent.id,
    contact_id: contact.id,
    contact_action: contact.created_at === contact.updated_at ? "created" : "updated",
    matched_playbooks: evaluationResult.matched,
    actions_created: evaluationResult.actions_created,
    reason: evaluationResult.reason
  };
}
