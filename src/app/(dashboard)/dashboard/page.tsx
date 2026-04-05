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

export default async function DashboardPage() {
  const { businessId, currencyCode } = await requireWorkspace();
  const supabase = await createClient();

  // Fetch Business Data
  const { data: business } = await supabase
    .from("businesses")
    .select("business_name")
    .eq("id", businessId)
    .single();

  // 1. Fetch Contact totals
  const { count: contactsCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  // 2. Fetch Messages totals
  const { count: messagesCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  // 3. Fetch Queued Actions
  const { count: queuedCount } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("status", ["queued", "scheduled", "processing"]);

  // 4. Fetch Failed Actions
  const { count: failedCount } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "failed");

  // 5. Fetch Events total
  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  // 6. Fetch Playbooks
  const { data: allPlaybooks } = await supabase
    .from("playbooks")
    .select("*")
    .eq("business_id", businessId);

  const activePlaybooks = allPlaybooks?.filter(p => p.is_active) || [];

  // 7. Fetch recent events for feed
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, event_type, source, status, created_at, contact:contacts(full_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);

  // 7b. Fetch recent actions for feed
  const { data: recentActions } = await supabase
    .from("actions")
    .select("id, action_type, channel, status, created_at, contact:contacts(full_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);

  // 7c. Fetch intervention queue
  const { data: interventionQueue } = await supabase
    .from("contacts")
    .select("id, full_name, stage, metadata_json")
    .eq("business_id", businessId)
    .contains("metadata_json", { needs_intervention: true })
    .limit(5);

  // 8. Compute segments for revenue panels
  const segments = await computeSegments(supabase, businessId);
  const revenueOps = buildRevenueOpportunities(segments, contactsCount || 0);
  const suggestedActions = buildSuggestedActions(segments, activePlaybooks.length);

  // Build KPI data
  const KPI_DATA = [
    { label: "Contacts", value: (contactsCount || 0).toLocaleString(), trend: contactsCount ? "Live" : "—", trendType: "neutral", context: "Total in CRM" },
    { label: "Events", value: (eventsCount || 0).toLocaleString(), trend: eventsCount ? "Live" : "—", trendType: "neutral", context: "All sources" },
    { label: "Active Playbooks", value: activePlaybooks.length.toString(), trend: activePlaybooks.length > 0 ? "Running" : "None", trendType: activePlaybooks.length > 0 ? "positive" : "neutral", context: `${allPlaybooks?.length || 0} total` },
    { label: "Messages", value: (messagesCount || 0).toLocaleString(), trend: messagesCount ? "Live" : "—", trendType: "neutral", context: "All channels" },
    { label: "Queued", value: (queuedCount || 0).toLocaleString(), trend: queuedCount ? "Active" : "Idle", trendType: "neutral", context: "Pending", isPrioritized: queuedCount ? true : false },
    { label: "Failed", value: (failedCount || 0).toLocaleString(), trend: failedCount ? "Attention" : "Clean", trendType: failedCount ? "negative" : "positive", context: "Errors", isPrioritized: failedCount ? true : false },
  ];

  // Build feed combining events and actions
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
      status: a.status === "failed" ? "failed" : a.status === "completed" ? "completed" : "queued",
      sortTime: new Date(a.created_at).getTime()
    }))
  ].sort((a, b) => b.sortTime - a.sortTime).slice(0, 8);

  const LIVE_FEED = feedItems.map(item => ({
    ...item,
    time: formatTimeAgo(item.time)
  }));

  const HEALTH_MAP = [
    { label: "Catalyst Engine", value: "Online", status: "healthy" },
    { label: "Active Playbooks", value: activePlaybooks.length > 0 ? `${activePlaybooks.length} Running` : "None", status: activePlaybooks.length > 0 ? "healthy" : "warning" },
    { label: "Delivery Rate", value: messagesCount && failedCount ? `${Math.round(100 - (failedCount / messagesCount * 100))}%` : "100%", status: "healthy" },
    { label: "Failed Tasks", value: (failedCount || 0).toString(), status: failedCount && failedCount > 0 ? "warning" : "healthy" },
  ];

  // Top segment stats for the segments bar
  const activeSegments = segments.filter(s => s.count > 0);

  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1: KPI ROW */}
      <div className="flex items-center justify-between pb-2">
         <h2 className="text-xl font-bold tracking-tight">System Overview</h2>
         <ExecutionTrigger queuedCount={queuedCount || 0} />
      </div>
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            trendType={kpi.trendType as any}
            context={kpi.context}
            isPrioritized={kpi.isPrioritized}
          />
        ))}
      </section>

      {/* SECTION 2: REVENUE OPPORTUNITIES + FEED */}
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

          {revenueOps.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {revenueOps.slice(0, 4).map((op, i) => (
                <Card key={i} variant="elevated" className="p-5 space-y-3 group hover:border-brand-primary/30 transition-all">
                  <div className="flex items-start justify-between">
                    <h4 className="text-body-sm font-bold text-brand-text-primary">{op.title}</h4>
                    <Badge variant={op.priority === "high" ? "error" : op.priority === "medium" ? "warning" : "neutral"} className="text-[9px]">
                      {op.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-brand-text-tertiary leading-relaxed">{op.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/30">
                    <span className="text-heading-4 font-bold text-brand-primary">{op.count}</span>
                    <Link href={op.href} className="text-[11px] text-brand-primary font-bold hover:underline flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      {op.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="elevated" className="p-8">
              <div className="text-center space-y-2">
                <DollarSign className="w-8 h-8 text-brand-text-tertiary mx-auto opacity-30" />
                <p className="text-body-sm text-brand-text-tertiary">Revenue opportunities will appear as contacts enter your pipeline.</p>
              </div>
            </Card>
          )}
        </section>

        {/* FEED */}
        <section className="lg:col-span-1 h-[500px]">
          {LIVE_FEED.length > 0 ? (
            <ExecutionFeed items={LIVE_FEED as any} />
          ) : (
            <div className="h-full border border-brand-border rounded-xl bg-brand-bg-secondary p-6 flex flex-col">
              <h4 className="text-heading-4 font-bold mb-6">Live execution feed</h4>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-brand-text-tertiary text-body-sm">No events recorded yet.</p>
                  <p className="text-[11px] text-brand-text-tertiary">Send a webhook or import contacts.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 3: INTERVENTION QUEUE & AI ORCHESTRATION */}
      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-functional-error">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-heading-3 font-bold text-brand-text-primary">Intervention Queue</h3>
          </div>
          {interventionQueue && interventionQueue.length > 0 ? (
            <div className="space-y-3">
              {interventionQueue.map((c: any) => (
                <Card key={c.id} variant="elevated" className="p-4 flex items-center justify-between gap-4 border-functional-error/30 bg-functional-error/5 group transition-all hover:bg-functional-error/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <Flag className="w-4 h-4 text-functional-error shrink-0" />
                    <div>
                      <p className="text-body-sm font-bold text-brand-text-primary truncate">{c.full_name}</p>
                      <p className="text-[11px] text-functional-error/80 truncate">Manual review requested · {c.stage}</p>
                    </div>
                  </div>
                  <Link href={`/contacts/${c.id}`} className="text-[11px] text-functional-error font-bold shrink-0 hover:underline flex items-center gap-1">
                    Resolve <ArrowRight className="w-3 h-3" />
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-brand-border border-dashed rounded-xl flex items-center justify-center text-center">
              <p className="text-brand-text-tertiary text-[11px] font-bold uppercase tracking-widest">Queue Clear</p>
            </div>
          )}
        </section>

        {/* AI SUGGESTED ACTIONS */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary fill-brand-primary/20" />
            <h4 className="text-heading-4 font-bold">Suggested Actions</h4>
          </div>
          {suggestedActions.length > 0 ? (
            <div className="space-y-3">
              {suggestedActions.slice(0, 3).map((action, i) => (
                <Card key={i} variant="elevated" className="p-4 space-y-2 group hover:border-brand-primary/20 transition-all">
                  <p className="text-[11px] text-brand-text-primary leading-relaxed">{action.text}</p>
                  <Link href={action.href} className="text-[9px] text-brand-primary uppercase font-bold tracking-wider hover:underline flex items-center gap-1">
                    {action.cta} <ArrowRight className="w-3 h-3" />
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="elevated" className="p-6 text-center">
              <Sparkles className="w-6 h-6 text-brand-text-tertiary mx-auto opacity-30 mb-2" />
              <p className="text-[11px] text-brand-text-tertiary">AI is monitoring active pipeline.</p>
            </Card>
          )}
        </section>
      </div>

      {/* SECTION 4: ACTIVE PLAYBOOKS + SEGMENT OVERVIEW */}
      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-3 font-bold">Active Playbooks</h3>
            <Link href="/playbooks" className="text-body-sm text-brand-primary font-bold hover:underline flex items-center gap-1">
              All playbooks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {activePlaybooks.length > 0 ? activePlaybooks.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                name={playbook.playbook_type}
                status="active"
                events={(eventsCount || 0).toString()}
                conversions="0"
                revenue={formatCurrency(0, currencyCode)}
              />
            )) : (
              <Link href="/playbooks" className="col-span-2">
                <div className="p-12 border border-dashed border-brand-border rounded-xl flex items-center justify-center text-center transition-colors hover:border-brand-primary/50 group">
                  <p className="text-brand-text-tertiary text-body-sm group-hover:text-brand-text-secondary transition-colors">
                    No playbooks active. <br />
                    <span className="text-brand-primary font-bold">Activate a playbook</span> to start automated processing.
                  </p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* SEGMENT OVERVIEW */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-text-tertiary" />
              <h4 className="text-heading-4 font-bold">Segment Overview</h4>
            </div>
            <Link href="/segments" className="text-[11px] text-brand-primary font-bold hover:underline">View all</Link>
          </div>
          <Card variant="elevated" className="p-5 space-y-3">
            {activeSegments.length > 0 ? activeSegments.slice(0, 5).map(seg => (
              <div key={seg.id} className="flex items-center justify-between py-1.5 border-b border-brand-border/20 last:border-0">
                <span className="text-body-sm text-brand-text-secondary">{seg.name}</span>
                <span className="text-body-sm font-bold text-brand-primary">{seg.count}</span>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-[11px] text-brand-text-tertiary">Segments populate from contact data.</p>
              </div>
            )}
          </Card>
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
