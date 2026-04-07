"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/context";
import { WorkspaceStatus } from "@/lib/config/constants";

/**
 * Legacy status update — kept for backward compatibility.
 * New code should use updateWorkspaceLifecycle from ops-actions.ts
 */
export async function updateWorkspaceStatus(businessId: string, newStatus: WorkspaceStatus) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Perform Update
  const { error } = await supabase
    .from("businesses")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) throw error;

  // Audit Log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "WORKSPACE_STATUS_CHANGED",
    log_data_json: { new_status: newStatus, updated_by: admin.id }
  });

  return { success: true };
}
