"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendSystemNotification, ONBOARDING_EMAILS } from "@/lib/mail/system";

export async function createWorkspace(data: { name: string, type: string, timezone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const businessName = data.name;
  const businessType = data.type;
  const timezone = data.timezone || "UTC";

  // 1. Create the business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      owner_user_id: user.id,
      business_name: businessName,
      business_type: businessType,
      timezone: timezone,
      status: "signup_received",
    })
    .select()
    .single();

  if (bizError) {
    return { error: bizError.message };
  }

  // 2. Initialize business settings
  const { error: settingsError } = await supabase
    .from("business_settings")
    .insert({
      business_id: business.id,
      communication_hours_json: { start: "09:00", end: "18:00" },
      brand_voice_json: { tone: "Professional", style: "Direct" },
    });

  if (settingsError) {
    return { error: settingsError.message };
  }

  // 3. Create team membership (Owner)
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // 4. Send Signup Received Email
  try {
    const name = user.user_metadata?.full_name || "there";
    const emailData = ONBOARDING_EMAILS.SIGNUP_RECEIVED(name);
    await sendSystemNotification(user.email!, emailData.subject, emailData.body);
  } catch (e) {
    console.error("Signup email failed to send, but workspace was created:", e);
  }

  return { success: true, businessId: business.id };
}
