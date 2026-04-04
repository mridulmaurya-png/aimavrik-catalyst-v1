import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { ShieldAlert, ChevronLeft } from "lucide-react";
import PlaybookDetailClient from "@/components/playbooks/playbook-detail-client";
import Link from "next/link";
import { formatCurrency } from "@/lib/config/constants";

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId, currencyCode } = await requireWorkspace();
  const supabase = await createClient();

  const { data: playbook, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", id)
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

  // Fetch real performance stats
  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { count: actionsCount } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("playbook_id", id);

  const { count: messagesCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const stats = {
    eventsProcessed: eventsCount || 0,
    actionsCreated: actionsCount || 0,
    messagesSent: messagesCount || 0,
    repliesReceived: 0,
    currencyCode,
  };

  return <PlaybookDetailClient playbook={playbook} stats={stats} />;
}
