import { KPICard } from "@/components/dashboard/kpi-card";
import { PlaybookCard } from "@/components/dashboard/playbook-card";
import { ExecutionFeed } from "@/components/dashboard/execution-feed";
import { InsightCard } from "@/components/dashboard/insight-card";
import { ExecutionHealth } from "@/components/dashboard/health-metrics";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

  // 7. Fetch recent events for feed (NOT hardcoded)
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, event_type, source, status, created_at, contact:contacts(full_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(8);

  // Build KPI data from real DB counts
  const KPI_DATA = [
    { label: "Contacts Processed", value: (contactsCount || 0).toLocaleString(), trend: contactsCount ? "Live" : "—", trendType: "neutral", context: "Total in CRM" },
    { label: "Events Ingested", value: (eventsCount || 0).toLocaleString(), trend: eventsCount ? "Live" : "—", trendType: "neutral", context: "From all sources" },
    { label: "Active Playbooks", value: activePlaybooks.length.toString(), trend: activePlaybooks.length > 0 ? "Running" : "None", trendType: activePlaybooks.length > 0 ? "positive" : "neutral", context: `${allPlaybooks?.length || 0} total configured` },
    { label: "Messages Sent", value: (messagesCount || 0).toLocaleString(), trend: messagesCount ? "Live" : "—", trendType: "neutral", context: "Across active channels" },
    { label: "Tasks Queued", value: (queuedCount || 0).toLocaleString(), trend: queuedCount ? "Active" : "Idle", trendType: "neutral", context: "Pending execution", isPrioritized: queuedCount ? true : false },
    { label: "Failed Actions", value: (failedCount || 0).toLocaleString(), trend: failedCount ? "Needs attention" : "Clean", trendType: failedCount ? "negative" : "positive", context: "Execution errors", isPrioritized: failedCount ? true : false },
  ];

  // Build real execution feed from recent events
  const LIVE_FEED = (recentEvents || []).map(e => {
    const contact = Array.isArray(e.contact) ? e.contact[0] : e.contact;
    return {
      id: e.id,
      type: e.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Event",
      contact: contact?.full_name || "System",
      summary: `Source: ${e.source || 'unknown'}`,
      time: formatTimeAgo(e.created_at),
      status: e.status === "processed" ? "completed" : e.status || "queued"
    };
  });

  // Real health metrics
  const HEALTH_MAP = [
    { label: "Catalyst Engine Status", value: "Online", status: "healthy" },
    { label: "Active Playbooks", value: activePlaybooks.length > 0 ? `${activePlaybooks.length} Running` : "None", status: activePlaybooks.length > 0 ? "healthy" : "warning" },
    { label: "Delivery Success Rate", value: messagesCount && failedCount ? `${Math.round(100 - (failedCount / messagesCount * 100))}%` : "100%", status: "healthy" },
    { label: "Failed Tasks", value: (failedCount || 0).toString(), status: failedCount && failedCount > 0 ? "warning" : "healthy" },
  ];

  // Dynamic insights based on real data
  const INSIGHTS_DATA = buildInsights(contactsCount || 0, activePlaybooks.length, eventsCount || 0);

  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1: KPI ROW */}
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* SECTION 2: ACTIVE REVENUE SYSTEMS */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-3 font-bold">Active components for {business?.business_name || 'your workspace'}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {activePlaybooks.length > 0 ? activePlaybooks.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                name={playbook.playbook_type}
                status="active"
                events={(eventsCount || 0).toString()}
                conversions="0"
                revenue="$0"
              />
            )) : (
              <Link href="/playbooks" className="col-span-2">
                <div className="p-12 border border-dashed border-brand-border rounded-xl flex items-center justify-center text-center transition-colors hover:border-brand-primary/50 group">
                  <p className="text-brand-text-tertiary text-body-sm group-hover:text-brand-text-secondary transition-colors">
                    No playbooks active yet. <br />
                    <span className="text-brand-primary font-bold">Activate a playbook</span> to start automated lead processing.
                  </p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* SECTION 3: LIVE EXECUTION FEED */}
        <section className="lg:col-span-1 h-[600px]">
          {LIVE_FEED.length > 0 ? (
            <ExecutionFeed items={LIVE_FEED as any} />
          ) : (
            <div className="h-full border border-brand-border rounded-xl bg-brand-bg-secondary p-6 flex flex-col">
              <h4 className="text-heading-4 font-bold mb-6">Live execution feed</h4>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-brand-text-tertiary text-body-sm">No events recorded yet.</p>
                  <p className="text-[11px] text-brand-text-tertiary">Send a webhook or import contacts to see activity here.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* SECTION 4: SYSTEM INSIGHTS */}
        <section className="lg:col-span-2 space-y-6">
          <h3 className="text-heading-3 font-bold">System insights</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {INSIGHTS_DATA.map((insight) => (
              <InsightCard
                key={insight.text}
                text={insight.text}
                action={insight.action}
                cta={insight.cta}
                href={(insight as any).href}
              />
            ))}
          </div>
        </section>

        {/* SECTION 5: EXECUTION HEALTH */}
        <section className="lg:col-span-1">
          <ExecutionHealth metrics={HEALTH_MAP as any} />
        </section>
      </div>
    </div>
  );
}

// Helper: format timestamp to relative time
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

// Helper: build dynamic insights based on real data
function buildInsights(contacts: number, activePlaybooks: number, events: number) {
  const insights = [];

  if (contacts === 0) {
    insights.push({
      text: "No contacts in your pipeline yet.",
      action: "Import contacts or connect a webhook to start capturing leads.",
      cta: "Add leads",
      href: "/integrations"
    });
  } else {
    insights.push({
      text: `${contacts} contact${contacts !== 1 ? 's' : ''} in your pipeline.`,
      action: "View and manage your entire lead database.",
      cta: "View contacts",
      href: "/contacts"
    });
  }

  if (activePlaybooks === 0) {
    insights.push({
      text: "No playbooks are active yet.",
      action: "Activate a playbook to start automated lead processing.",
      cta: "Activate playbook",
      href: "/playbooks"
    });
  } else {
    insights.push({
      text: `${activePlaybooks} playbook${activePlaybooks !== 1 ? 's' : ''} running.`,
      action: "Monitor and configure your execution rules.",
      cta: "Manage playbooks",
      href: "/playbooks"
    });
  }

  if (events === 0) {
    insights.push({
      text: "Awaiting first event signal.",
      action: "Connect a lead source or upload a CSV to begin.",
      cta: "Connect source",
      href: "/integrations"
    });
  } else {
    insights.push({
      text: `${events} event${events !== 1 ? 's' : ''} processed.`,
      action: "Review your event pipeline for processing details.",
      cta: "View events",
      href: "/event-logs"
    });
  }

  return insights;
}
