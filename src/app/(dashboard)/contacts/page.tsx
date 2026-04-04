import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import ContactsClient from "@/components/contacts/contacts-client";

export default async function ContactsPage() {
  const { businessId, currencyCode } = await requireWorkspace();
  const supabase = await createClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("business_id", businessId)
    .order("last_active_at", { ascending: false });

  return <ContactsClient contacts={contacts || []} currencyCode={currencyCode} />;
}
