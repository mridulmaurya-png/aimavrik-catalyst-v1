import { SupabaseClient } from "@supabase/supabase-js";
import { NormalizedEvent } from "./normalize";

export async function evaluateAndCreateActions(
  supabase: SupabaseClient,
  businessId: string,
  eventId: string,
  contact: any,
  normalized: NormalizedEvent
) {
  // 1. Fetch active playbooks for business
  const { data: playbooks, error: pbError } = await supabase
    .from("playbooks")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (pbError || !playbooks || playbooks.length === 0) {
    return { matched: 0, actions_created: 0, reason: "No active playbooks found" };
  }

  let actionsCreated = 0;
  let matchedPlaybooks = 0;

  for (const playbook of playbooks) {
    // Phase 7 Base Rule: We trigger if event_type matches the general intent of the playbook.
    // E.g. "Abandoned Cart Recovery" triggers on "checkout_abandoned".
    let isMatch = false;

    // Mapping intent logic for V1 playbooks
    const pType = playbook.playbook_type;
    const eType = normalized.event_type;

    // "Instant Lead Follow-Up" — triggers on any new lead/form/contact event
    if (pType === "Instant Lead Follow-Up" && (
      eType === "lead_submitted" || eType === "form_submitted" || 
      eType === "contact_created" || eType === "csv_import" ||
      eType === "checkout_completed" || eType === "lead_captured"
    )) isMatch = true;

    // "No Response Recovery" — triggers when a contact hasn't responded
    if (pType === "No Response Recovery" && (
      eType === "no_response" || eType === "followup_needed" ||
      eType === "proposal_unopened"
    )) isMatch = true;

    // "Stale Lead Reactivation" — triggers on stale/inactive signals
    if (pType === "Stale Lead Reactivation" && (
      eType === "lead_stale" || eType === "inactive_detected" ||
      eType === "reactivation_triggered"
    )) isMatch = true;

    // Legacy support for existing data
    if (pType === "Abandoned Cart Recovery" && eType === "checkout_abandoned") isMatch = true;
    if (pType === "Lead Follow-up" && (eType === "lead_submitted" || eType === "form_submitted")) isMatch = true;
    if (pType === "New Lead Instant Follow-up" && (eType === "lead_submitted" || eType === "form_submitted")) isMatch = true;
    if (pType === "Proposal Follow-up" && (eType === "proposal_sent" || eType === "proposal_unopened")) isMatch = true;
    if (pType === "Post-Purchase Upsell" && eType === "purchase_completed") isMatch = true;

    if (!isMatch) continue;

    // Stage-based filtering: Don't action already converted contacts for acquisition playbooks
    if ((pType === "Instant Lead Follow-Up" || pType === "New Lead Instant Follow-up") && contact.stage === "converted") {
       continue;
    }

    // Check Constraint 2: Action Deduplication (Idempotency of Actions)
    // Have we already fired an initial step for this playbook to this contact recently?
    // We check the actions table for identical playbook/contact combos.
    const { count: prevActionsCount } = await supabase
      .from("actions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("contact_id", contact.id)
      .eq("playbook_id", playbook.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Look back 24 hrs to prevent spam

    if (prevActionsCount && prevActionsCount > 0) {
      // We already triggered an action sequence for this playbook and contact recently.
      continue;
    }

    matchedPlaybooks++;

    // Action Logic
    // For V1 Engine, we queue the first step of the playbook (e.g., send_whatsapp)
    let actionType = "send_whatsapp";
    let channel = "whatsapp";

    if (pType === "New Lead Instant Follow-up" || pType === "Proposal Follow-up") {
       actionType = "send_email";
       channel = "email";
    }

    // Create Action
    const { error: actionError } = await supabase
      .from("actions")
      .insert({
        business_id: businessId,
        contact_id: contact.id,
        event_id: eventId,
        playbook_id: playbook.id,
        action_type: actionType,
        channel: channel,
        status: "queued",
        payload_json: {
          intent: pType,
          trigger_event: eType
        }
      });

    if (!actionError) {
      actionsCreated++;
    }
  }

  return { matched: matchedPlaybooks, actions_created: actionsCreated, reason: "Evaluation complete" };
}
