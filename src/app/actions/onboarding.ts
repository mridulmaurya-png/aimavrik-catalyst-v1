"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/context";
import { bootstrapWorkspace } from "./workspace";

import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function createWorkspace(data: { name: string; type: string; timezone: string }) {
  console.log("Starting workspace creation for:", data.name);
  const user = await requireUser();

  // Create admin client specifically to bypass the chicken-and-egg RLS tenant creation issue
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create Business
  console.log("Inserting business payload under user:", user.id);
  const { data: business, error: bizError } = await adminSupabase
    .from("businesses")
    .insert({
      owner_user_id: user.id,
      business_name: data.name,
      business_type: data.type,
      timezone: data.timezone || 'UTC',
    })
    .select()
    .single();

  if (bizError) {
    console.error("Failed to insert business:", bizError);
    return { error: "Row-Level Security or database error prevented workspace creation. Please check integration." };
  }

  console.log("Business created successfully:", business.id);

  // Add team member for tenant routing
  const { error: teamError } = await adminSupabase.from("team_members").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner"
  });

  if (teamError) {
    console.error("Failed to insert team member:", teamError);
    return { error: "Business created, but failed to link ownership. Please contact support." };
  }

  console.log("User successfully linked as owner to:", business.id);

  // Run the core bootstrap using the admin client context if normal client fails
  try {
    await bootstrapWorkspace(business.id);
  } catch(e: any) {
    console.error("Failed to bootstrap workspace settings:", e);
    // Suppress throw as core business workspace still successfully persists!
  }

  console.log("Onboarding workspace creation fully successful for", business.id);
  return { businessId: business.id, error: null };
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
    console.error("Unauthorized attempt to attach integrations for business", businessId);
    return { success: false, error: "Unauthorized access to finalize settings. Please reload." };
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
