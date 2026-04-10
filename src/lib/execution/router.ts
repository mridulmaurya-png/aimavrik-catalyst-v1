/**
 * Execution Router — Core Managed Execution Engine
 * 
 * This is the single entry point for all execution in Catalyst.
 * Event → Router → Engine → Channel → Logs
 * 
 * Every execution goes through:
 * 1. Workspace gating (lifecycle check)
 * 2. Automation matching (trigger_event match)
 * 3. Automation lifecycle validation (must be approved/active)
 * 4. Integration health check (required integration must be healthy)
 * 5. Engine resolution (internal, n8n, webhook, manual_hold)
 * 6. Execution handoff
 * 7. Structured logging to automation_runs
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Use a loose type to avoid generic parameter mismatches between supabase-js versions
type AnySupabaseClient = SupabaseClient<any, any, any>;
import { executeN8n } from "./engines/n8n";
import { executeWebhook } from "./engines/webhook";
import type {
  ExecutionRequest,
  ExecutionResult,
  RunStatus,
  BlockReasonCode,
  EngineHandoffPayload,
  AutomationRow,
  ExecutionEngine,
} from "./types";
import {
  EXECUTION_ALLOWED_STATUSES,
  EXECUTABLE_STATUSES,
  HEALTHY_INTEGRATION_STATUSES,
} from "./types";

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ═══════════════════════════════════════════════════
// MAIN ROUTER
// ═══════════════════════════════════════════════════

export async function executeEvent(request: ExecutionRequest): Promise<ExecutionResult[]> {
  const supabase = getServiceClient();
  const results: ExecutionResult[] = [];
  const startedAt = new Date().toISOString();

  // ─────────────────────────────────────────────────
  // STEP 1: Workspace Lifecycle Gating
  // ─────────────────────────────────────────────────
  const { data: workspace } = await supabase
    .from("businesses")
    .select("id, status, business_name")
    .eq("id", request.business_id)
    .single();

  if (!workspace) {
    return [await createBlockedResult(request, null, "WORKSPACE_INACTIVE", "Workspace not found.", startedAt, supabase)];
  }

  const isAllowed = (EXECUTION_ALLOWED_STATUSES as readonly string[]).includes(workspace.status || "");
  
  // For test mode on ready_for_activation workspaces, allow it
  const isTestOnPreLive = request.mode === "test" && workspace.status === "ready_for_activation";
  
  if (!isAllowed && !isTestOnPreLive) {
    return [await createBlockedResult(
      request, null, "WORKSPACE_INACTIVE",
      `Workspace status "${workspace.status}" does not allow execution. Must be: ${EXECUTION_ALLOWED_STATUSES.join(", ")}.`,
      startedAt, supabase
    )];
  }

  // ─────────────────────────────────────────────────
  // STEP 2: Find Matching Automations
  // ─────────────────────────────────────────────────
  const { data: automations } = await supabase
    .from("client_automations")
    .select("*")
    .eq("business_id", request.business_id)
    .eq("trigger_event", request.event_type);

  if (!automations || automations.length === 0) {
    return [await createBlockedResult(
      request, null, "NO_MATCHING_AUTOMATION",
      `No automation configured for trigger event "${request.event_type}" in this workspace.`,
      startedAt, supabase
    )];
  }

  // ─────────────────────────────────────────────────
  // STEP 3-6: Process Each Matching Automation
  // ─────────────────────────────────────────────────
  for (const automation of automations as AutomationRow[]) {
    const result = await processAutomation(supabase, request, automation, startedAt);
    results.push(result);
  }

  return results;
}

// ═══════════════════════════════════════════════════
// PROCESS SINGLE AUTOMATION
// ═══════════════════════════════════════════════════

async function processAutomation(
  supabase: AnySupabaseClient,
  request: ExecutionRequest,
  automation: AutomationRow,
  startedAt: string
): Promise<ExecutionResult> {

  // ─────────────────────────────────────────────────
  // STEP 3: Automation Lifecycle Check
  // ─────────────────────────────────────────────────
  const isExecutable = (EXECUTABLE_STATUSES as string[]).includes(automation.status);
  
  // Allow test mode to run 'approved' automations even if not yet 'active'
  const isTestRun = request.mode === "test";
  const canExecute = isExecutable || (isTestRun && automation.status === "approved");

  if (!canExecute) {
    return await createBlockedResult(
      request, automation.id, "AUTOMATION_NOT_EXECUTABLE",
      `Automation "${automation.automation_name}" has status "${automation.status}". Must be approved or active to execute.`,
      startedAt, supabase
    );
  }

  // ─────────────────────────────────────────────────
  // STEP 4: Integration Health Check
  // ─────────────────────────────────────────────────
  if (automation.required_integration_id) {
    const { data: integ } = await supabase
      .from("client_integrations")
      .select("id, status, health, provider")
      .eq("id", automation.required_integration_id)
      .single();

    if (!integ) {
      return await createBlockedResult(
        request, automation.id, "INTEGRATION_MISSING",
        `Required integration (ID: ${automation.required_integration_id}) not found.`,
        startedAt, supabase
      );
    }

    if (!HEALTHY_INTEGRATION_STATUSES.includes(integ.status)) {
      return await createBlockedResult(
        request, automation.id, "INTEGRATION_UNHEALTHY",
        `Required integration "${integ.provider}" has status "${integ.status}" (health: ${integ.health || "unknown"}). Must be connected.`,
        startedAt, supabase
      );
    }
  } else if (automation.required_integration_type) {
    // Check by type instead of specific ID
    const { data: integ } = await supabase
      .from("client_integrations")
      .select("id, status, health, provider")
      .eq("business_id", request.business_id)
      .eq("integration_type", automation.required_integration_type)
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (!integ) {
      return await createBlockedResult(
        request, automation.id, "INTEGRATION_MISSING",
        `No connected integration of type "${automation.required_integration_type}" found for this workspace.`,
        startedAt, supabase
      );
    }
  }

  // ─────────────────────────────────────────────────
  // STEP 5: Resolve Execution Engine
  // ─────────────────────────────────────────────────
  const engine = (automation.execution_engine || "internal") as ExecutionEngine;
  const channel = automation.output_channel || "internal_task";
  const mode = request.mode || (automation.mode as "test" | "live") || "test";

  // Create the run log entry (status: running)
  const runId = crypto.randomUUID();
  await supabase.from("automation_runs").insert({
    id: runId,
    business_id: request.business_id,
    automation_id: automation.id,
    trigger_event: request.event_type,
    execution_engine: engine,
    output_channel: channel,
    mode: mode,
    status: "running" as RunStatus,
    request_payload: request.payload || {},
    started_at: startedAt,
  });

  // ─────────────────────────────────────────────────
  // STEP 6: Execute via Engine
  // ─────────────────────────────────────────────────
  try {
    const handoffPayload: EngineHandoffPayload = {
      run_id: runId,
      workspace_id: request.business_id,
      automation_id: automation.id,
      automation_name: automation.automation_name,
      trigger_event: request.event_type,
      output_channel: channel,
      mode: mode,
      payload: request.payload || {},
      timestamp: startedAt,
    };

    let finalStatus: RunStatus;
    let handoffReference: string | undefined;
    let responsePayload: Record<string, any> = {};

    switch (engine) {
      case "n8n": {
        const targetUrl = automation.webhook_url || "";
        if (!targetUrl) {
          return await finalizeRun(supabase, runId, automation, "blocked", "ENGINE_NOT_CONFIGURED",
            `n8n engine selected but no webhook_url configured on automation.`, startedAt);
        }

        // Look up auth token from integration if available
        let authToken: string | undefined;
        if (automation.required_integration_id) {
          const { data: integ } = await supabase
            .from("client_integrations")
            .select("config_json")
            .eq("id", automation.required_integration_id)
            .single();
          authToken = (integ?.config_json as any)?.auth_token;
        }

        const n8nResult = await executeN8n({
          url: targetUrl,
          payload: handoffPayload,
          authToken,
          timeoutMs: 30000,
        });

        if (n8nResult.success) {
          finalStatus = "handed_off";
          handoffReference = n8nResult.handoff_reference;
          responsePayload = { response_code: n8nResult.response_code, body: n8nResult.response_body };
        } else {
          return await finalizeRun(supabase, runId, automation, "failed", "EXECUTION_ERROR",
            `n8n handoff failed: ${n8nResult.error}`, startedAt, { error: n8nResult.error });
        }
        break;
      }

      case "webhook": {
        const targetUrl = automation.webhook_url || "";
        if (!targetUrl) {
          return await finalizeRun(supabase, runId, automation, "blocked", "ENGINE_NOT_CONFIGURED",
            `Webhook engine selected but no webhook_url configured.`, startedAt);
        }

        let headers: Record<string, string> = {};
        let authToken: string | undefined;
        if (automation.required_integration_id) {
          const { data: integ } = await supabase
            .from("client_integrations")
            .select("config_json")
            .eq("id", automation.required_integration_id)
            .single();
          const config = integ?.config_json as any;
          authToken = config?.auth_token;
          headers = config?.headers || {};
        }

        const webhookResult = await executeWebhook({
          url: targetUrl,
          payload: handoffPayload,
          headers,
          authToken,
          timeoutMs: 30000,
        });

        if (webhookResult.success) {
          finalStatus = "handed_off";
          handoffReference = webhookResult.handoff_reference;
          responsePayload = { response_code: webhookResult.response_code, body: webhookResult.response_body };
        } else {
          return await finalizeRun(supabase, runId, automation, "failed", "EXECUTION_ERROR",
            `Webhook handoff failed: ${webhookResult.error}`, startedAt, { error: webhookResult.error });
        }
        break;
      }

      case "manual_hold": {
        finalStatus = "handed_off";
        handoffReference = "manual_hold";
        responsePayload = { message: "Execution held for manual operator action." };
        break;
      }

      case "internal":
      default: {
        // Internal engine — log as completed for now.
        // Real internal execution (message send, etc.) hooks can be added here.
        finalStatus = "completed";
        responsePayload = { 
          message: mode === "test" 
            ? "Test execution completed (no real action taken)." 
            : "Internal execution completed.",
          mode,
        };
        break;
      }
    }

    // ─────────────────────────────────────────────────
    // STEP 7: Finalize Run
    // ─────────────────────────────────────────────────
    const completedAt = new Date().toISOString();

    await supabase.from("automation_runs").update({
      status: finalStatus,
      handoff_reference: handoffReference || null,
      response_payload: responsePayload,
      completed_at: completedAt,
    }).eq("id", runId);

    // Update automation last run stats
    await supabase.from("client_automations").update({
      last_run_at: completedAt,
      last_run_status: finalStatus,
      last_result: finalStatus === "completed" || finalStatus === "handed_off" ? "success" : "failure",
      run_count: (automation.run_count || 0) + 1,
      updated_at: completedAt,
    }).eq("id", automation.id);

    // Audit log
    await supabase.from("audit_logs").insert({
      business_id: request.business_id,
      log_type: "EXECUTION_COMPLETED",
      log_data_json: {
        run_id: runId,
        automation_id: automation.id,
        automation_name: automation.automation_name,
        trigger_event: request.event_type,
        engine,
        channel,
        mode,
        status: finalStatus,
        handoff_reference: handoffReference,
      },
    });

    return {
      run_id: runId,
      automation_id: automation.id,
      status: finalStatus,
      engine,
      channel,
      handoff_reference: handoffReference,
      response_payload: responsePayload,
      started_at: startedAt,
      completed_at: completedAt,
    };

  } catch (error: any) {
    return await finalizeRun(supabase, runId, automation, "failed", "EXECUTION_ERROR",
      `Unhandled execution error: ${error.message}`, startedAt, { error: error.message, stack: error.stack });
  }
}

// ═══════════════════════════════════════════════════
// HELPER: Create Blocked Result (pre-run)
// ═══════════════════════════════════════════════════

async function createBlockedResult(
  request: ExecutionRequest,
  automationId: string | null,
  code: BlockReasonCode,
  reason: string,
  startedAt: string,
  supabase: AnySupabaseClient
): Promise<ExecutionResult> {
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();

  await supabase.from("automation_runs").insert({
    id: runId,
    business_id: request.business_id,
    automation_id: automationId,
    trigger_event: request.event_type,
    execution_engine: "internal",
    output_channel: "internal_task",
    mode: request.mode || "test",
    status: "blocked" as RunStatus,
    blocked_reason: reason,
    request_payload: request.payload || {},
    started_at: startedAt,
    completed_at: now,
  });

  await supabase.from("audit_logs").insert({
    business_id: request.business_id,
    log_type: "EXECUTION_BLOCKED",
    log_data_json: {
      run_id: runId,
      automation_id: automationId,
      trigger_event: request.event_type,
      blocked_code: code,
      blocked_reason: reason,
      mode: request.mode || "test",
    },
  });

  return {
    run_id: runId,
    automation_id: automationId,
    status: "blocked",
    engine: "internal",
    channel: "internal_task",
    blocked_reason: reason,
    blocked_code: code,
    started_at: startedAt,
    completed_at: now,
  };
}

// ═══════════════════════════════════════════════════
// HELPER: Finalize Run (mid-execution failure/block)
// ═══════════════════════════════════════════════════

async function finalizeRun(
  supabase: AnySupabaseClient,
  runId: string,
  automation: AutomationRow,
  status: RunStatus,
  code: BlockReasonCode,
  reason: string,
  startedAt: string,
  responsePayload?: Record<string, any>
): Promise<ExecutionResult> {
  const now = new Date().toISOString();

  await supabase.from("automation_runs").update({
    status,
    blocked_reason: reason,
    response_payload: responsePayload || {},
    completed_at: now,
  }).eq("id", runId);

  await supabase.from("client_automations").update({
    last_run_at: now,
    last_run_status: status,
    last_result: "failure",
    run_count: (automation.run_count || 0) + 1,
    updated_at: now,
  }).eq("id", automation.id);

  await supabase.from("audit_logs").insert({
    business_id: automation.business_id,
    log_type: `EXECUTION_${status.toUpperCase()}`,
    log_data_json: {
      run_id: runId,
      automation_id: automation.id,
      blocked_code: code,
      blocked_reason: reason,
    },
  });

  return {
    run_id: runId,
    automation_id: automation.id,
    status,
    engine: (automation.execution_engine || "internal") as ExecutionEngine,
    channel: automation.output_channel || "internal_task",
    blocked_reason: reason,
    blocked_code: code,
    started_at: startedAt,
    completed_at: now,
  };
}
