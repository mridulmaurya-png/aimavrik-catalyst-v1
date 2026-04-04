import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";
import { ShieldAlert } from "lucide-react";

export default async function SettingsPage() {
  const { businessId, business } = await requireWorkspace();
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("business_id", businessId)
    .single();

  const safeSettings = settings || {
    business_id: businessId,
    communication_hours_json: { timezone: "UTC", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    quiet_hours_json: { start: "22:00", end: "08:00" },
    brand_voice_json: { tone: "Professional", restrictedWords: [] },
    cta_preferences_json: { style: "Direct" },
    followup_rules_json: { maxAttempts: 3, delayHours: 24 }
  };

  return <SettingsClient initialBusiness={business} initialSettings={safeSettings} />;
}
