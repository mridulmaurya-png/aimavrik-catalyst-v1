import { KPICard } from "@/components/dashboard/kpi-card";
import { PlaybookCard } from "@/components/dashboard/playbook-card";
import { ExecutionFeed } from "@/components/dashboard/execution-feed";
import { ExecutionTrigger } from "@/components/dashboard/execution-trigger";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { computeSegments, buildRevenueOpportunities, buildSuggestedActions } from "@/lib/engine/segments";
import { formatCurrency } from "@/lib/config/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TrendingUp, Sparkles, ArrowRight, Target, DollarSign, RefreshCw, Megaphone, ShieldAlert, Flag } from "lucide-react";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { OnboardingStatusPanel } from "@/components/onboarding/status-panel";

export default async function DashboardPage() {
  const { businessId, currencyCode, businessStatus } = await requireWorkspace();
  const supabase = await createClient();

  // If no workspace yet, force requirements form
  if (!businessId) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-display-l font-bold tracking-tight">Welcome to AiMavrik</h1>
            <p className="text-body-lg text-brand-text-secondary">Let's initialize your managed AI revenue architecture.</p>
        </div>
        <OnboardingForm />
      </div>
    );
  }

  // Fetch Business Data
  const { data: business } = await supabase
    .from("businesses")
    .select("business_name, status")
    .eq("id", businessId)
    .maybeSingle();

  const status = business?.status || businessStatus || "signup_received";

  // Data Fetching logic (Restored)
  const [contactsCount, messagesCount, queuedCount, failedCount, eventsCount, allPlaybooks, recentEvents, recentActions, interventionQueue] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("business_id", businessId).in("status", ["queued", "scheduled", "processing"]).then(r => r.count),
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "failed").then(r => r.count),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("playbooks").select("*").eq("business_id", businessId).then(r => r.data),
    supabase.from("events").select("id, event_type, source, status, created_at, contact:contacts(full_name)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5).then(r => r.data),
    supabase.from("actions").select("id, action_type, channel, status, created_at, contact:contacts(full_name)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5).then(r => r.data),
    supabase.from("contacts").select("id, full_name, stage, metadata_json").eq("business_id", businessId).contains("metadata_json", { needs_intervention: true }).limit(5).then(r => r.data)
  ]);

  const activePlaybooks = allPlaybooks?.filter(p => p.is_active) || [];
  const segments = await computeSegments(supabase, businessId);
  const revenueOps = buildRevenueOpportunities(segments, contactsCount || 0);
  const suggestedActions = buildSuggestedActions(segments, activePlaybooks.length);
  const activeSegments = segments.filter(s => s.count > 0);

  const KPI_DATA = [
    { label: "Contacts", value: (contactsCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "Total in CRM" },
    { label: "Events", value: (eventsCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "All sources" },
    { label: "Active Playbooks", value: activePlaybooks.length.toString(), trend: activePlaybooks.length > 0 ? "Running" : "None", trendType: activePlaybooks.length > 0 ? "positive" : "neutral", context: `${allPlaybooks?.length || 0} total` },
    { label: "Messages", value: (messagesCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "All channels" },
    { label: "Queued", value: (queuedCount || 0).toLocaleString(), trend: "Active", trendType: "neutral", context: "Pending", isPrioritized: !!queuedCount },
    { label: "Failed", value: (failedCount || 0).toLocaleString(), trend: failedCount ? "Attention" : "Clean", trendType: failedCount ? "negative" : "positive", context: "Errors", isPrioritized: !!failedCount },
  ];

  const feedItems = [
    ...(recentEvents || []).map(e => ({
      id: `evt_${e.id}`,
      type: e.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Event",
      contact: (Array.isArray(e.contact) ? (e.contact[0] as any)?.full_name : (e.contact as any)?.full_name) || "System",
      summary: `Source: ${e.source || 'unknown'}`,
      time: e.created_at,
      status: e.status === "processed" ? "completed" : e.status || "queued",
      sortTime: new Date(e.created_at).getTime()
    })),
    ...(recentActions || []).map(a => ({
      id: `act_${a.id}`,
      type: `Action: ${a.action_type?.replace(/_/g, ' ') || 'Unknown'}`,
      contact: (Array.isArray(a.contact) ? (a.contact[0] as any)?.full_name : (a.contact as any)?.full_name) || "System",
      summary: `Channel: ${a.channel || 'system'}`,
      time: a.created_at,
      status: a.status === "failed" ? "failed" : a.status === "completed" ? "completed" : a.status === "handed_off" ? "handed_off" : a.status === "blocked" ? "blocked" : "queued",
      sortTime: new Date(a.created_at).getTime()
    }))
  ].sort((a, b) => b.sortTime - a.sortTime).slice(0, 8);

  const LIVE_FEED = feedItems.map(item => ({ ...item, time: formatTimeAgo(item.time) }));

  // 1. If Onboarding not started, show the guided requirement form
  if (status === "signup_received" || status === "onboarding_not_started") {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-display-l font-bold tracking-tight">Welcome, {business?.business_name}</h1>
            <p className="text-body-lg text-brand-text-secondary">Let's initialize your managed AI revenue architecture.</p>
        </div>
        <OnboardingForm />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <OnboardingStatusPanel businessStatus={status} />

      <div className="flex items-center justify-between pb-2 pt-4 border-t border-brand-border/20">
         <h2 className="text-xl font-bold tracking-tight">System Overview</h2>
         <ExecutionTrigger queuedCount={queuedCount || 0} businessStatus={status} />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} trendType={kpi.trendType as any} />
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <h3 className="text-heading-3 font-bold">Revenue Opportunities</h3>
            </div>
            <Link href="/segments" className="text-body-sm text-brand-primary font-bold hover:underline flex items-center gap-1">
              View segments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
             {revenueOps.slice(0, 4).map((op, i) => (
                <Card key={i} variant="elevated" className="p-5 space-y-3 group hover:border-brand-primary/30 transition-all">
                  <h4 className="text-body-sm font-bold text-brand-text-primary">{op.title}</h4>
                  <p className="text-[11px] text-brand-text-tertiary">{op.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/30">
                    <span className="text-heading-4 font-bold text-brand-primary">{op.count}</span>
                    <Link href={op.href} className="text-[11px] text-brand-primary font-bold hover:underline flex items-center gap-1">{op.cta} <ArrowRight className="w-3 h-3" /></Link>
                  </div>
                </Card>
             ))}
          </div>
        </section>
        <section className="lg:col-span-1 h-[500px]">
           <ExecutionFeed items={LIVE_FEED as any} />
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-functional-error"><ShieldAlert className="w-5 h-5" /><h3 className="text-heading-3 font-bold text-brand-text-primary">Intervention Queue</h3></div>
          {interventionQueue && interventionQueue.length > 0 ? (
            <div className="space-y-3">
              {interventionQueue.map((c: any) => (
                <Card key={c.id} variant="elevated" className="p-4 flex items-center justify-between gap-4 border-functional-error/30 bg-functional-error/5 group">
                  <div className="flex items-center gap-3">
                    <Flag className="w-4 h-4 text-functional-error" />
                    <p className="text-body-sm font-bold">{c.full_name}</p>
                  </div>
                  <Link href={`/contacts/${c.id}`} className="text-[11px] text-functional-error font-bold flex items-center gap-1">Resolve <ArrowRight className="w-3 h-3" /></Link>
                </Card>
              ))}
            </div>
          ) : ( <div className="p-8 border border-brand-border border-dashed rounded-xl text-center"><p className="text-[11px] uppercase tracking-widest text-brand-text-tertiary">Queue Clear</p></div> )}
        </section>
        <section className="lg:col-span-1 space-y-4">
           <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-primary" /><h4 className="text-heading-4 font-bold">Suggested Actions</h4></div>
           {suggestedActions.slice(0, 3).map((action, i) => (
             <Card key={i} variant="elevated" className="p-4 space-y-2"><p className="text-[11px]">{action.text}</p><Link href={action.href} className="text-[9px] text-brand-primary font-bold">{action.cta} <ArrowRight className="w-3 h-3" /></Link></Card>
           ))}
        </section>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
