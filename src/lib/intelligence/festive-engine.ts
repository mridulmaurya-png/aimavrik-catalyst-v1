/**
 * Festive & Regional Calendar Engine
 * 
 * Daily scanner that checks for matching festivals and generates
 * festive_trigger events for active leads in matching regions.
 * Only active when festive_engine_enabled flag is true.
 */

import { createClient } from "@supabase/supabase-js";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { executeEvent } from "@/lib/execution/router";
import type { InsightType, InsightPriority } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

export interface FestiveCheckResult {
  festivalsFound: number;
  insightsGenerated: number;
  eventsTriggered: number;
}

/**
 * Check today's date against the festival calendar.
 * For each matching festival, find leads in that region and 
 * generate insights (and optionally trigger events).
 */
export async function checkFestiveCalendar(businessId: string): Promise<FestiveCheckResult> {
  const enabled = await isFeatureEnabled(businessId, "festive_engine_enabled");
  if (!enabled) {
    return { festivalsFound: 0, insightsGenerated: 0, eventsTriggered: 0 };
  }

  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Find festivals active today
  const { data: festivals } = await supabase
    .from("festival_calendar")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today);

  if (!festivals || festivals.length === 0) {
    return { festivalsFound: 0, insightsGenerated: 0, eventsTriggered: 0 };
  }

  const result: FestiveCheckResult = {
    festivalsFound: festivals.length,
    insightsGenerated: 0,
    eventsTriggered: 0,
  };

  const engagementEnabled = await isFeatureEnabled(businessId, "engagement_engine_enabled");

  for (const festival of festivals) {
    // Find leads in the matching region
    const { data: leads } = await supabase
      .from("contacts")
      .select("id, email, phone, language, region")
      .eq("business_id", businessId)
      .eq("region", festival.region)
      .is("deleted_at", null)
      .limit(200);

    if (!leads || leads.length === 0) continue;

    // Dedup: check if festive insight already exists today
    const { data: existingInsight } = await supabase
      .from("insights")
      .select("id")
      .eq("business_id", businessId)
      .eq("type", "festive_trigger")
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    if (existingInsight && existingInsight.length > 0) continue;

    // Generate insight
    await supabase.from("insights").insert({
      business_id: businessId,
      type: "festive_trigger" as InsightType,
      priority: "medium" as InsightPriority,
      message: `${festival.festival_name} is active in ${festival.region}. ${leads.length} leads eligible for festive outreach.`,
      recommended_action: `Trigger ${festival.message_type} campaign for ${festival.region} leads.`,
      metadata: {
        festival_name: festival.festival_name,
        region: festival.region,
        lead_count: leads.length,
        message_type: festival.message_type,
      },
      status: "open",
    });
    result.insightsGenerated++;

    // If engagement engine is active, fire event
    if (engagementEnabled) {
      try {
        await executeEvent({
          business_id: businessId,
          event_type: "festive_trigger",
          mode: "live",
          payload: {
            _source: "festive_engine",
            festival_name: festival.festival_name,
            region: festival.region,
            message_type: festival.message_type,
            lead_count: leads.length,
            lead_ids: leads.map((l: any) => l.id).slice(0, 50),
          },
        });
        result.eventsTriggered++;
      } catch (err: any) {
        console.error(`[FESTIVE] Failed to trigger event for ${festival.festival_name}:`, err.message);
      }
    }
  }

  return result;
}
