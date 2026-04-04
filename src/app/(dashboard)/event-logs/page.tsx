import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import EventLogsClient from "@/components/event-logs/event-logs-client";

export default async function EventLogsPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  // Fetch real events from DB, joined with contacts for display
  const { data: events, error } = await supabase
    .from("events")
    .select("id, event_type, source, status, created_at, payload_json, contact_id, contact:contacts(full_name, email)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  // Safely flatten the joined contact data 
  const flatEvents = (events || []).map(e => {
    const contact = Array.isArray(e.contact) ? e.contact[0] : e.contact;
    return {
      id: e.id,
      event_type: e.event_type || "unknown",
      source: e.source || "system",
      status: e.status || "processed",
      created_at: e.created_at,
      payload_json: e.payload_json || {},
      contact_name: contact?.full_name || "",
      contact_email: contact?.email || ""
    };
  });

  return <EventLogsClient events={flatEvents} />;
}
