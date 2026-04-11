/**
 * Intelligence Layer — Type Definitions
 */

export type InsightType =
  | "no_response"
  | "followup_not_triggered"
  | "channel_failure"
  | "language_mismatch"
  | "high_drop_off"
  | "reengagement_opportunity"
  | "festive_trigger"
  | "region_based_opportunity";

export type InsightPriority = "low" | "medium" | "high" | "critical";

export type InsightStatus = "open" | "acknowledged" | "acted" | "dismissed";

export interface InsightRow {
  id: string;
  business_id: string;
  lead_id?: string;
  type: InsightType;
  priority: InsightPriority;
  message: string;
  recommended_action?: string;
  status: InsightStatus;
  metadata: Record<string, any>;
  created_at: string;
  acted_at?: string;
  acted_by?: string;
}

export interface InsightGenerationResult {
  generated: number;
  insights: Array<{
    type: InsightType;
    priority: InsightPriority;
    lead_id?: string;
    message: string;
  }>;
}

// Insight → Event mapping
export const INSIGHT_TO_EVENT_MAP: Record<string, string> = {
  no_response: "lead_unresponsive",
  language_mismatch: "language_mismatch_detected",
  festive_trigger: "festive_trigger",
  region_based_opportunity: "region_based_opportunity",
  reengagement_opportunity: "lead_unresponsive",
};

export function getInsightLabel(type: string): string {
  const labels: Record<string, string> = {
    no_response: "No Response",
    followup_not_triggered: "Follow-up Not Triggered",
    channel_failure: "Channel Delivery Failure",
    language_mismatch: "Language Mismatch",
    high_drop_off: "High Drop-off",
    reengagement_opportunity: "Re-engagement Opportunity",
    festive_trigger: "Festive Trigger",
    region_based_opportunity: "Region-Based Opportunity",
  };
  return labels[type] || type;
}

export function getInsightPriorityColor(priority: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (priority) {
    case "critical": return "error";
    case "high": return "warning";
    case "medium": return "info";
    case "low": return "neutral";
    default: return "neutral";
  }
}
