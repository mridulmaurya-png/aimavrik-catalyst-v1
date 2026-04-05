"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/context";
import { WorkspaceStatus } from "@/lib/config/constants";

/**
 * Update the status of any workspace/business.
 * This should be restricted to Ops/System roles.
 * For now we check if the user belongs to the AiMavrik main business or has an admin flag.
 */
export async function updateWorkspaceStatus(businessId: string, newStatus: WorkspaceStatus) {
  const user = await requireUser();
  const supabase = await createClient();

  // ACCESS CONTROL: For V1, we check if the user is in the AiMavrik Demo business 
  // (d1111111-1111-1111-1111-111111111111) or is the owner.
  // In a real prod app, this would check a dedicated 'is_admin' field or internal RBAC.
  const { data: membership } = await supabase
    .from("team_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isOpsUser = membership?.business_id === "d1111111-1111-1111-1111-111111111111" || membership?.role === "owner";

  if (!isOpsUser) {
    throw new Error("Unauthorized. Only AiMavrik Ops can perform this action.");
  }

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
    log_data_json: { new_status: newStatus, updated_by: user.id }
  });

  return { success: true };
}
