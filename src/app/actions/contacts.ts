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
  revalidatePath(`/contacts`);
}
