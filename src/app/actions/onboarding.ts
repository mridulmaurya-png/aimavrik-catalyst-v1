"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/context";
import { bootstrapWorkspace } from "./workspace";

export async function createWorkspace(data: { name: string; type: string; timezone: string }) {
  const supabase = await createClient();
  const user = await requireUser();

  // Create Business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      owner_user_id: user.id,
      business_name: data.name,
      business_type: data.type,
      timezone: data.timezone || 'UTC',
    })
    .select()
    .single();

  if (bizError) throw bizError;

  // Add team member for tenant routing
  const { error: teamError } = await supabase.from("team_members").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner"
  });

  if (teamError) throw teamError;

  // Run the core bootstrap
  await bootstrapWorkspace(business.id);

  return { businessId: business.id };
}

export async function finishOnboarding(businessId: string, data: { source: string; channel: string; playbook: string }) {
  const supabase = await createClient();
  const user = await requireUser();

  // Validate tenant access
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Unauthorized");
  }

  // Persist Source
  if (data.source) {
    await supabase.from("integrations").insert({
       business_id: businessId,
       provider: data.source.toLowerCase().replace(/\s+/g, '_'), // e.g., 'shopify', 'meta_lead_ads'
       status: "active"
    });
  }

  // Note: Channel could be saved into business_settings "default_channel" 
  // if tracking primary delivery method, otherwise playbook execution dictates.

  // Activate Playbook if matched to defaults
  if (data.playbook) {
    const { data: targetPlaybook } = await supabase
      .from("playbooks")
      .select("id")
      .eq("business_id", businessId)
      .eq("playbook_type", data.playbook)
      .maybeSingle();

    if (targetPlaybook) {
      await supabase
        .from("playbooks")
        .update({ is_active: true })
        .eq("id", targetPlaybook.id);
    }
  }

  // Audit Log completion
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "ONBOARDING_COMPLETED",
    log_data_json: { source: data.source, channel: data.channel, playbook: data.playbook }
  });

  return { success: true };
}
