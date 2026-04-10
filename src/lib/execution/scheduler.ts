/**
 * Scheduled Follow-up Engine
 * 
 * Handles scheduling and processing of follow-up events.
 * After a lead_created execution succeeds, the router calls scheduleFollowUp()
 * to queue a followup_due event for later processing.
 * 
 * The cron endpoint calls processScheduledFollowUps() to pick up due items
 * and fire them through the execution router.
 */

import { createClient } from "@supabase/supabase-js";
import { executeEvent } from "./router";
import type { ExecutionResult } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

// ═══════════════════════════════════════════════════
// SCHEDULE A FOLLOW-UP
// ═══════════════════════════════════════════════════

export interface ScheduleFollowUpInput {
  business_id: string;
  entity_id?: string;
  entity_type?: string;
  automation_id?: string;
  source_run_id?: string;
  payload?: Record<string, any>;
  delay_minutes?: number;
  trigger_event?: string;
}

export async function scheduleFollowUp(input: ScheduleFollowUpInput) {
  const supabase = getServiceClient();
  const delayMs = (input.delay_minutes || 15) * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs).toISOString();

  const { data, error } = await supabase.from("scheduled_followups").insert({
    business_id: input.business_id,
    automation_id: input.automation_id || null,
    trigger_event: input.trigger_event || "followup_due",
    entity_type: input.entity_type || "lead",
    entity_id: input.entity_id || null,
    payload: {
      ...input.payload,
      _followup_source_run: input.source_run_id,
      _scheduled_at: new Date().toISOString(),
      _delay_minutes: input.delay_minutes || 15,
    },
    scheduled_for: scheduledFor,
    status: "pending",
    source_run_id: input.source_run_id || null,
  }).select("id").single();

  if (error) {
    console.error("[SCHEDULER] Failed to schedule follow-up:", error.message);
    return { success: false, error: error.message };
  }

  console.log(`[SCHEDULER] Follow-up scheduled: ${data.id} for ${scheduledFor}`);
  return { success: true, followup_id: data.id, scheduled_for: scheduledFor };
}

// ═══════════════════════════════════════════════════
// PROCESS DUE FOLLOW-UPS
// Called by cron endpoint to pick up and execute 
// ═══════════════════════════════════════════════════

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{
    followup_id: string;
    status: "executed" | "failed";
    execution_results?: ExecutionResult[];
    error?: string;
  }>;
}

export async function processScheduledFollowUps(limit: number = 20): Promise<ProcessResult> {
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Pick up due follow-ups
  const { data: dueItems, error: fetchError } = await supabase
    .from("scheduled_followups")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (fetchError || !dueItems || dueItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results: ProcessResult["results"] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of dueItems) {
    try {
      // Execute through the managed router
      const executionResults = await executeEvent({
        business_id: item.business_id,
        event_type: item.trigger_event || "followup_due",
        entity_id: item.entity_id,
        mode: "live",
        payload: {
          ...(item.payload || {}),
          _followup_id: item.id,
          _original_scheduled_for: item.scheduled_for,
        },
      });

      // Check if any execution succeeded
      const anySuccess = executionResults.some(
        r => r.status === "completed" || r.status === "handed_off"
      );

      const firstRunId = executionResults[0]?.run_id || null;

      // Update follow-up status
      await supabase.from("scheduled_followups").update({
        status: anySuccess ? "executed" : "failed",
        executed_at: new Date().toISOString(),
        execution_run_id: firstRunId,
      }).eq("id", item.id);

      if (anySuccess) succeeded++;
      else failed++;

      results.push({
        followup_id: item.id,
        status: anySuccess ? "executed" : "failed",
        execution_results: executionResults,
      });

    } catch (err: any) {
      failed++;
      await supabase.from("scheduled_followups").update({
        status: "failed",
        executed_at: new Date().toISOString(),
      }).eq("id", item.id);

      results.push({
        followup_id: item.id,
        status: "failed",
        error: err.message,
      });
    }
  }

  return {
    processed: results.length,
    succeeded,
    failed,
    results,
  };
}

// ═══════════════════════════════════════════════════
// CANCEL PENDING FOLLOW-UPS
// For when a lead responds before follow-up fires
// ═══════════════════════════════════════════════════

export async function cancelFollowUps(businessId: string, entityId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("scheduled_followups")
    .update({ status: "cancelled" })
    .eq("business_id", businessId)
    .eq("entity_id", entityId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[SCHEDULER] Failed to cancel follow-ups:", error.message);
    return { success: false, cancelled: 0 };
  }

  console.log(`[SCHEDULER] Cancelled ${data?.length || 0} follow-ups for entity ${entityId}`);
  return { success: true, cancelled: data?.length || 0 };
}
