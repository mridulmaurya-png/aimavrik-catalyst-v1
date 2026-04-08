import { requireAdmin } from "@/lib/auth/context";
import { getWorkspaceDetail } from "@/app/actions/ops-actions";
import { WorkspaceDetailShell } from "@/components/ops/workspace-detail-shell";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  
  const detail = await getWorkspaceDetail(id);
  
  if (!detail.business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-functional-error/10 rounded-full text-functional-error">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-heading-3 font-bold">Workspace not found</h1>
        <p className="text-body-sm text-brand-text-tertiary">The requested business ID does not exist in the management database.</p>
        <Link href="/ops/workspaces">
          <Button variant="secondary">Back to Workspaces</Button>
        </Link>
      </div>
    );
  }

  return <WorkspaceDetailShell data={detail as any} />;
}
