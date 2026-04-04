"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const businessName = formData.get("businessName") as string;
  const businessType = formData.get("businessType") as string;
  const timezone = formData.get("timezone") as string || "UTC";

  // 1. Create the business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      owner_user_id: user.id,
      business_name: businessName,
      business_type: businessType,
      timezone: timezone,
    })
    .select()
    .single();

  if (bizError) throw bizError;

  // 2. Initialize business settings
  const { error: settingsError } = await supabase
    .from("business_settings")
    .insert({
      business_id: business.id,
      communication_hours_json: { start: "09:00", end: "18:00" },
      brand_voice_json: { tone: "Professional", style: "Direct" },
    });

  if (settingsError) throw settingsError;

  // 3. Create team membership (Owner)
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) throw memberError;

  redirect("/dashboard");
}
