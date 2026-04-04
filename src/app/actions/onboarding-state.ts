"use server";

import { getSystemState } from "@/lib/system/state-model";
import { createClient } from "@/lib/supabase/server";

export async function getOnboardingState() {
  const systemState = await getSystemState();
  
  return {
    step: systemState.onboardingStep,
    businessId: systemState.businessId,
    state: {
      workspace: null, // Load if needed
      source: systemState.channels.filter(c => c !== 'whatsapp' && c !== 'email')[0] || '',
      channel: systemState.channels.find(c => c === 'whatsapp' || c === 'email') || '',
      playbook: systemState.activePlaybookId || '',
      testEvent: false,
    }
  };
}



export async function saveSource(businessId: string, source: string) {
  const supabase = await createClient();
  await supabase.from("integrations").upsert({
    business_id: businessId,
    provider: source.toLowerCase().replace(/\s+/g, '_'),
    status: "active"
  });
  return { success: true };
}

export async function saveChannel(businessId: string, channel: string) {
  const supabase = await createClient();
  // Fetch existing first to not overwrite other prefs
  const { data: settings } = await supabase.from("business_settings").select("cta_preferences_json").eq("business_id", businessId).single();
  const ctaPrefs = (settings?.cta_preferences_json as any) || {};
  ctaPrefs.channel = channel;

  await supabase.from("business_settings").update({
    cta_preferences_json: ctaPrefs
  }).eq("business_id", businessId);
  return { success: true };
}

export async function savePlaybook(businessId: string, playbook: string) {
  const supabase = await createClient();
  // Ensure the playbook exists and is active
  const { data: targetPlaybook } = await supabase
    .from("playbooks")
    .select("id")
    .eq("business_id", businessId)
    .eq("playbook_type", playbook)
    .maybeSingle();

  if (targetPlaybook) {
    await supabase.from("playbooks").update({ is_active: true }).eq("id", targetPlaybook.id);
  } else {
    // Insert if missing
    await supabase.from("playbooks").insert({
      business_id: businessId,
      playbook_type: playbook,
      is_active: true,
      config_json: {}
    });
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "ONBOARDING_COMPLETED",
    log_data_json: { timestamp: new Date().toISOString() }
  });

  return { success: true };
}
