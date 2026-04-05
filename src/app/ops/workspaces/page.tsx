import { OpsWorkspaceList } from "@/components/ops/workspace-list";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/context";
import { ShieldCheck, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function OpsWorkspacesPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch all workspaces with their settings and onboarding submissions
  const { data: workspaces } = await supabase
    .from("businesses")
    .select(`
      id, 
      business_name, 
      status, 
      created_at,
      business_settings(config_json),
      onboarding_submissions(*)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto pt-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-brand-primary" />
          <h1 className="text-heading-1 font-bold tracking-tight text-brand-text-primary">Ops Control Center</h1>
        </div>
        <p className="text-body-sm text-brand-text-tertiary">
          Manage workspace activation, approval gating, and execution readiness.
        </p>
      </div>

      <Card variant="elevated" className="p-4 border-blue-500/30 bg-blue-500/5 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Managed SaaS Rules</p>
          <p className="text-[11px] text-brand-text-secondary leading-relaxed">
            Execution is ONLY allowed for workspaces in <b>Active</b> status. <br />
            Ensure Resend / WhatsApp connectors are configured before activating a live workspace.
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between pl-1">
          <h2 className="text-heading-4 font-bold uppercase tracking-widest text-brand-text-tertiary">All Workspaces ({workspaces?.length || 0})</h2>
        </div>
        <OpsWorkspaceList initialWorkspaces={workspaces as any || []} />
      </div>
    </div>
  );
}
