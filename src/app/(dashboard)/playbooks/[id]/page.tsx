import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { ShieldAlert } from "lucide-react";
import PlaybookDetailClient from "@/components/playbooks/playbook-detail-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function PlaybookDetailPage({ params }: { params: { id: string } }) {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const { data: playbook, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (error || !playbook) {
    return (
      <div className="space-y-8 pb-12">
        <Link href="/playbooks" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Playbooks
        </Link>
        <div className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
          <h2 className="text-heading-3 mt-4 font-bold">Playbook not found</h2>
          <p className="text-body-sm text-brand-text-secondary mt-2">The requested playbook is either missing or unauthorized.</p>
        </div>
      </div>
    );
  }

  return <PlaybookDetailClient playbook={playbook} />;
}
