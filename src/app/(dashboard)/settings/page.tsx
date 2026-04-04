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

  if (error || !settings) {
    return (
      <div className="p-12 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
        <h2 className="text-heading-3 font-bold">Workspace Configuration Error</h2>
        <p className="text-body-sm text-brand-text-secondary">
          Could not load business settings. The workspace might not be fully bootstrapped.
        </p>
      </div>
    );
  }

  return <SettingsClient initialBusiness={business} initialSettings={settings} />;
}
