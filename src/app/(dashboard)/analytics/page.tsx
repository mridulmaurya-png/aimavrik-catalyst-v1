import { AnalyticsKpiCard } from "@/components/analytics/analytics-kpi";
import { PlaybookPerformanceTable, ChannelPerformance } from "@/components/analytics/performance-tables";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Calendar, 
  ChevronRight, 
  AlertCircle,
  TrendingUp
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Analytics</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Understand which playbooks, channels, and sources are driving results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4">
            <Filter className="w-4 h-4" />
            Segment Results
          </Button>
          <Button variant="ghost" className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <AnalyticsKpiCard label="Conversions" value="482" trend="+12%" change="positive" subtitle="Last 30 days" />
        <AnalyticsKpiCard label="Revenue Influenced" value="$42.4k" trend="+8.4k" change="positive" subtitle="Attributed revenue" />
        <AnalyticsKpiCard label="Reply Rate" value="18.2%" trend="+2.1%" change="positive" subtitle="Across all channels" />
        <AnalyticsKpiCard label="Booking Rate" value="4.2%" trend="-0.4%" change="negative" subtitle="Meetings scheduled" />
        <AnalyticsKpiCard label="Repeat Customer" value="12.4%" trend="+0.8%" change="positive" subtitle="Retention health" />
        <AnalyticsKpiCard label="Playbook Success" value="94.1%" trend="Stable" change="neutral" subtitle="Execution health" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-3 font-bold">Playbook Performance</h3>
          <p className="text-label-sm text-brand-text-tertiary">Real-time attribution</p>
        </div>
        <PlaybookPerformanceTable />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-heading-3 font-bold">Channel Comparison</h3>
          <ChannelPerformance />
        </div>
        <div className="space-y-6">
          <h3 className="text-heading-3 font-bold">Stuck Revenue</h3>
          <div className="space-y-4">
            {[
              { label: "Abandoned Carts > $500", count: 12, value: "$8.4k", action: "View recovery" },
              { label: "Inactive VIP Customers", count: 42, value: "$12.1k", action: "Trigger revival" },
              { label: "High-value Proposals Sent", count: 8, value: "$45.0k", action: "Follow-up" },
            ].map((opp) => (
              <Card key={opp.label} className="p-4 border-l-4 border-l-brand-primary bg-brand-bg-secondary/30 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-body-sm font-bold text-brand-text-primary">{opp.label}</p>
                  <p className="text-[11px] text-brand-text-tertiary">
                    {opp.count} contacts stuck · <span className="text-brand-highlight font-medium">{opp.value}</span> at risk
                  </p>
                </div>
                <Button variant="ghost" className="w-8 h-8 p-0 hover:bg-brand-primary/10 hover:text-brand-primary">
                  <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
