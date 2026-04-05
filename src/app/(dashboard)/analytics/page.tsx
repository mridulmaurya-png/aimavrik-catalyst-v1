import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/config/constants";
import { AnalyticsKpiCard } from "@/components/analytics/analytics-kpi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Filter, 
  Calendar, 
  ChevronRight, 
  MessageSquare, 
  Mail,
  BarChart3
} from "lucide-react";

export default async function AnalyticsPage() {
  const { businessId, currencyCode } = await requireWorkspace();
  const supabase = await createClient();

  // --- REAL DATA FETCHING ---

  // 1. Total contacts (proxy for "conversions" at converted stage)
  const { count: totalContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { count: convertedContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("stage", "converted");

  // 2. Revenue — sum of deal_value for converted contacts
  const { data: revenueData } = await supabase
    .from("contacts")
    .select("deal_value")
    .eq("business_id", businessId)
    .eq("stage", "converted");

  const totalRevenue = (revenueData || []).reduce((sum, c) => sum + (c.deal_value || 0), 0);

  // 3. Messages sent & delivery stats
  const { count: totalMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { count: sentMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("delivery_status", "sent");

  const { count: failedMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("delivery_status", "failed");

  // 4. Channel-specific message counts
  const { count: whatsappMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("channel", "whatsapp");

  const { count: emailMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("channel", "email");

  // 5. Actions stats
  const { count: totalActions } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { count: completedActions } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "completed");

  const { count: failedActions } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "failed");

  // 6. Playbooks with action counts
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id, playbook_type, is_active")
    .eq("business_id", businessId);

  const { data: actionsByPlaybook } = await supabase
    .from("actions")
    .select("playbook_id, status")
    .eq("business_id", businessId);

  const playbookStats = (playbooks || []).map(pb => {
    const pbActions = (actionsByPlaybook || []).filter(a => a.playbook_id === pb.id);
    const completed = pbActions.filter(a => a.status === "completed").length;
    const total = pbActions.length;
    return {
      name: pb.playbook_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Unnamed",
      is_active: pb.is_active,
      actionsTotal: total,
      actionsCompleted: completed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // 7. At-risk contacts (stage = churned or reactivation)
  const { count: atRiskContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("stage", ["churned", "reactivation"]);

  // --- COMPUTED METRICS ---
  const conversionRate = totalContacts && totalContacts > 0
    ? ((convertedContacts || 0) / totalContacts * 100).toFixed(1)
    : "0";

  const deliveryRate = totalMessages && totalMessages > 0
    ? (((sentMessages || 0) / totalMessages) * 100).toFixed(1)
    : "0";

  const executionSuccessRate = totalActions && totalActions > 0
    ? (((completedActions || 0) / totalActions) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Analytics</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Real-time attribution from your playbooks, channels, and execution engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4 opacity-50 cursor-not-allowed" title="Segment filtering coming soon">
            <Filter className="w-4 h-4" />
            Segment Results
          </Button>
          <Button variant="ghost" disabled className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4 opacity-50 cursor-not-allowed" title="Date range filtering coming soon">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* KPI ROW — all real */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <AnalyticsKpiCard 
          label="Conversions" 
          value={(convertedContacts || 0).toLocaleString()} 
          trend={`${conversionRate}%`} 
          change={Number(conversionRate) > 0 ? "positive" : "neutral"} 
          subtitle={`${totalContacts || 0} total contacts`} 
        />
        <AnalyticsKpiCard 
          label="Revenue Influenced" 
          value={formatCurrency(totalRevenue, currencyCode)} 
          trend={totalRevenue > 0 ? "Live" : "—"} 
          change={totalRevenue > 0 ? "positive" : "neutral"} 
          subtitle="Converted deal values" 
        />
        <AnalyticsKpiCard 
          label="Delivery Rate" 
          value={`${deliveryRate}%`} 
          trend={`${sentMessages || 0} sent`} 
          change={Number(deliveryRate) >= 95 ? "positive" : Number(deliveryRate) > 0 ? "neutral" : "neutral"} 
          subtitle={`${totalMessages || 0} total messages`} 
        />
        <AnalyticsKpiCard 
          label="Failed Deliveries" 
          value={(failedMessages || 0).toLocaleString()} 
          trend={failedMessages && failedMessages > 0 ? "Attention" : "Clean"} 
          change={failedMessages && failedMessages > 0 ? "negative" : "positive"} 
          subtitle="Delivery errors" 
        />
        <AnalyticsKpiCard 
          label="At-Risk Contacts" 
          value={(atRiskContacts || 0).toLocaleString()} 
          trend={atRiskContacts && atRiskContacts > 0 ? "Review" : "Clear"} 
          change={atRiskContacts && atRiskContacts > 0 ? "negative" : "positive"} 
          subtitle="Churned + Reactivation" 
        />
        <AnalyticsKpiCard 
          label="Execution Health" 
          value={`${executionSuccessRate}%`} 
          trend={`${completedActions || 0}/${totalActions || 0}`} 
          change={Number(executionSuccessRate) >= 90 ? "positive" : Number(executionSuccessRate) > 0 ? "neutral" : "neutral"} 
          subtitle="Actions completed" 
        />
      </div>

      {/* PLAYBOOK PERFORMANCE TABLE — DB-backed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-3 font-bold">Playbook Performance</h3>
          <Link href="/playbooks" className="text-[11px] text-brand-primary font-bold hover:underline">View all playbooks</Link>
        </div>
        {playbookStats.length > 0 ? (
          <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Playbook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions Created</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playbookStats.map((row) => (
                  <TableRow key={row.name} className="group">
                    <TableCell className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                      <Link href="/playbooks">{row.name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "success" : "neutral"} className="text-[10px]">
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-body-sm text-brand-text-secondary">{row.actionsTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-body-sm text-brand-text-secondary">{row.actionsCompleted.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.successRate >= 90 ? "success" : row.successRate > 0 ? "info" : "neutral"} className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                        {row.successRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 border border-dashed border-brand-border rounded-xl text-center">
            <BarChart3 className="w-8 h-8 text-brand-text-tertiary mx-auto opacity-30 mb-3" />
            <p className="text-body-sm text-brand-text-tertiary">No playbook data yet. Activate a playbook and process events to see performance.</p>
          </div>
        )}
      </div>

      {/* CHANNEL COMPARISON — DB-backed */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-body-lg font-bold text-brand-text-primary">WhatsApp</h4>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Messages</p>
              <p className="text-heading-4 font-bold">{(whatsappMessages || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Status</p>
              <p className="text-heading-4 font-bold text-brand-text-secondary">{whatsappMessages ? "Active" : "No data"}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="text-body-lg font-bold text-brand-text-primary">Email</h4>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Messages</p>
              <p className="text-heading-4 font-bold">{(emailMessages || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Status</p>
              <p className="text-heading-4 font-bold text-brand-text-secondary">{emailMessages ? "Active" : "No data"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AT-RISK — DB-backed */}
      {(atRiskContacts || 0) > 0 && (
        <div className="space-y-4">
          <h3 className="text-heading-3 font-bold">At-Risk Contacts</h3>
          <Card className="p-4 border-l-4 border-l-functional-error bg-brand-bg-secondary/30 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-body-sm font-bold text-brand-text-primary">Requires review</p>
              <p className="text-[11px] text-brand-text-tertiary">
                {atRiskContacts} contacts in churned or reactivation stage
              </p>
            </div>
            <Link href="/contacts">
              <Button variant="ghost" className="w-8 h-8 p-0 hover:bg-brand-primary/10 hover:text-brand-primary">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
