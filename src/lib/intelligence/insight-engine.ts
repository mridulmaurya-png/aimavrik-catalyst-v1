/**
 * Insight Engine — Rule-Based Intelligence Generator
 * 
 * Analyzes automation_runs, event logs, and lead data to generate
 * actionable insights. Only runs when intelligence_layer_enabled flag is true.
 * 
 * Does NOT trigger any execution. Insights are read-only until
 * the insight_events_enabled flag is activated.
 */

import { createClient } from "@supabase/supabase-js";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import type { InsightType, InsightPriority, InsightGenerationResult } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

// ═══════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════

export async function generateInsights(businessId: string): Promise<InsightGenerationResult> {
  const enabled = await isFeatureEnabled(businessId, "intelligence_layer_enabled");
  if (!enabled) {
    return { generated: 0, insights: [] };
  }

  const supabase = getServiceClient();
  const newInsights: Array<{
    type: InsightType;
    priority: InsightPriority;
    lead_id?: string;
    message: string;
    recommended_action?: string;
    metadata?: Record<string, any>;
  }> = [];

  // ─── Rule 1: No response after 24h ───
  const noResponseInsights = await checkNoResponse(supabase, businessId);
  newInsights.push(...noResponseInsights);

  // ─── Rule 2: Follow-up not triggered ───
  const followupInsights = await checkFollowupNotTriggered(supabase, businessId);
  newInsights.push(...followupInsights);

  // ─── Rule 3: Channel failures ───
  const channelInsights = await checkChannelFailures(supabase, businessId);
  newInsights.push(...channelInsights);

  // ─── Rule 4: Language mismatch (only if data exists) ───
  const langEnabled = await isFeatureEnabled(businessId, "language_region_enabled");
  if (langEnabled) {
    const langInsights = await checkLanguageMismatch(supabase, businessId);
    newInsights.push(...langInsights);
  }

  // ─── Insert new insights (deduped) ───
  let insertedCount = 0;
  for (const insight of newInsights) {
    // Dedup: check if same type+lead_id combo exists in last 24h with open status
    const { data: existing } = await supabase
      .from("insights")
      .select("id")
      .eq("business_id", businessId)
      .eq("type", insight.type)
      .eq("lead_id", insight.lead_id || "")
      .eq("status", "open")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing && existing.length > 0) continue;

    await supabase.from("insights").insert({
      business_id: businessId,
      lead_id: insight.lead_id || null,
      type: insight.type,
      priority: insight.priority,
      message: insight.message,
      recommended_action: insight.recommended_action || null,
      metadata: insight.metadata || {},
      status: "open",
    });
    insertedCount++;
  }

  return {
    generated: insertedCount,
    insights: newInsights.map(i => ({
      type: i.type,
      priority: i.priority,
      lead_id: i.lead_id,
      message: i.message,
    })),
  };
}

// ═══════════════════════════════════════════════════
// RULE IMPLEMENTATIONS
// ═══════════════════════════════════════════════════

async function checkNoResponse(supabase: any, businessId: string) {
  const insights: any[] = [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find runs where lead_created was executed but no customer_replied event followed
  const { data: runs } = await supabase
    .from("automation_runs")
    .select("id, trigger_event, payload, created_at")
    .eq("business_id", businessId)
    .eq("trigger_event", "lead_created")
    .in("status", ["completed", "handed_off"])
    .lte("created_at", cutoff)
    .limit(50);

  if (!runs) return insights;

  for (const run of runs) {
    const entityId = run.payload?._entity_id || run.payload?.entity_id;
    if (!entityId) continue;

    // Check if a reply event exists for this entity
    const { data: replies } = await supabase
      .from("automation_runs")
      .select("id")
      .eq("business_id", businessId)
      .eq("trigger_event", "customer_replied")
      .limit(1);

    if (!replies || replies.length === 0) {
      insights.push({
        type: "no_response" as InsightType,
        priority: "medium" as InsightPriority,
        lead_id: entityId,
        message: `Lead ${entityId} has not responded 24h after initial outreach.`,
        recommended_action: "Trigger re-engagement via alternate channel.",
        metadata: { source_run_id: run.id, hours_elapsed: 24 },
      });
    }
  }

  return insights;
}

async function checkFollowupNotTriggered(supabase: any, businessId: string) {
  const insights: any[] = [];

  // Find leads that had lead_created but no followup_due was executed
  const { data: leads } = await supabase
    .from("automation_runs")
    .select("id, payload, created_at")
    .eq("business_id", businessId)
    .eq("trigger_event", "lead_created")
    .in("status", ["completed", "handed_off"])
    .limit(50);

  if (!leads) return insights;

  for (const lead of leads) {
    const entityId = lead.payload?._entity_id || lead.payload?.entity_id;
    if (!entityId) continue;

    const { data: followups } = await supabase
      .from("scheduled_followups")
      .select("id, status")
      .eq("business_id", businessId)
      .eq("entity_id", entityId)
      .limit(1);

    if (!followups || followups.length === 0) {
      insights.push({
        type: "followup_not_triggered" as InsightType,
        priority: "high" as InsightPriority,
        lead_id: entityId,
        message: `Follow-up was never scheduled for lead ${entityId}.`,
        recommended_action: "Check automation configuration for followup_due trigger.",
        metadata: { source_run_id: lead.id },
      });
    }
  }

  return insights;
}

async function checkChannelFailures(supabase: any, businessId: string) {
  const insights: any[] = [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check for recent failed execution runs
  const { data: failures } = await supabase
    .from("automation_runs")
    .select("id, trigger_event, execution_engine, output_channel, blocked_reason, created_at")
    .eq("business_id", businessId)
    .eq("status", "failed")
    .gte("created_at", cutoff)
    .limit(20);

  if (!failures || failures.length === 0) return insights;

  // Group failures by channel
  const channelFailures: Record<string, number> = {};
  for (const f of failures) {
    const channel = f.output_channel || "unknown";
    channelFailures[channel] = (channelFailures[channel] || 0) + 1;
  }

  for (const [channel, count] of Object.entries(channelFailures)) {
    if (count >= 3) {
      insights.push({
        type: "channel_failure" as InsightType,
        priority: "critical" as InsightPriority,
        message: `${count} delivery failures on ${channel} channel in the last 24 hours.`,
        recommended_action: `Check ${channel} integration health and credentials.`,
        metadata: { channel, failure_count: count },
      });
    }
  }

  return insights;
}

async function checkLanguageMismatch(supabase: any, businessId: string) {
  const insights: any[] = [];

  // Get automations with supported_languages defined
  const { data: automations } = await supabase
    .from("client_automations")
    .select("id, automation_name, supported_languages, default_language")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (!automations) return insights;

  for (const auto of automations) {
    const supported = auto.supported_languages || [];
    if (supported.length === 0) continue;

    // Check if any recent leads have unsupported languages
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, language")
      .eq("business_id", businessId)
      .not("language", "is", null)
      .limit(100);

    if (!contacts) continue;

    for (const contact of contacts) {
      if (contact.language && !supported.includes(contact.language)) {
        insights.push({
          type: "language_mismatch" as InsightType,
          priority: "low" as InsightPriority,
          lead_id: contact.id,
          message: `Contact ${contact.id} speaks "${contact.language}" which is not in supported languages for "${auto.automation_name}".`,
          recommended_action: `Add "${contact.language}" to automation supported languages or set up language-specific workflow.`,
          metadata: {
            contact_language: contact.language,
            automation_id: auto.id,
            supported: supported,
          },
        });
      }
    }
  }

  return insights;
}
