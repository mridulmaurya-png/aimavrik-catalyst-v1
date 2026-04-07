import { requireAdmin } from "@/lib/auth/context";
import { getWorkspaceDetail } from "@/app/actions/ops-actions";
import { WorkspaceDetailShell } from "@/components/ops/workspace-detail-shell";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  
  const detail = await getWorkspaceDetail(id);
  
  if (!detail.business) {
    notFound();
  }

  return <WorkspaceDetailShell data={detail as any} />;
}
