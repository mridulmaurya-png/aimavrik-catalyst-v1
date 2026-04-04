import { KPICard } from "@/components/dashboard/kpi-card";
import { PlaybookCard } from "@/components/dashboard/playbook-card";
import { ExecutionFeed } from "@/components/dashboard/execution-feed";
import { InsightCard } from "@/components/dashboard/insight-card";
import { ExecutionHealth } from "@/components/dashboard/health-metrics";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const FEED_DATA = [
  { id: "1", type: "Cart recovered", contact: "Alex Rivera", summary: "Completed purchase after 2nd reminder", time: "2m ago", status: "completed" },
  { id: "2", type: "Message sent", contact: "Sarah Chen", summary: "WhatsApp follow-up for New Lead", time: "12m ago", status: "sent" },
  { id: "3", type: "Lead received", contact: "Mark Thompson", summary: "Incoming event from Website Form", time: "24m ago", status: "completed" },
];

const INSIGHTS_DATA = [
  { text: "14 contacts are waiting after first follow-up.", action: "Delayed response detected in Service reactivation.", cta: "Review playbook" },
  { text: "Proposal follow-up is driving highest conversions recently.", action: "Conversion rate increased by 4.2% this week.", cta: "View insights" },
  { text: "WhatsApp response rate is higher than email this week.", action: "82% channel preference for mobile users.", cta: "Adjust timing" },
];

const HEALTH_DATA = [
  { label: "event ingestion success", value: "99.9%", status: "healthy" },
  { label: "message delivery success", value: "98.2%", status: "healthy" },
  { label: "failed actions", value: "0", status: "healthy" },
  { label: "disconnected integrations", value: "0", status: "healthy" },
  { label: "queued tasks", value: "0", status: "healthy" },
];

export default async function DashboardPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

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

  // 5. Fetch Playbooks
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .limit(4);

  // 6. Fetch recent messages for feed
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("*, contact:contacts(full_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);

  const KPI_DATA = [
    { label: "Contacts Processed", value: (contactsCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "Total in CRM" },
    { label: "Messages Sent", value: (messagesCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "Across all channels" },
    { label: "Replies Received", value: "0", trend: "-", trendType: "neutral", context: "Awaiting signals" },
    { label: "Conversions", value: "0", trend: "-", trendType: "neutral", context: "Influenced by active playbooks", isPrioritized: true },
    { label: "Revenue Influenced", value: "$0", trend: "-", trendType: "neutral", context: "Based on attributed actions", isPrioritized: true },
    { label: "Recovered Opportunities", value: "0", trend: "-", trendType: "neutral", context: "From recovery playbooks", isPrioritized: true },
  ];

  const HEALTH_MAP = [
    { label: "event ingestion success", value: "100%", status: "healthy" },
    { label: "message delivery success", value: messagesCount && failedCount ? `${Math.round(100 - (failedCount/messagesCount*100))}%` : "100%", status: "healthy" },
    { label: "failed actions", value: (failedCount || 0).toString(), status: failedCount && failedCount > 0 ? "warning" : "healthy" },
    { label: "disconnected integrations", value: "0", status: "healthy" },
    { label: "queued tasks", value: (queuedCount || 0).toString(), status: "healthy" },
  ];

  const LIVE_FEED = recentMessages?.map(m => ({
    id: m.id,
    type: m.channel === 'whatsapp' ? 'WhatsApp sent' : 'Email sent',
    contact: m.contact?.full_name || 'Customer',
    summary: `${m.subject || 'Follow-up'}`,
    time: "Just now",
    status: m.delivery_status
  })) || FEED_DATA;

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
            <h3 className="text-heading-3 font-bold">Active revenue systems</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {playbooks && playbooks.length > 0 ? playbooks.map((playbook) => (
              <PlaybookCard 
                key={playbook.id}
                name={playbook.playbook_type}
                status={playbook.is_active ? "active" : "paused"}
                events="0"
                conversions="0"
                revenue="$0"
              />
            )) : (
              <div className="col-span-2 p-12 border border-dashed border-brand-border rounded-xl flex items-center justify-center text-center">
                <p className="text-brand-text-tertiary text-body-sm">
                  No playbooks are currently active. <br/>
                  Go to Revenue Playbooks to activate your first system.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: LIVE EXECUTION FEED */}
        <section className="lg:col-span-1 h-[600px]">
          <ExecutionFeed items={LIVE_FEED as any} title="Real-time execution"/>
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
