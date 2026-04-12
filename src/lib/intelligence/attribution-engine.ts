import { createClient } from "@supabase/supabase-js";

export async function processRevenueEvent(businessId: string, eventData: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(url, key);

  const { event, lead_id, amount, currency, source } = eventData;

  // Store Event
  const { data: revEvent } = await supabase.from("revenue_events").insert({
    business_id: businessId,
    lead_id: lead_id,
    amount: amount || 0,
    source: source || 'unknown'
  }).select("*").single();

  // Phase 2: Rule based Attribution Engine V1
  // Find last successful interaction (from automation_runs)
  const { data: lastRun } = await supabase
    .from("automation_runs")
    .select("output_channel, automation_id")
    .eq("business_id", businessId)
    .in("status", ["completed", "handed_off"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastRun && revEvent) {
    await supabase.from("revenue_attribution").insert({
      business_id: businessId,
      lead_id: lead_id,
      channel: lastRun.output_channel || 'unknown',
      automation_id: lastRun.automation_id || null,
      attributed_value: amount || 0
    });
  }

  return { success: true, processed: true };
}
