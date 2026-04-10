"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import type { WorkspaceLifecycleStatus } from "@/lib/config/ops-constants";
import { executeEvent } from "@/lib/execution/router";
import { scheduleFollowUp, processScheduledFollowUps } from "@/lib/execution/scheduler";

// ═══════════════════════════════════════════════════
// AUDIT LOGGING HELPER
// Every ops action must log to history.
// ═══════════════════════════════════════════════════

async function logOpsAudit(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  businessId: string,
  actorEmail: string,
  actionType: string,
  targetObject: string,
  details: Record<string, any> = {}
) {
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: actionType,
    log_data_json: {
      actor_email: actorEmail,
      action_type: actionType,
      target_object: targetObject,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
}

// ═══════════════════════════════════════════════════
// WORKSPACE LIFECYCLE ACTIONS
// ═══════════════════════════════════════════════════

export async function updateWorkspaceLifecycle(
  businessId: string, 
  newStatus: WorkspaceLifecycleStatus,
  reason?: string
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Get current status for history
  const { data: current } = await supabase
    .from("businesses")
    .select("status")
    .eq("id", businessId)
    .maybeSingle();

  // Update status
  const { error } = await supabase
    .from("businesses")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  // Record history
  await supabase.from("workspace_status_history").insert({
    business_id: businessId,
    old_status: current?.status || null,
    new_status: newStatus,
    changed_by: admin.email || "unknown",
    reason: reason || null,
  });

  // Audit log
  await logOpsAudit(supabase, businessId, admin.email || "unknown", "WORKSPACE_LIFECYCLE_CHANGED", `workspace:${businessId}`, {
    from: current?.status,
    to: newStatus,
    reason,
  });

  revalidatePath("/ops/workspaces");
  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════
// INTEGRATION ACTIONS
// ═══════════════════════════════════════════════════

export async function addIntegration(
  businessId: string,
  data: {
    integration_type: string;
    provider: string;
    status: string;
    notes?: string;
    config_json?: Record<string, any>;
    execution_mode?: string;
    connection_reference?: string;
    webhook_url?: string;
    api_base_url?: string;
    external_account_id?: string;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("client_integrations").insert({
    business_id: businessId,
    integration_type: data.integration_type,
    provider: data.provider,
    status: data.status,
    notes: data.notes || null,
    config_json: data.config_json || {},
    execution_mode: data.execution_mode || "internal",
    connection_reference: data.connection_reference || null,
    webhook_url: data.webhook_url || null,
    api_base_url: data.api_base_url || null,
    external_account_id: data.external_account_id || null,
    configured_by: admin.email,
    connected_at: data.status === "connected" ? new Date().toISOString() : null,
  });

  if (error) throw new Error(`Failed to add integration: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "INTEGRATION_ADDED", `integration:${data.provider}`, {
    integration_type: data.integration_type,
    provider: data.provider,
    status: data.status,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function updateIntegration(
  integrationId: string,
  businessId: string,
  data: {
    status?: string;
    health?: string;
    notes?: string;
    provider?: string;
    last_sync_at?: string;
    execution_mode?: string;
    connection_reference?: string;
    webhook_url?: string;
    api_base_url?: string;
    external_account_id?: string;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Get before state
  const { data: before } = await supabase
    .from("client_integrations")
    .select("status, health, provider")
    .eq("id", integrationId)
    .single();

  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.status !== undefined) {
    payload.status = data.status;
    if (data.status === "connected") payload.connected_at = new Date().toISOString();
  }
  if (data.health !== undefined) payload.health = data.health;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.provider !== undefined) payload.provider = data.provider;
  if (data.last_sync_at !== undefined) payload.last_sync_at = data.last_sync_at;
  if (data.execution_mode !== undefined) payload.execution_mode = data.execution_mode;
  if (data.connection_reference !== undefined) payload.connection_reference = data.connection_reference;
  if (data.webhook_url !== undefined) payload.webhook_url = data.webhook_url;
  if (data.api_base_url !== undefined) payload.api_base_url = data.api_base_url;
  if (data.external_account_id !== undefined) payload.external_account_id = data.external_account_id;

  const { error } = await supabase
    .from("client_integrations")
    .update(payload)
    .eq("id", integrationId);

  if (error) throw new Error(`Failed to update integration: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "INTEGRATION_UPDATED", `integration:${integrationId}`, {
    before: { status: before?.status, health: before?.health },
    after: data,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteIntegration(integrationId: string, businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { data: before } = await supabase
    .from("client_integrations")
    .select("provider, integration_type")
    .eq("id", integrationId)
    .single();

  const { error } = await supabase.from("client_integrations").delete().eq("id", integrationId);
  if (error) throw new Error(`Failed to delete integration: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "INTEGRATION_DELETED", `integration:${integrationId}`, {
    provider: before?.provider,
    integration_type: before?.integration_type,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function testIntegrationConnection(integrationId: string, businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Get integration details
  const { data: integ } = await supabase
    .from("client_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (!integ) throw new Error("Integration not found");

  let result: { status: "healthy" | "degraded" | "critical" | "unknown", message: string } = { status: "unknown", message: "No test logic for this provider yet." };

  if (integ.integration_type === "email" && integ.provider === "Resend") {
    const { data: biz } = await supabase.from("business_settings").select("config_json").eq("business_id", businessId).single();
    const config = biz?.config_json as any || {};
    if (config.resend_api_key && config.resend_from_email) {
      result = { status: "healthy", message: "Resend configuration found." };
    } else {
      result = { status: "critical", message: "Resend API Key or From Email missing in settings." };
    }
  } else if (integ.integration_type === "n8n" || integ.execution_mode === "n8n") {
    const url = integ.webhook_url || (integ.api_base_url as string);
    if (url) {
      try {
        const res = await fetch(url, { method: "HEAD" }).catch(() => null);
        if (res) {
          result = { status: "healthy", message: "n8n endpoint is reachable." };
        } else {
          result = { status: "degraded", message: "n8n endpoint did not respond to ping." };
        }
      } catch {
        result = { status: "critical", message: "Network error reaching n8n." };
      }
    } else {
      result = { status: "critical", message: "No URL configured for n8n integration." };
    }
  } else if (integ.integration_type === "whatsapp") {
    const { data: biz } = await supabase.from("business_settings").select("config_json").eq("business_id", businessId).single();
    const config = biz?.config_json as any || {};
    if (config.whatsapp_api_key && config.whatsapp_sender_id) {
      result = { status: "healthy", message: "WhatsApp configuration found." };
    } else {
      result = { status: "critical", message: "WhatsApp API Key or Sender ID missing." };
    }
  } else if (integ.integration_type === "webhook") {
    const url = integ.webhook_url;
    if (url) {
      try {
        const res = await fetch(url, { method: "HEAD" }).catch(() => null);
        result = res 
          ? { status: "healthy", message: "Webhook endpoint is reachable." }
          : { status: "degraded", message: "Webhook endpoint did not respond." };
      } catch {
        result = { status: "critical", message: "Network error reaching webhook." };
      }
    } else {
      result = { status: "critical", message: "No webhook URL configured." };
    }
  }

  // Update integration table with test result
  await supabase.from("client_integrations").update({
    health: result.status,
    last_tested_at: new Date().toISOString(),
    last_test_result: result.message
  } as any).eq("id", integrationId);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "INTEGRATION_TESTED", `integration:${integrationId}`, {
    provider: integ.provider,
    test_result: result,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return result;
}

// ═══════════════════════════════════════════════════
// AUTOMATION ACTIONS
// ═══════════════════════════════════════════════════

export async function addAutomation(
  businessId: string,
  data: {
    automation_name: string;
    automation_type: string;
    trigger_description?: string;
    mode?: string;
    notes?: string;
    trigger_event?: string;
    execution_engine?: string;
    webhook_url?: string;
    workflow_id?: string;
    output_channel?: string;
    fallback_action?: string;
    required_integration_type?: string;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("client_automations").insert({
    business_id: businessId,
    automation_name: data.automation_name,
    automation_type: data.automation_type,
    trigger_description: data.trigger_description || null,
    trigger_event: data.trigger_event || null,
    execution_engine: data.execution_engine || "internal",
    webhook_url: data.webhook_url || null,
    workflow_id: data.workflow_id || null,
    output_channel: data.output_channel || "internal_task",
    fallback_action: data.fallback_action || "block",
    required_integration_type: data.required_integration_type || null,
    mode: data.mode || "test",
    status: "draft",
    is_active: false,
    notes: data.notes || null,
  });

  if (error) throw new Error(`Failed to add automation: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "AUTOMATION_ADDED", `automation:${data.automation_name}`, {
    automation_type: data.automation_type,
    trigger_event: data.trigger_event,
    execution_engine: data.execution_engine,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function updateAutomation(
  automationId: string,
  businessId: string,
  data: {
    is_active?: boolean;
    mode?: string;
    health?: string;
    notes?: string;
    approved_by?: string;
    approved_at?: string;
    last_result?: string;
    status?: string;
    trigger_event?: string;
    execution_engine?: string;
    webhook_url?: string;
    workflow_id?: string;
    output_channel?: string;
    fallback_action?: string;
    required_integration_type?: string;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Get before state
  const { data: before } = await supabase
    .from("client_automations")
    .select("status, is_active, mode, automation_name")
    .eq("id", automationId)
    .single();

  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.mode !== undefined) payload.mode = data.mode;
  if (data.health !== undefined) payload.health = data.health;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.last_result !== undefined) payload.last_result = data.last_result;
  if (data.status !== undefined) payload.status = data.status;
  if (data.trigger_event !== undefined) payload.trigger_event = data.trigger_event;
  if (data.execution_engine !== undefined) payload.execution_engine = data.execution_engine;
  if (data.webhook_url !== undefined) payload.webhook_url = data.webhook_url;
  if (data.workflow_id !== undefined) payload.workflow_id = data.workflow_id;
  if (data.output_channel !== undefined) payload.output_channel = data.output_channel;
  if (data.fallback_action !== undefined) payload.fallback_action = data.fallback_action;
  if (data.required_integration_type !== undefined) payload.required_integration_type = data.required_integration_type;
  
  // Auto-set approval/activation timestamps
  if (data.status === 'approved') {
    payload.approved_by = admin.email;
    payload.approved_at = new Date().toISOString();
  }
  if (data.status === 'active') {
    payload.activated_at = new Date().toISOString();
    payload.is_active = true;
  }
  if (data.status === 'paused' || data.status === 'failed' || data.status === 'archived') {
    payload.is_active = false;
  }

  const { error } = await supabase
    .from("client_automations")
    .update(payload)
    .eq("id", automationId);

  if (error) throw new Error(`Failed to update automation: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "AUTOMATION_UPDATED", `automation:${automationId}`, {
    automation_name: before?.automation_name,
    before: { status: before?.status, is_active: before?.is_active, mode: before?.mode },
    after: data,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteAutomation(automationId: string, businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { data: before } = await supabase
    .from("client_automations")
    .select("automation_name, automation_type")
    .eq("id", automationId)
    .single();

  const { error } = await supabase.from("client_automations").delete().eq("id", automationId);
  if (error) throw new Error(`Failed to delete automation: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "AUTOMATION_DELETED", `automation:${automationId}`, {
    automation_name: before?.automation_name,
    automation_type: before?.automation_type,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════
// TEST EXECUTION ACTION
// Simulates trigger → router → engine → logs
// Never affects real client users unless in live mode
// ═══════════════════════════════════════════════════

export async function testExecuteAutomation(automationId: string, businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Get automation details
  const { data: automation } = await supabase
    .from("client_automations")
    .select("*")
    .eq("id", automationId)
    .single();

  if (!automation) throw new Error("Automation not found");

  const triggerEvent = automation.trigger_event || "manual_trigger";

  // Execute through the router in TEST mode
  const results = await executeEvent({
    business_id: businessId,
    event_type: triggerEvent,
    mode: "test",
    payload: {
      _test: true,
      _triggered_by: admin.email,
      _triggered_at: new Date().toISOString(),
      automation_id: automationId,
      automation_name: automation.automation_name,
    },
    trigger_context: {
      source: "ops_test_execution",
      operator: admin.email,
    },
  });

  // Audit log
  await logOpsAudit(supabase, businessId, admin.email || "unknown", "AUTOMATION_TEST_EXECUTED", `automation:${automationId}`, {
    automation_name: automation.automation_name,
    trigger_event: triggerEvent,
    results: results.map(r => ({ run_id: r.run_id, status: r.status, blocked_reason: r.blocked_reason })),
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true, results };
}

// ═══════════════════════════════════════════════════
// OPS NOTES ACTIONS
// ═══════════════════════════════════════════════════

export async function addOpsNote(businessId: string, content: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("ops_notes").insert({
    business_id: businessId,
    author_email: admin.email || "unknown",
    content,
  });

  if (error) throw new Error(`Failed to add note: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "NOTE_ADDED", `note:new`, {
    content_preview: content.substring(0, 100),
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteOpsNote(noteId: string, businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("ops_notes").delete().eq("id", noteId);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "NOTE_DELETED", `note:${noteId}`, {});

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════
// GO-LIVE READINESS CHECK
// Returns structured readiness assessment
// ═══════════════════════════════════════════════════

export async function checkGoLiveReadiness(businessId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const [bizResult, intResult, autoResult, runsResult] = await Promise.all([
    supabase.from("businesses").select("status, onboarding_submissions(id)").eq("id", businessId).single(),
    supabase.from("client_integrations").select("id, status, health").eq("business_id", businessId),
    supabase.from("client_automations").select("id, status, execution_engine").eq("business_id", businessId),
    supabase.from("automation_runs").select("id, status, mode").eq("business_id", businessId).eq("mode", "test").eq("status", "completed").limit(1),
  ]);

  const biz = bizResult.data;
  const integrations = intResult.data || [];
  const automations = autoResult.data || [];
  const testRuns = runsResult.data || [];

  const checks = [
    {
      label: "Onboarding Submitted",
      ready: !!(biz as any)?.onboarding_submissions?.length,
      reason: "Client onboarding form has not been submitted.",
    },
    {
      label: "At Least One Integration Connected",
      ready: integrations.some(i => i.status === "connected"),
      reason: "No integrations are in 'connected' status.",
    },
    {
      label: "At Least One Automation Approved",
      ready: automations.some(a => a.status === "approved" || a.status === "active"),
      reason: "No automations have been approved or activated.",
    },
    {
      label: "Delivery Engine Configured",
      ready: automations.some(a => a.execution_engine && a.execution_engine !== "internal") || automations.some(a => a.status === "approved" || a.status === "active"),
      reason: "No delivery engine (n8n, webhook) is configured on any automation.",
    },
    {
      label: "Execution Test Passed",
      ready: testRuns.length > 0,
      reason: "No successful test execution has been recorded.",
    },
    {
      label: "Workspace Lifecycle Eligible",
      ready: ["ready_for_activation", "active"].includes(biz?.status || ""),
      reason: `Workspace status is "${biz?.status || "unknown"}". Must be "ready_for_activation" or "active".`,
    },
  ];

  const allReady = checks.every(c => c.ready);
  const blockingReasons = checks.filter(c => !c.ready).map(c => c.reason);

  return { allReady, checks, blockingReasons };
}

// ═══════════════════════════════════════════════════
// WORKSPACE DETAIL DATA FETCHER
// ═══════════════════════════════════════════════════

export async function getWorkspaceDetail(businessId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Parallel fetch all workspace data
  const [
    bizResult,
    integrationsResult,
    automationsResult,
    notesResult,
    historyResult,
    contactsCountResult,
    eventsCountResult,
    actionsCountResult,
    lastEventResult,
    lastActionResult,
    playbooksResult,
    executionRunsResult,
  ] = await Promise.all([
    // Business + onboarding + settings + owner
    supabase
      .from("businesses")
      .select(`
        id, business_name, business_type, website, timezone, currency_code, status, created_at, updated_at, owner_email,
        business_settings(config_json),
        onboarding_submissions(*),
        team_members(user_id, role, users:user_id(email, full_name, avatar_url))
      `)
      .eq("id", businessId)
      .maybeSingle(),

    // Integrations
    supabase
      .from("client_integrations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),

    // Automations
    supabase
      .from("client_automations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),

    // Notes
    supabase
      .from("ops_notes")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),

    // Status history
    supabase
      .from("workspace_status_history")
      .select("*")
      .eq("business_id", businessId)
      .order("changed_at", { ascending: false })
      .limit(20),

    // Contacts count
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    // Events count
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    // Actions count
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    // Last event
    supabase
      .from("events")
      .select("created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Last action
    supabase
      .from("actions")
      .select("created_at, status")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Playbooks
    supabase
      .from("playbooks")
      .select("id, playbook_type, is_active")
      .eq("business_id", businessId),

    // Execution runs (latest 50)
    supabase
      .from("automation_runs")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (bizResult.error) return { business: null };

  return {
    business: bizResult.data,
    integrations: integrationsResult.data || [],
    automations: automationsResult.data || [],
    notes: notesResult.data || [],
    history: historyResult.data || [],
    health: {
      contactsCount: contactsCountResult.count || 0,
      eventsCount: eventsCountResult.count || 0,
      actionsCount: actionsCountResult.count || 0,
      lastEventAt: lastEventResult.data?.created_at || null,
      lastActionAt: lastActionResult.data?.created_at || null,
      lastActionStatus: lastActionResult.data?.status || null,
    },
    playbooks: playbooksResult.data || [],
    executionRuns: executionRunsResult.data || [],
  };
}

// ═══════════════════════════════════════════════════
// WORKSPACE LIST DATA FETCHER
// ═══════════════════════════════════════════════════

export async function getWorkspacesList() {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Fetch all workspaces with aggregated data
  const { data: workspaces, error } = await supabase
    .from("businesses")
    .select(`
      id, 
      business_name, 
      status, 
      created_at,
      updated_at,
      owner_email,
      business_settings(config_json),
      onboarding_submissions(id, submitted_at),
      team_members(user_id, role, users:user_id(email))
    `)
    .order("created_at", { ascending: false });

  if (error || !workspaces || workspaces.length === 0) return [];

  // Enrich with counts
  const enriched = await Promise.all(
    workspaces.map(async (ws) => {
      const [intCount, autoCount] = await Promise.all([
        supabase
          .from("client_integrations")
          .select("id", { count: "exact", head: true })
          .eq("business_id", ws.id)
          .eq("status", "connected"),
        supabase
          .from("client_automations")
          .select("id", { count: "exact", head: true })
          .eq("business_id", ws.id)
          .eq("is_active", true),
      ]);

      const ownerMember = (ws.team_members as any[])?.find((m: any) => m.role === "owner");
      const ownerEmail = ws.owner_email || (ownerMember?.users as any)?.email || "—";

      return {
        ...ws,
        owner_email: ownerEmail,
        integrations_connected: intCount.count || 0,
        automations_active: autoCount.count || 0,
        onboarding_submitted: (ws.onboarding_submissions as any[])?.length > 0,
      };
    })
  );

  return enriched;
}

// ═══════════════════════════════════════════════════
// SIMULATE LEAD EVENT
// Fires a test lead_created event through the managed router
// from the Ops panel. Logs everything.
// ═══════════════════════════════════════════════════

export async function simulateLeadEvent(businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const testEntityId = `test_lead_${Date.now()}`;

  // Fire through the managed router
  const results = await executeEvent({
    business_id: businessId,
    event_type: "lead_created",
    entity_id: testEntityId,
    mode: "test",
    payload: {
      _test: true,
      _simulated: true,
      _triggered_by: admin.email,
      _triggered_at: new Date().toISOString(),
      lead_name: "Test Lead (Simulated)",
      lead_email: "test@example.com",
      lead_phone: "+1555000000",
      lead_source: "ops_simulation",
    },
    trigger_context: {
      source: "ops_simulate_lead",
      operator: admin.email,
    },
  });

  // If execution succeeded, also schedule a test follow-up
  const anySucceeded = results.some(
    r => r.status === "completed" || r.status === "handed_off"
  );

  let followupScheduled = false;
  if (anySucceeded) {
    const schedResult = await scheduleFollowUp({
      business_id: businessId,
      entity_id: testEntityId,
      entity_type: "lead",
      source_run_id: results[0]?.run_id,
      payload: {
        _test: true,
        original_event_type: "lead_created",
        original_entity_id: testEntityId,
      },
      delay_minutes: 15,
    });
    followupScheduled = schedResult.success;
  }

  // Audit
  await logOpsAudit(supabase, businessId, admin.email || "unknown", "LEAD_EVENT_SIMULATED", `simulation:${testEntityId}`, {
    entity_id: testEntityId,
    results: results.map(r => ({ run_id: r.run_id, status: r.status, engine: r.engine })),
    followup_scheduled: followupScheduled,
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true, results, followup_scheduled: followupScheduled };
}

// ═══════════════════════════════════════════════════
// SEED LEAD WORKFLOW
// Creates the two starter automations for a workspace:
// 1. Instant Lead Response (lead_created → n8n)
// 2. Follow-up on No Reply (followup_due → n8n)
// ═══════════════════════════════════════════════════

export async function seedLeadWorkflow(businessId: string, n8nWebhookUrl?: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  // Check if automations already exist
  const { data: existing } = await supabase
    .from("client_automations")
    .select("id, trigger_event")
    .eq("business_id", businessId)
    .in("trigger_event", ["lead_created", "followup_due"]);

  if (existing && existing.length >= 2) {
    return { success: false, error: "Workflow automations already exist for this workspace." };
  }

  const automationsToCreate = [];

  const hasLeadCreated = existing?.some(a => a.trigger_event === "lead_created");
  const hasFollowup = existing?.some(a => a.trigger_event === "followup_due");

  if (!hasLeadCreated) {
    automationsToCreate.push({
      business_id: businessId,
      automation_name: "Instant Lead Response",
      automation_type: "lead_response",
      trigger_description: "Fires when a new lead is captured via CRM, form, or API.",
      trigger_event: "lead_created",
      execution_engine: n8nWebhookUrl ? "n8n" : "internal",
      webhook_url: n8nWebhookUrl || null,
      output_channel: "whatsapp",
      fallback_action: "block",
      required_integration_type: n8nWebhookUrl ? "n8n" : null,
      mode: "test",
      status: "draft",
      is_active: false,
    });
  }

  if (!hasFollowup) {
    automationsToCreate.push({
      business_id: businessId,
      automation_name: "Follow-up on No Reply",
      automation_type: "follow_up",
      trigger_description: "Fires 15 minutes after lead_created if no response received.",
      trigger_event: "followup_due",
      execution_engine: n8nWebhookUrl ? "n8n" : "internal",
      webhook_url: n8nWebhookUrl || null,
      output_channel: "email",
      fallback_action: "block",
      required_integration_type: n8nWebhookUrl ? "n8n" : null,
      mode: "test",
      status: "draft",
      is_active: false,
    });
  }

  if (automationsToCreate.length > 0) {
    const { error } = await supabase
      .from("client_automations")
      .insert(automationsToCreate);

    if (error) throw new Error(`Failed to seed automations: ${error.message}`);
  }

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "WORKFLOW_SEEDED", `workspace:${businessId}`, {
    automations_created: automationsToCreate.map(a => a.automation_name),
    n8n_webhook_url: n8nWebhookUrl || "none",
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true, created: automationsToCreate.length };
}

// ═══════════════════════════════════════════════════
// PROCESS SCHEDULED FOLLOW-UPS (Manual Trigger)
// Allows ops to manually trigger the cron processor
// ═══════════════════════════════════════════════════

export async function processScheduledFollowUpsAction(businessId?: string) {
  const admin = await requireAdmin();
  const result = await processScheduledFollowUps(20);

  if (businessId) {
    revalidatePath(`/ops/workspaces/${businessId}`);
  }

  return { success: true, ...result };
}

// ═══════════════════════════════════════════════════
// GENERATE / REGENERATE WORKSPACE API KEY
// ═══════════════════════════════════════════════════

export async function generateWorkspaceApiKey(businessId: string) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

  const apiKey = `cat_${crypto.randomUUID().replace(/-/g, "")}`;

  const { error } = await supabase
    .from("businesses")
    .update({ api_key: apiKey })
    .eq("id", businessId);

  if (error) throw new Error(`Failed to generate API key: ${error.message}`);

  await logOpsAudit(supabase, businessId, admin.email || "unknown", "API_KEY_GENERATED", `workspace:${businessId}`, {
    key_prefix: apiKey.substring(0, 8) + "...",
  });

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true, api_key: apiKey };
}
