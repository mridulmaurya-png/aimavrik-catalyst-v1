import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { computeSegments, SEGMENT_DEFINITIONS } from "@/lib/engine/segments";
import CampaignsClient from "@/components/campaigns/campaigns-client";

export default async function CampaignsPage() {
  const { businessId, currencyCode } = await requireWorkspace();
  const supabase = await createClient();

  // Fetch campaigns from business_settings
  const { data: settings } = await supabase
    .from("business_settings")
    .select("campaigns_json")
    .eq("business_id", businessId)
    .maybeSingle();

  const campaigns = (settings?.campaigns_json as any[]) || [];

  // Fetch segments for dropdown
  const segments = await computeSegments(supabase, businessId);

  // Fetch playbooks for linking
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id, playbook_type, is_active")
    .eq("business_id", businessId);

  return (
    <CampaignsClient 
      campaigns={campaigns} 
      segments={segments}
      playbooks={playbooks || []}
    />
  );
}
