"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/auth/context";

export async function updateBusinessSetting(field: string, newValue: any) {
  const supabase = await createClient();
  const { businessId } = await requireWorkspace();

  // Validate the field is allowed (Merge-safe JSON updates vs text fields)
  const allowedFields = ["support_email", "support_phone", "brand_voice_json", "communication_hours_json"];
  if (!allowedFields.includes(field)) {
    throw new Error("Invalid field update");
  }

  // If this is a JSONB update, we use raw SQL or a merge query via RPC.
  // Since Supabase `update` replaces the entire row value if we pass JSON, 
  // we must fetch, merge, and save.
  let payload = newValue;
  if (field.endsWith("_json")) {
    const { data: current } = await supabase
      .from("business_settings")
      .select(field)
      .eq("business_id", businessId)
      .single();
    
    // Merge existing keys with new keys safely
    const row = current as Record<string, any> | null;
    payload = {
      ...(row?.[field] || {}),
      ...newValue
    };
  }

  const { error } = await supabase
    .from("business_settings")
    .update({ [field]: payload })
    .eq("business_id", businessId);

  if (error) {
    throw error;
  }

  // Lightweight Audit Log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "SETTINGS_UPDATED",
    log_data_json: { field }
  });

  return { success: true };
}
