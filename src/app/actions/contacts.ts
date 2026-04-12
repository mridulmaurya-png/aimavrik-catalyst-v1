"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";

export async function toggleIntervention(contactId: string, needsIntervention: boolean) {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  // First fetch the current metadata
  const { data: contact } = await supabase
    .from("contacts")
    .select("metadata_json")
    .eq("id", contactId)
    .eq("business_id", businessId)
    .single();

  if (!contact) throw new Error("Contact not found");

  const metadata = contact.metadata_json || {};
  metadata.needs_intervention = needsIntervention;

  await supabase
    .from("contacts")
    .update({ metadata_json: metadata })
    .eq("id", contactId)
    .eq("business_id", businessId);

  // Log it
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: needsIntervention ? "intervention_requested" : "intervention_resolved",
    log_data_json: { contact_id: contactId }
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath(`/dashboard`);
}

export async function createLead(formData: FormData) {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name || name.trim().length === 0) {
    throw new Error("Please enter the lead's full name so we know how to address them.");
  }
  if (!email && !phone) {
    throw new Error("We need at least an Email or Phone Number to reach out to this lead.");
  }

  // Simulate ingestion through direct event injection for UI responsiveness
  const payload = {
    full_name: name,
    email: email || undefined,
    phone: phone || undefined,
    source: "manual_entry"
  };

  // Directly insert if we bypass the router, but let's just insert to events and cron will pick it up or direct route
  // For V2: Direct contact insertion
  const { error } = await supabase.from("contacts").insert({
    business_id: businessId,
    full_name: name,
    email: email || null,
    phone: phone || null,
    source: "manual_entry",
    stage: "new",
    contact_type: "lead"
  });

  if (error) {
    throw new Error("Hmm, something went wrong saving this lead. Please try again.");
  }

  revalidatePath(`/contacts`);
  revalidatePath(`/dashboard`);
  return { success: true };
}
