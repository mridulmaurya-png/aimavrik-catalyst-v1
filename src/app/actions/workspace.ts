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
      // Lead Conversion
      {
        business_id: businessId,
        playbook_type: "Instant Lead Follow-Up",
        is_active: false,
        config_json: {
          delay: "5m", channel: "whatsapp", category: "lead_conversion",
          description: "Automatically sends a personalized follow-up within minutes of a new lead entering the system via webhook, form, or CSV import.",
          trigger_event: "lead_submitted", trigger_stage: "new", max_attempts: 3,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: null
        }
      },
      // Pipeline Recovery
      {
        business_id: businessId,
        playbook_type: "No Response Recovery",
        is_active: false,
        config_json: {
          delay: "24h", channel: "email", category: "pipeline_recovery",
          description: "Re-engages leads who received an initial follow-up but did not respond within the configured window.",
          trigger_event: "no_response", trigger_stage: "engaged", max_attempts: 2,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "48h"
        }
      },
      // Remarketing
      {
        business_id: businessId,
        playbook_type: "Stale Lead Reactivation",
        is_active: false,
        config_json: {
          delay: "7d", channel: "whatsapp", category: "remarketing",
          description: "Identifies and re-engages contacts that have been inactive beyond a threshold period with a targeted outreach sequence.",
          trigger_event: "lead_stale", trigger_stage: "any", max_attempts: 1,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "14d"
        }
      },
      {
        business_id: businessId,
        playbook_type: "Cold Lead Reactivation",
        is_active: false,
        config_json: {
          delay: "14d", channel: "email", category: "remarketing",
          description: "Re-engages cold leads who showed initial interest but went silent. Uses a value-first approach to reignite conversation.",
          trigger_event: "lead_cold", trigger_stage: "any", max_attempts: 2,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "30d"
        }
      },
      {
        business_id: businessId,
        playbook_type: "Warm Lead Re-Engagement",
        is_active: false,
        config_json: {
          delay: "3d", channel: "whatsapp", category: "remarketing",
          description: "Targets warm leads who engaged recently but fell off the pipeline. Sends personalized nudges based on last interaction context.",
          trigger_event: "lead_warm_inactive", trigger_stage: "engaged", max_attempts: 3,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "7d"
        }
      },
      {
        business_id: businessId,
        playbook_type: "Lost Lead Win-Back",
        is_active: false,
        config_json: {
          delay: "30d", channel: "email", category: "remarketing",
          description: "Launches a win-back campaign for leads that were marked as lost or churned. Offers incentive-based reconnection.",
          trigger_event: "lead_lost", trigger_stage: "churned", max_attempts: 1,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "60d"
        }
      },
      // Customer Revenue
      {
        business_id: businessId,
        playbook_type: "Cross-Sell Sequence",
        is_active: false,
        config_json: {
          delay: "7d", channel: "email", category: "customer_revenue",
          description: "Identifies converted customers and introduces complementary products or services based on their purchase history and profile.",
          trigger_event: "cross_sell_eligible", trigger_stage: "converted", max_attempts: 2,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: null
        }
      },
      {
        business_id: businessId,
        playbook_type: "Upsell Sequence",
        is_active: false,
        config_json: {
          delay: "14d", channel: "whatsapp", category: "customer_revenue",
          description: "Targets existing customers ready for premium upgrades by highlighting value differences and ROI of higher-tier options.",
          trigger_event: "upsell_eligible", trigger_stage: "converted", max_attempts: 2,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: null
        }
      },
      {
        business_id: businessId,
        playbook_type: "Dormant Customer Reactivation",
        is_active: false,
        config_json: {
          delay: "30d", channel: "whatsapp", category: "customer_revenue",
          description: "Reaches out to previously active customers who have gone dormant with personalized offers and value reminders.",
          trigger_event: "customer_dormant", trigger_stage: "converted", max_attempts: 2,
          stop_on_reply: true, stop_on_manual: true, inactivity_window: "45d"
        }
      },
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
