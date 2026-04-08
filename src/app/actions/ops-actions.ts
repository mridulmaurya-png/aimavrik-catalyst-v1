"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import type { WorkspaceLifecycleStatus } from "@/lib/config/ops-constants";

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
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "WORKSPACE_LIFECYCLE_CHANGED",
    log_data_json: { 
      from: current?.status, 
      to: newStatus, 
      changed_by: admin.email,
      reason 
    },
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
  await requireAdmin();
  const supabase = await createAdminClient();

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

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteIntegration(integrationId: string, businessId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("client_integrations").delete().eq("id", integrationId);
  if (error) throw new Error(`Failed to delete integration: ${error.message}`);

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function testIntegrationConnection(integrationId: string, businessId: string) {
  await requireAdmin();
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
    // Basic config presence check
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
      } catch (e) {
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
  }

  // Update integration table with test result
  await supabase.from("client_integrations").update({
    health: result.status,
    last_tested_at: new Date().toISOString(),
    last_test_result: result.message
  } as any).eq("id", integrationId);

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
  }
) {
  await requireAdmin();
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
    output_channel: data.output_channel || "internal",
    fallback_action: data.fallback_action || null,
    mode: data.mode || "test",
    status: "draft",
    is_active: false,
    notes: data.notes || null,
  });

  if (error) throw new Error(`Failed to add automation: ${error.message}`);

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
  }
) {
  const admin = await requireAdmin();
  const supabase = await createAdminClient();

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
  
  // Auto-set approval/activation timestamps
  if (data.status === 'approved') {
    payload.approved_by = admin.email;
    payload.approved_at = new Date().toISOString();
  }
  if (data.status === 'active') {
    payload.activated_at = new Date().toISOString();
    payload.is_active = true;
  }
  if (data.status === 'paused' || data.status === 'blocked') {
    payload.is_active = false;
  }

  const { error } = await supabase
    .from("client_automations")
    .update(payload)
    .eq("id", automationId);

  if (error) throw new Error(`Failed to update automation: ${error.message}`);

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteAutomation(automationId: string, businessId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("client_automations").delete().eq("id", automationId);
  if (error) throw new Error(`Failed to delete automation: ${error.message}`);

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
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

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
}

export async function deleteOpsNote(noteId: string, businessId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const { error } = await supabase.from("ops_notes").delete().eq("id", noteId);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);

  revalidatePath(`/ops/workspaces/${businessId}`);
  return { success: true };
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
