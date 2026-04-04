import { SupabaseClient } from "@supabase/supabase-js";
import { NormalizedEvent } from "./normalize";

export async function resolveAndUpsertContact(
  supabase: SupabaseClient,
  businessId: string,
  normalized: NormalizedEvent
) {
  const { email, phone, full_name, external_id } = normalized.contact;

  if (!email && !phone && !external_id) {
    throw new Error("No identifiable contact information provided");
  }

  // Look for existing contact by email first, then phone
  let existingContact = null;

  if (email) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", email)
      .maybeSingle();
      
    if (data) existingContact = data;
  }

  if (!existingContact && phone) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", phone)
      .maybeSingle();
      
    if (data) existingContact = data;
  }

  const now = new Date().toISOString();

  if (existingContact) {
    // Stage logic: if they are 'new' and we get another event, maybe move to 'engaged'
    // but we'll leave stage mutation primarily to the action/rules engine.
    
    // Merge Strategy: Only fill in empty fields, don't overwrite good data with nulls
    const updatePayload: any = {
      last_event_at: now,
      last_active_at: now,
    };

    if (!existingContact.full_name && full_name && full_name !== "Unknown Target") {
      updatePayload.full_name = full_name;
    }
    if (!existingContact.email && email) updatePayload.email = email;
    if (!existingContact.phone && phone) updatePayload.phone = phone;

    const { data: updated, error } = await supabase
      .from("contacts")
      .update(updatePayload)
      .eq("id", existingContact.id)
      .select()
      .single();

    if (error) throw new Error(`Contact update failed: ${error.message}`);
    return updated;

  } else {
    // Create new contact
    const insertPayload = {
      business_id: businessId,
      full_name: full_name || "Unknown Target",
      email: email || null,
      phone: phone || null,
      source: normalized.source,
      contact_type: "lead", // Default
      stage: "new",
      last_event_at: now,
      first_seen_at: now,
      last_active_at: now,
    };

    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw new Error(`Contact creation failed: ${error.message}`);
    return newContact;
  }
}
