import { PlaybookGridItem } from "@/components/playbooks/playbook-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldAlert, Inbox } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PLAYBOOK_CATEGORIES, formatCurrency } from "@/lib/config/constants";

export default async function PlaybooksPage() {
  const { businessId, currencyCode } = await requireWorkspace();
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

  // Fetch real stats per playbook
  const { data: actionCounts } = await supabase
    .from("actions")
    .select("playbook_id")
    .eq("business_id", businessId);

  const countMap: Record<string, number> = {};
  (actionCounts || []).forEach(a => {
    if (a.playbook_id) countMap[a.playbook_id] = (countMap[a.playbook_id] || 0) + 1;
  });

  // Group by category
  const grouped = new Map<string, any[]>();
  (playbooks || []).forEach(pb => {
    const cat = pb.config_json?.category || "uncategorized";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(pb);
  });

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Revenue Playbooks</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Activate pre-built systems that automate follow-up, recovery, and conversion.
          </p>
        </div>
        <Button disabled title="Custom playbook creation — coming in V2" className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed">
          <Zap className="w-5 h-5" />
          Create playbook
        </Button>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-3">
        {PLAYBOOK_CATEGORIES.map(cat => {
          const count = grouped.get(cat.id)?.length || 0;
          return (
            <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-bg-secondary/50 border border-brand-border/40">
              <span className="text-body-sm font-bold text-brand-text-primary capitalize">{cat.name}</span>
              <Badge variant="neutral" className="text-[9px] px-1.5 py-0">{count}</Badge>
            </div>
          );
        })}
      </div>

      {playbooks && playbooks.length > 0 ? (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([catId, pbs]) => {
            const catConfig = PLAYBOOK_CATEGORIES.find(c => c.id === catId);
            return (
              <div key={catId} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-heading-4 font-bold capitalize">{catConfig?.name || catId.replace(/_/g, ' ')}</h3>
                  <p className="text-body-sm text-brand-text-tertiary">{catConfig?.description || ""}</p>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pbs.map((playbook) => (
                    <PlaybookGridItem
                      key={playbook.id}
                      id={playbook.id}
                      name={playbook.playbook_type}
                      category={catConfig?.name || catId.replace(/_/g, ' ')}
                      status={playbook.is_active ? 'active' : 'paused'}
                      description={playbook.config_json?.description || "Activate this playbook to start processing."}
                      events={(countMap[playbook.id] || 0).toString()}
                      conversions="0"
                      revenue={formatCurrency(0, currencyCode)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 border rounded-xl border-dashed border-brand-border flex flex-col items-center justify-center gap-3">
          <Inbox className="w-8 h-8 text-brand-text-tertiary opacity-40" />
          <p className="text-brand-text-tertiary font-bold tracking-wider uppercase text-sm">No Playbooks Configured</p>
          <p className="text-body-sm text-brand-text-tertiary">Complete onboarding to initialize your default playbooks.</p>
        </div>
      )}
    </div>
  );
}
