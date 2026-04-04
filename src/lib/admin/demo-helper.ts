import { SupabaseClient } from "@supabase/supabase-js";

export async function resetDemoTenant(supabase: SupabaseClient, businessId: string) {
  // 1. Clear Actions (except those in flight)
  await supabase.from("actions").delete().eq("business_id", businessId).neq("status", "processing");

  // 2. Clear Messages
  await supabase.from("messages").delete().eq("business_id", businessId);

  // 3. Clear Events
  await supabase.from("events").delete().eq("business_id", businessId);

  // 4. Reset Contact Stage logic
  await supabase.from("contacts").update({ 
    stage: "new", 
    last_event_at: null, 
    last_action_at: null 
  }).eq("business_id", businessId);

  // 5. Log reset
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "demo_reset_triggered"
  });

  return { success: true, message: "Demo data cleared and contact stages reset." };
}
