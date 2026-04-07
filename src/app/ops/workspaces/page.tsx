import { requireAdmin } from "@/lib/auth/context";
import { getWorkspacesList } from "@/app/actions/ops-actions";
import { OpsWorkspacesTable } from "@/components/ops/workspaces-table";
import { ShieldCheck, Building2 } from "lucide-react";

export default async function OpsWorkspacesPage() {
  await requireAdmin();
  const workspaces = await getWorkspacesList();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-brand-primary" />
            <h1 className="text-heading-2 font-bold tracking-tight">Client Workspaces</h1>
          </div>
          <p className="text-body-sm text-brand-text-tertiary ml-9">
            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""} under management
          </p>
        </div>
      </div>

      {/* Workspaces Table */}
      <OpsWorkspacesTable workspaces={workspaces as any} />
    </div>
  );
}
