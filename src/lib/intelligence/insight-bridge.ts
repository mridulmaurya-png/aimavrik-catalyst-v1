/**
 * Insight → Event Bridge
 * 
 * Converts insights into actionable events pushed through the 
 * existing execution pipeline. Only active when insight_events_enabled.
 * 
 * Flow: insight (open) → map to event_type → executeEvent() → mark acted
 */

import { createClient } from "@supabase/supabase-js";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { executeEvent } from "@/lib/execution/router";
import { INSIGHT_TO_EVENT_MAP } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

export interface BridgeResult {
  processed: number;
  eventsCreated: number;
  skipped: number;
  errors: string[];
}

/**
 * Process open insights and convert eligible ones to events.
 * Only processes insights that have a mapped event type.
 */
export async function processInsightEvents(businessId: string): Promise<BridgeResult> {
  const enabled = await isFeatureEnabled(businessId, "insight_events_enabled");
  if (!enabled) {
    return { processed: 0, eventsCreated: 0, skipped: 0, errors: [] };
  }

  // Also check engagement engine flag for actual routing
  const engagementEnabled = await isFeatureEnabled(businessId, "engagement_engine_enabled");

  const supabase = getServiceClient();
  const result: BridgeResult = { processed: 0, eventsCreated: 0, skipped: 0, errors: [] };

  // Get open insights with mapped event types
  const { data: insights } = await supabase
    .from("insights")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "open")
    .in("type", Object.keys(INSIGHT_TO_EVENT_MAP))
    .order("created_at", { ascending: true })
    .limit(50);

  if (!insights || insights.length === 0) return result;

  for (const insight of insights) {
    result.processed++;
    const eventType = INSIGHT_TO_EVENT_MAP[insight.type];

    if (!eventType) {
      result.skipped++;
      continue;
    }

    try {
      // Only execute if engagement engine is active
      if (engagementEnabled) {
        await executeEvent({
          business_id: businessId,
          event_type: eventType,
          entity_id: insight.lead_id || undefined,
          mode: "live",
          payload: {
            _source: "insight_bridge",
            _insight_id: insight.id,
            _insight_type: insight.type,
            _insight_priority: insight.priority,
            _insight_message: insight.message,
            ...(insight.metadata || {}),
          },
        });
      }

      // Mark insight as acted
      await supabase.from("insights").update({
        status: "acted",
        acted_at: new Date().toISOString(),
        acted_by: "system:insight_bridge",
      }).eq("id", insight.id);

      result.eventsCreated++;

    } catch (err: any) {
      result.errors.push(`Insight ${insight.id}: ${err.message}`);
      // Don't mark as acted if event creation failed
    }
  }

  return result;
}
