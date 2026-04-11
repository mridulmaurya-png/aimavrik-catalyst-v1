/**
 * Feature Flags — Typed Access Layer
 * 
 * Controls phased rollout of Catalyst V2 capabilities.
 * All flags default to false. Ops panel toggles per workspace.
 * No execution logic reads these flags unless explicitly gated.
 */

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════
// FLAG DEFINITIONS
// ═══════════════════════════════════════════════════

export const FEATURE_FLAGS = [
  "language_region_enabled",
  "intelligence_layer_enabled",
  "insight_events_enabled",
  "engagement_engine_enabled",
  "festive_engine_enabled",
  "language_execution_enabled",
] as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[number];

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, string> = {
  language_region_enabled: "Language & Region Data Collection",
  intelligence_layer_enabled: "Intelligence Layer (Insight Generation)",
  insight_events_enabled: "Insight → Event Bridge",
  engagement_engine_enabled: "Engagement Engine (Auto-trigger from Insights)",
  festive_engine_enabled: "Festive & Regional Calendar Engine",
  language_execution_enabled: "Language-Aware Execution (Template Selection)",
};

export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  language_region_enabled: "Enables collection and storage of language and region data on contacts and events. No execution impact.",
  intelligence_layer_enabled: "Enables rule-based insight generation from automation runs, event logs, and lead data. Read-only insights.",
  insight_events_enabled: "Converts generated insights into actionable events pushed through the execution pipeline.",
  engagement_engine_enabled: "Allows automations to trigger on insight-generated events (lead_unresponsive, language_mismatch, etc).",
  festive_engine_enabled: "Enables the festival calendar scanner to generate festive_trigger events for matching regions.",
  language_execution_enabled: "Passes language context to n8n payloads, enabling language-based template selection in workflows.",
};

// Dependencies: which flags must be enabled before another
export const FEATURE_FLAG_DEPENDENCIES: Partial<Record<FeatureFlagKey, FeatureFlagKey[]>> = {
  insight_events_enabled: ["intelligence_layer_enabled"],
  engagement_engine_enabled: ["insight_events_enabled"],
  festive_engine_enabled: ["language_region_enabled"],
  language_execution_enabled: ["language_region_enabled"],
};

// ═══════════════════════════════════════════════════
// FLAG ACCESSOR
// ═══════════════════════════════════════════════════

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

/**
 * Check if a feature flag is enabled for a workspace.
 * Returns false if flag doesn't exist (safe default).
 */
export async function isFeatureEnabled(
  businessId: string,
  flagKey: FeatureFlagKey
): Promise<boolean> {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("business_id", businessId)
    .eq("flag_key", flagKey)
    .maybeSingle();

  return data?.enabled === true;
}

/**
 * Get all feature flags for a workspace (returns defaults for missing rows).
 */
export async function getAllFlags(
  businessId: string
): Promise<Record<FeatureFlagKey, boolean>> {
  const supabase = getServiceClient();

  const { data: rows } = await supabase
    .from("feature_flags")
    .select("flag_key, enabled")
    .eq("business_id", businessId);

  const result: Record<string, boolean> = {};
  for (const flag of FEATURE_FLAGS) {
    const row = rows?.find((r: any) => r.flag_key === flag);
    result[flag] = row?.enabled === true;
  }

  return result as Record<FeatureFlagKey, boolean>;
}

/**
 * Set a feature flag. Validates dependencies before enabling.
 * Returns error if dependency not met.
 */
export async function setFeatureFlag(
  businessId: string,
  flagKey: FeatureFlagKey,
  enabled: boolean,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();

  // Check dependencies when enabling
  if (enabled) {
    const deps = FEATURE_FLAG_DEPENDENCIES[flagKey];
    if (deps && deps.length > 0) {
      for (const dep of deps) {
        const depEnabled = await isFeatureEnabled(businessId, dep);
        if (!depEnabled) {
          return {
            success: false,
            error: `Cannot enable "${FEATURE_FLAG_LABELS[flagKey]}". Dependency "${FEATURE_FLAG_LABELS[dep]}" must be enabled first.`,
          };
        }
      }
    }
  }

  // Upsert the flag
  const { error } = await supabase
    .from("feature_flags")
    .upsert({
      business_id: businessId,
      flag_key: flagKey,
      enabled,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id,flag_key" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
