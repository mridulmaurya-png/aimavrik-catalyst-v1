import { PlaybookTabs } from "@/components/playbooks/playbook-tabs";
import { PlaybookGridItem } from "@/components/playbooks/playbook-card";
import { Button } from "@/components/ui/button";
import { Plus, Zap, ShieldAlert } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function PlaybooksPage() {
  const { businessId, business } = await requireWorkspace();
  const supabase = await createClient();

  const { data: playbooks, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
        <h2 className="text-heading-3 mt-4 font-bold">Failed to load playbooks</h2>
      </div>
    );
  }

  // Determine category simply for the UI. Ideally we might store category in config_json or a dedicated column.
  // Using the business type as a safe default category visualizer.
  const uiCategory = business.business_type === 'Service Business' ? 'Services' : 'D2C';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Revenue Playbooks</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Activate pre-built systems that automate follow-up, recovery, and conversion.
          </p>
        </div>
        <Button className="gap-2 h-11 px-6">
          <Zap className="w-5 h-5" />
          Activate playbook
        </Button>
      </div>

      <div className="space-y-6">
        <PlaybookTabs />
        
        {playbooks && playbooks.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {playbooks.map((playbook) => (
              <PlaybookGridItem 
                key={playbook.id}
                id={playbook.id}
                name={playbook.playbook_type}
                category={playbook.config_json?.category || uiCategory}
                status={playbook.is_active ? 'active' : 'paused'}
                description={playbook.config_json?.description || "Activate this playbook to start processing events and sending automated responses."}
                events="0"
                conversions="0"
                revenue="$0"
              />
            ))}
          </div>
        ) : (
          <div className="p-16 border rounded-xl border-dashed border-brand-border flex items-center justify-center">
            <p className="text-brand-text-tertiary font-bold tracking-wider uppercase text-sm">No Playbooks Generated</p>
          </div>
        )}
      </div>
    </div>
  );
}
