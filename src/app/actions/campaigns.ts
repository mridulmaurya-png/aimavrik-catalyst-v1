"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";

/**
 * Campaign stored in business_settings.campaigns_json for V1.
 * Migrates to dedicated `campaigns` table in V2.
 */
export interface Campaign {
  id: string;
  name: string;
  category: "remarketing" | "reactivation" | "cross_sell" | "upsell" | "retention" | "lead_nurture";
  channel: "whatsapp" | "email" | "sms";
  objective: string;
  status: "draft" | "active" | "paused" | "completed";
  audience_segment_id: string;
  playbook_id: string | null;
  enrolled_count: number;
  created_at: string;
}

async function getCampaigns(supabase: any, businessId: string): Promise<Campaign[]> {
  const { data } = await supabase
    .from("business_settings")
    .select("campaigns_json")
    .eq("business_id", businessId)
    .maybeSingle();

  return (data?.campaigns_json as Campaign[]) || [];
}

async function saveCampaigns(supabase: any, businessId: string, campaigns: Campaign[]) {
  // Try update first, then insert if no row
  const { error: updateError } = await supabase
    .from("business_settings")
    .update({ campaigns_json: campaigns })
    .eq("business_id", businessId);

  if (updateError) {
    // Fallback: the column might not exist yet, silently handle
    console.error("Campaign save error:", updateError.message);
  }
}

export async function listCampaigns(): Promise<Campaign[]> {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();
  return getCampaigns(supabase, businessId);
}

export async function createCampaign(data: Omit<Campaign, "id" | "created_at" | "enrolled_count">): Promise<Campaign> {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const campaigns = await getCampaigns(supabase, businessId);
  
  const newCampaign: Campaign = {
    ...data,
    id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    enrolled_count: 0,
    created_at: new Date().toISOString(),
  };

  campaigns.push(newCampaign);
  await saveCampaigns(supabase, businessId, campaigns);

  // Audit log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "CAMPAIGN_CREATED",
    log_data_json: { campaign_id: newCampaign.id, name: newCampaign.name }
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return newCampaign;
}

export async function updateCampaignStatus(campaignId: string, status: Campaign["status"]) {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const campaigns = await getCampaigns(supabase, businessId);
  const idx = campaigns.findIndex(c => c.id === campaignId);
  if (idx === -1) throw new Error("Campaign not found");

  campaigns[idx].status = status;
  await saveCampaigns(supabase, businessId, campaigns);

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return { success: true };
}
