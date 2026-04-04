"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/context";

/**
 * Ensures that a workspace has its base settings and default playbooks initialized.
 * This runs after onboarding or if settings are somehow missing.
 */
export async function bootstrapWorkspace(businessId: string) {
  const supabase = await createClient();
  const user = await requireUser();

  // Validate user has access
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Unauthorized to bootstrap this workspace");
  }

  // 1. Ensure business_settings exists
  const { data: settings } = await supabase
    .from("business_settings")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!settings) {
    await supabase.from("business_settings").insert({
      business_id: businessId,
      communication_hours_json: { timezone: "UTC", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      quiet_hours_json: { start: "22:00", end: "08:00" },
      brand_voice_json: { tone: "Professional", restrictedWords: [] },
      cta_preferences_json: { style: "Direct" },
      followup_rules_json: { maxAttempts: 3, delayHours: 24 }
    });
  }

  // 2. Ensure default Playbooks exist
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (!playbooks || playbooks.length === 0) {
    await supabase.from("playbooks").insert([
      {
        business_id: businessId,
        playbook_type: "Lead Follow-up",
        is_active: false,
        config_json: { delay: "5m", channel: "whatsapp" }
      },
      {
        business_id: businessId,
        playbook_type: "Abandoned Cart Recovery",
        is_active: false,
        config_json: { delay: "1h", channel: "email", discount: "10%" }
      },
      {
        business_id: businessId,
        playbook_type: "Proposal Follow-up",
        is_active: false,
        config_json: { delay: "48h", channel: "whatsapp" }
      }
    ]);
  }

  // 3. Lightweight Audit Log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "WORKSPACE_BOOTSTRAPPED",
    log_data_json: { timestamp: new Date().toISOString() }
  });

  return { success: true };
}
