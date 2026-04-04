"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";

export async function togglePlaybook(id: string, currentlyActive: boolean) {
  const supabase = await createClient();
  const { businessId } = await requireWorkspace();

  const { error } = await supabase
    .from("playbooks")
    .update({ is_active: !currentlyActive })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "PLAYBOOK_TOGGLED",
    log_data_json: { playbook_id: id, new_state: !currentlyActive }
  });

  revalidatePath("/playbooks");
  revalidatePath(`/playbooks/${id}`);
  revalidatePath("/dashboard");
  
  return { success: true };
}

export async function updatePlaybookConfig(id: string, newConfig: any) {
  const supabase = await createClient();
  const { businessId } = await requireWorkspace();

  // Merge-safe JSON update
  const { data: current } = await supabase
    .from("playbooks")
    .select("config_json")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (!current) throw new Error("Playbook not found");

  const mergedConfig = {
    ...current.config_json,
    ...newConfig
  };

  const { error } = await supabase
    .from("playbooks")
    .update({ config_json: mergedConfig })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "PLAYBOOK_CONFIG_UPDATED",
    log_data_json: { playbook_id: id, keys_updated: Object.keys(newConfig) }
  });

  revalidatePath(`/playbooks/${id}`);
  revalidatePath("/playbooks");

  return { success: true };
}

export async function activatePlaybook(id: string) {
  const supabase = await createClient();
  const { businessId } = await requireWorkspace();

  const { error } = await supabase
    .from("playbooks")
    .update({ is_active: true })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "PLAYBOOK_ACTIVATED",
    log_data_json: { playbook_id: id }
  });

  // Create event record for playbook activation
  await supabase.from("events").insert({
    business_id: businessId,
    event_type: "playbook_activated",
    source: "system",
    status: "processed",
    dedupe_key: `playbook_activate:${id}:${Date.now()}`,
    payload_json: { playbook_id: id, action: "activated" }
  });

  revalidatePath("/playbooks");
  revalidatePath("/dashboard");

  return { success: true };
}
