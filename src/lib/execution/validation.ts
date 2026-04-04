import { SupabaseClient } from "@supabase/supabase-js";

export async function validateActionExecution(
  supabase: SupabaseClient, 
  action: any
): Promise<{ valid: boolean, reason?: string, shouldReschedule?: boolean, retryAfterMinutes?: number }> {

  // 1. Fetch complete context (relations)
  const { data: contact, error: cntError } = await supabase
    .from("contacts")
    .select("stage, deleted_at")
    .eq("id", action.contact_id)
    .single();

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("deleted_at")
    .eq("id", action.business_id)
    .single();

  const { data: playbook, error: pbyError } = await supabase
    .from("playbooks")
    .select("is_active, deleted_at")
    .eq("id", action.playbook_id)
    .single();

  if (cntError || !contact || bizError || !business || pbyError || !playbook) {
    return { valid: false, reason: "Relational integrity block. Parent entity missing or inaccessible." };
  }

  // 2. State Validations
  if (contact.deleted_at || business.deleted_at || playbook.deleted_at) {
    return { valid: false, reason: "Parent entity is marked as deleted." };
  }

  if (!playbook.is_active) {
    return { valid: false, reason: "Playbook was paused or deactivated." };
  }

  // 3. Stage Validations (Constraint 3)
  // Don't send follow-ups to people already converted.
  if (contact.stage === "converted" && action.action_type.includes("send_")) {
    return { valid: false, reason: "Action dropped. Contact is already in 'converted' stage." };
  }

  // 4. Duplicate Send Prevention (Constraint 11 safety check)
  const { count: dupMsgs } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("contact_id", action.contact_id)
    .eq("action_id", action.id)
    .in("delivery_status", ["sent", "delivered"]);
    
  if (dupMsgs && dupMsgs > 0) {
    return { valid: false, reason: "Action dropped. A message trace indicates this action was already sent." };
  }

  // 5. Check Communication Rules / Quiet Hours (Constraint 4)
  const { data: settings } = await supabase
    .from("business_settings")
    .select("quiet_hours_json, default_sender_email")
    .eq("business_id", action.business_id)
    .single();

  // Basic check setup (extend to full timezone evaluation in phase 9)
  if (settings?.quiet_hours_json?.enabled) {
    const currentUTC = new Date().getUTCHours();
    // E.g., Don't send between 00:00 and 06:00
    if (currentUTC >= 0 && currentUTC <= 6) {
       return { valid: false, reason: "Quiet hours block active", shouldReschedule: true, retryAfterMinutes: 120 };
    }
  }

  return { valid: true };
}
