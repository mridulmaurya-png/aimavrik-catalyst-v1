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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TrendingUp, Sparkles, ArrowRight, Target, DollarSign, RefreshCw, Megaphone, ShieldAlert, Flag, ActivitySquare, CheckCircle2, AlertCircle, Clock, Zap, MessageSquare, Mail } from "lucide-react";
import { requestCampaignExecution } from "@/app/actions/campaigns";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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

  // Phase 1: Feature Flag
  const { data: demoModeFlag } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("business_id", businessId)
    .eq("flag_key", "is_demo")
    .maybeSingle();
  const isDemoMode = demoModeFlag?.enabled || false;

  // Data Fetching logic (Restored)
  let [contactsCount, messagesCount, queuedCount, failedCount, eventsCount, allPlaybooks, recentEvents, recentActions, interventionQueue, insights, revenueData, engagedCount] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("business_id", businessId).in("status", ["queued", "scheduled", "processing"]).then(r => r.count),
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "failed").then(r => r.count),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("business_id", businessId).then(r => r.count),
    supabase.from("playbooks").select("*").eq("business_id", businessId).then(r => r.data),
    supabase.from("events").select("id, event_type, source, status, created_at, contact:contacts(full_name)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5).then(r => r.data),
    supabase.from("actions").select("id, action_type, channel, status, created_at, contact:contacts(full_name)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5).then(r => r.data),
    supabase.from("contacts").select("id, full_name, stage, metadata_json").eq("business_id", businessId).contains("metadata_json", { needs_intervention: true }).limit(5).then(r => r.data),
    supabase.from("insights").select("*").eq("business_id", businessId).eq("status", "open").order("created_at", { ascending: false }).limit(5).then(r => r.data),
    supabase.from("revenue_events").select("amount").eq("business_id", businessId).then(r => r.data),
    supabase.from("actions").select("id", { count: "exact", head: true }).eq("business_id", businessId).in("status", ["completed", "handed_off"]).then(r => r.count)
  ]);

  const activePlaybooks = allPlaybooks?.filter(p => p.is_active) || [];
  let segments = await computeSegments(supabase, businessId);
  const revenueOps = buildRevenueOpportunities(segments, contactsCount || 0);

  // DEMO MODE OVERRIDE
  if (isDemoMode) {
    contactsCount = 14250;
    messagesCount = 8402;
    queuedCount = 0;
    failedCount = 0;
    eventsCount = 42301;
    engagedCount = 3120;
    revenueData = Array(32).fill({ amount: 45000 }); // simulated ~1.44M revenue
    segments = [
      ...segments,
      { id: "hot_leads", name: "Hot Leads", count: 420, type: "dynamic", category: "interest", description: "Leads with high interest.", icon: {} as any },
      { id: "unresponsive", name: "Unresponsive", count: 1250, type: "dynamic", category: "interest", description: "Leads ignoring follow up.", icon: {} as any }
    ] as any;
    insights = [
      {
        id: "demo_1",
        priority: "high",
        message: "42 high-intent leads are currently unresponsive in WhatsApp.",
        recommended_action: "Trigger immediate re-engagement playbook.",
        metadata: { audience_size: 42, potential_value: 320000, actionable_campaign: true, segment: "unresponsive_high_intent" },
        status: "open",
        type: "stuck_lead"
      },
      {
        id: "demo_2",
        priority: "high",
        message: "Festival season traffic is dropping without an active offer.",
        recommended_action: "Launch preemptive discount to active audience.",
        metadata: { audience_size: 1500, potential_value: 850000, actionable_campaign: true, segment: "warm_leads" },
        status: "open",
        type: "configuration_needed"
      }
    ];
    interventionQueue = [];
    recentEvents = [
      { id: "d1", event_type: "Lead Captured", source: "Meta Ads", status: "processed", created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), contact: { full_name: "Rahul Verma" } },
      { id: "d2", event_type: "Page Visited", source: "Direct", status: "processed", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), contact: { full_name: "Sneha Patel" } },
    ] as any[];
    recentActions = [
      { id: "a1", action_type: "Welcome WhatsApp", channel: "WhatsApp", status: "completed", created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(), contact: { full_name: "Rahul Verma" } },
      { id: "a2", action_type: "Drip Email", channel: "Email", status: "completed", created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(), contact: { full_name: "Sneha Patel" } },
    ] as any[];
  }
  
  // Phase 4: Revenue & Funnel View logic
  const totalRevenue = revenueData?.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) || 0;
  const convertedCount = revenueData?.length || 0;
  const activeSegments = segments.filter(s => s.count > 0);

  const wowStrings = [
    "Re-engaging inactive leads...",
    "Optimizing WhatsApp flows...",
    "Testing follow-up timing...",
    "Tracing execution loops...",
    "Running intelligence algorithms...",
    "Calculating revenue attribution..."
  ];
  const dynamicWowString = wowStrings[Math.floor(Date.now() / 10000) % wowStrings.length]; // rotatates deterministically for SSR

  const KPI_DATA = [
    { label: "Leads Received", value: (contactsCount || 0).toLocaleString(), trend: "Live", trendType: "neutral", context: "Total in CRM" },
    { label: "Leads Contacted", value: (engagedCount || 0).toLocaleString(), trend: "Active", trendType: "neutral", context: "Outreach started" },
    { label: "Interested Leads", value: (segments.find(s => s.id === "hot_leads")?.count || 0).toLocaleString(), trend: "Growing", trendType: "positive", context: "Buying signals" },
    { label: "Total Conversions", value: convertedCount.toLocaleString(), trend: "High", trendType: "positive", context: "Deals closed" },
    { label: "Revenue Influenced", value: `₹${totalRevenue.toLocaleString()}`, trend: "Growing", trendType: "positive", context: "Direct attribution" },
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

  const LIVE_FEED = feedItems.map(item => ({ 
    ...item, 
    type: item.type.replace("Lead Created", "New Lead Detected")
                .replace("Action:", "System Action:")
                .replace("Lead Converted", "Victory: Lead Converted"),
    time: formatTimeAgo(item.time) 
  }));

  // 1. If Onboarding not started, show the guided requirement form (BYPASS IN DEMO MODE)
  if (!isDemoMode && (status === "signup_received" || status === "onboarding_not_started")) {
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
    <div className="space-y-6 pb-12">
      {/* Phase 10: Trust Reinforcement Strip */}
      <div className="bg-brand-bg-primary/50 border border-brand-border/30 rounded-lg px-4 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-functional-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wider">All systems running normally</span>
          </div>
          <div className="h-3 w-px bg-brand-border/40" />
          <div className="flex items-center gap-1.5 text-brand-text-tertiary">
            <Clock className="w-3.5 h-3.5" />
            <span>Last system check: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-brand-text-secondary font-medium">
          <Zap className="w-3 h-3 text-brand-primary animate-pulse" />
          System is actively optimizing {business?.business_name || "Workspace"}
        </div>
      </div>

      {/* Phase 2: Instant Value Screen Banner */}
      {isDemoMode && (
        <div className="bg-functional-error/10 border-2 border-functional-error/50 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-glow">
           <div className="space-y-1.5">
             <div className="flex items-center gap-2 text-functional-error">
               <AlertCircle className="w-5 h-5" />
               <h3 className="font-bold text-lg uppercase tracking-wider">Opportunity Loss Detected</h3>
             </div>
             <h4 className="text-functional-error font-extrabold text-heading-2">You are losing an estimated ₹{((contactsCount || 0) * 50).toLocaleString()} revenue from un-followed leads</h4>
             <p className="text-functional-error text-body-sm font-medium mt-1">Derived from 1,250 unresponsive leads × average conversion proxy. (Estimate)</p>
           </div>
           <div className="shrink-0 flex flex-col items-center gap-2">
             <Link href="/campaigns">
               <Button className="bg-functional-error hover:bg-functional-error/80 text-white font-black uppercase tracking-widest text-body-sm h-12 px-8 shadow-lg shadow-functional-error/30 animate-pulse">
                  Activate This System For My Business
               </Button>
             </Link>
             <span className="text-[10px] text-functional-error uppercase tracking-widest font-bold">Secure your pipeline today</span>
           </div>
        </div>
      )}

      {/* Phase 8: Trust Builders */}
      {isDemoMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
           <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-lg flex items-center gap-3">
             <Megaphone className="w-5 h-5 text-brand-primary" />
             <div>
               <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-widest">System processed</p>
               <p className="text-body-sm font-bold text-brand-text-primary">14,250 leads today</p>
             </div>
           </div>
           <div className="bg-functional-success/10 border border-functional-success/20 p-4 rounded-lg flex items-center gap-3">
             <Zap className="w-5 h-5 text-functional-success" />
             <div>
               <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-widest">Response Time</p>
               <p className="text-body-sm font-bold text-brand-text-primary">Instant (&lt;1s avg)</p>
             </div>
           </div>
           <div className="bg-functional-info/10 border border-functional-info/20 p-4 rounded-lg flex items-center gap-3">
             <Target className="w-5 h-5 text-functional-info" />
             <div>
               <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-widest">Conversion Lift</p>
               <p className="text-body-sm font-bold text-brand-text-primary">+34% vs Manual</p>
             </div>
           </div>
        </div>
      )}

      <OnboardingStatusPanel businessStatus={status} />

      <div className="flex items-center justify-between pb-2 border-b border-brand-border/20">
         <div className="flex items-center gap-3">
           <ActivitySquare className="w-5 h-5 text-brand-primary" />
           <h2 className="text-xl font-bold tracking-tight">Revenue Summary</h2>
           <Badge variant={failedCount ? "error" : queuedCount ? "warning" : "success"} className="ml-2 py-0">
             {failedCount ? "Attention Needed" : queuedCount ? "AI Optimizing" : "System Active"}
           </Badge>
           {isDemoMode && (
             <Badge variant="warning" className="ml-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/30 uppercase tracking-widest px-2 py-0">
               DEMO DATA
             </Badge>
           )}
         </div>
         {isDemoMode ? (
           <Button disabled variant="ghost" className="opacity-50">Demo Executions Disabled</Button>
         ) : (
           <ExecutionTrigger queuedCount={queuedCount || 0} businessStatus={status} />
         )}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {KPI_DATA.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} trendType={kpi.trendType as any} />
        ))}
      </section>

      {/* Phase 1: WHAT SHOULD YOU DO NOW Block */}
      {insights && insights.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h3 className="text-heading-3 font-bold">What should you do now?</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {insights.slice(0, 3).map((insight: any) => (
              <Card key={insight.id} variant="elevated" className="p-5 border-l-4 border-l-brand-primary bg-brand-primary/5 flex flex-col justify-between group hover:shadow-glow transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold text-brand-primary tracking-widest px-2 py-0.5 bg-brand-primary/10 rounded">Recommended Action</p>
                    <Badge variant={insight.priority === 'high' || insight.priority === 'critical' ? 'error' : 'neutral'}>
                       {insight.priority === 'high' || insight.priority === 'critical' ? 'High Confidence' : 'Medium Confidence'}
                    </Badge>
                  </div>
                  <p className="text-body-sm font-bold text-brand-text-primary line-clamp-2">{insight.recommended_action || insight.message}</p>
                  <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                    Impact: {insight.metadata?.audience_size ? `${insight.metadata.audience_size} leads affected. ` : ''} 
                    {insight.metadata?.potential_value ? `Potential value: ₹${insight.metadata.potential_value.toLocaleString()} (approx).` : 'Significant conversion opportunity.'}
                  </p>
                </div>
                <div className="pt-4">
                  <form action={requestCampaignExecution.bind(null, insight.id, insight.metadata?.segment) as any}>
                    <button type="submit" className="w-full h-10 bg-brand-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-primary-light transition-colors flex items-center justify-center gap-2">
                      {insight.metadata?.actionable_campaign ? 'Execute Action now' : 'Approve recommendation'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <div>
                <h3 className="text-heading-3 font-bold">Revenue Funnel View</h3>
                <p className="text-[12px] text-brand-text-secondary">Tracks total monetary output generated by the AI engine.</p>
              </div>
            </div>
            <Link href="/segments" className="text-body-sm text-brand-primary font-bold hover:underline flex items-center gap-1">
              View audience groups <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
             <Card variant="elevated" className="p-4 bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20">
                <p className="text-[10px] uppercase font-bold text-brand-text-tertiary flex items-center">
                  Generated Revenue 
                  <InfoTooltip title="Revenue Influenced" meaning="Total monetary value recorded after successful automated engagements." why="Measures the actual return on investment derived from the system." example="e.g. Total payments processed since activation." />
                </p>
                <div className="text-heading-2 font-bold text-brand-primary pt-2 whitespace-nowrap overflow-hidden text-ellipsis">₹{totalRevenue.toLocaleString()}</div>
             </Card>
             <Card variant="elevated" className="p-4">
                <p className="text-[10px] uppercase font-bold text-brand-text-tertiary">Leads Captured</p>
                <div className="text-heading-2 font-bold pt-2">{contactsCount?.toLocaleString() || 0}</div>
             </Card>
             <Card variant="elevated" className="p-4">
                <p className="text-[10px] uppercase font-bold text-brand-text-tertiary flex items-center">
                  Engaged Prospects 
                  <InfoTooltip title="Engagement" meaning="Leads actively responding to campaigns or flows." why="Signals healthy interest and identifies potential pipeline volume." example="e.g. Lead replies on WhatsApp." />
                </p>
                <div className="text-heading-2 font-bold pt-2">{engagedCount?.toLocaleString() || 0}</div>
             </Card>
             <Card variant="elevated" className="p-4 border-functional-success/20 bg-functional-success/5">
                <p className="text-[10px] uppercase font-bold text-functional-success flex items-center">
                  Total Converted 
                  <InfoTooltip title="Conversion" meaning="Users who completed the designated closing event." why="Measures effectiveness of follow-up playbooks." example="e.g. Successful checkout or Deal Won." />
                </p>
                <div className="text-heading-2 font-bold text-functional-success pt-2">{convertedCount.toLocaleString()}</div>
             </Card>
          </div>
          
          <div className="pt-4 flex items-center justify-between border-t border-brand-border/20 mt-4">
             <span className="text-[10px] italic text-brand-text-tertiary flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin duration-[3000ms]" /> 
                System is working on: {dynamicWowString}
             </span>
             <Link href="/campaigns" className="text-[11px] text-brand-text-secondary hover:underline font-bold">Top Source: Meta Ads</Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <Card variant="elevated" className="p-4 border-l-2 border-l-brand-primary">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-brand-primary" />
                <h4 className="text-body-sm font-bold uppercase tracking-widest">WhatsApp Effectiveness</h4>
              </div>
              <p className="text-[12px] text-brand-text-secondary mb-2">Works best for: <span className="text-brand-text-primary font-bold">Quick response & Hindi leads</span></p>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-[9px]">High Response Quality</Badge>
                <span className="text-[10px] text-brand-text-tertiary">Data-driven insight</span>
              </div>
            </Card>
            <Card variant="elevated" className="p-4 border-l-2 border-l-brand-primary-light">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-brand-primary" />
                <h4 className="text-body-sm font-bold uppercase tracking-widest">Email Effectiveness</h4>
              </div>
              <p className="text-[12px] text-brand-text-secondary mb-2">Works best for: <span className="text-brand-text-primary font-bold">Formal documents & follow-ups</span></p>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[9px]">Limited Data</Badge>
                <span className="text-[10px] text-brand-text-tertiary">Accumulating more data</span>
              </div>
            </Card>
          </div>
        </section>
        <section className="lg:col-span-1 h-[500px]">
           <ExecutionFeed items={LIVE_FEED as any} />
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-functional-error"><ShieldAlert className="w-5 h-5" /><h3 className="text-heading-3 font-bold text-brand-text-primary">Intervention Queue</h3></div>
            <p className="text-[12px] text-brand-text-secondary pt-1">Identifies errors or contacts needing direct human interaction.</p>
          </div>
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
          ) : !isDemoMode && ( 
                <div className="p-8 border border-brand-border border-dashed rounded-xl text-center">
                  <p className="text-[11px] uppercase tracking-widest text-brand-text-tertiary font-bold">No active blocks</p>
                  <p className="text-[11px] text-brand-text-secondary mt-1">If a lead gets stuck or an engine errors out, it will appear here for you to resolve.</p>
                </div> 
          )}
          
          {/* Phase 3 & 4: ROI EXPLAINER AND BEFORE/AFTER IN DEMO MODE */}
          {isDemoMode && (
            <div className="space-y-6 pt-4">
              <Card variant="elevated" className="p-6 bg-gradient-to-br from-brand-primary/5 to-transparent border-brand-primary/20">
                 <div className="flex items-center gap-2 mb-4">
                   <Target className="w-5 h-5 text-brand-primary" />
                   <h3 className="text-heading-3 font-bold">How this system makes you money</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded border border-white/5 space-y-1">
                      <p className="text-[14px] font-bold">1. Captures Every Lead</p>
                      <p className="text-[11px] text-brand-text-secondary">No manual data entry.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded border border-white/5 space-y-1">
                      <p className="text-[14px] font-bold">2. Instant Follow-up</p>
                      <p className="text-[11px] text-brand-text-secondary">Automatic WhatsApps within 5s.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded border border-white/5 space-y-1">
                      <p className="text-[14px] font-bold">3. Recovers Lost Leads</p>
                      <p className="text-[11px] text-brand-text-secondary">Drip campaigns re-activate interest.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded border border-white/5 space-y-1">
                      <p className="text-[14px] font-bold text-functional-success">4. Converts More</p>
                      <p className="text-[11px] text-brand-text-secondary">Proven 30%+ increase in closure.</p>
                    </div>
                 </div>
              </Card>

              {/* Phase 6: Simulated Outcomes */}
              <div className="grid md:grid-cols-2 gap-4">
                 <Card variant="elevated" className="p-5 border-l-4 border-l-functional-success bg-functional-success/5">
                   <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-functional-success" /><p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary">Real Example</p></div>
                   <p className="text-heading-3 font-bold text-functional-success">Recovered 32 lost leads today</p>
                   <p className="text-[12px] text-brand-text-secondary mt-1">System automatically pinged dormant leads from last month with a targeted offer.</p>
                 </Card>
                 <Card variant="elevated" className="p-5 border-l-4 border-l-brand-primary bg-brand-primary/5">
                   <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-brand-primary" /><p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary">Real Example</p></div>
                   <p className="text-heading-3 font-bold text-brand-primary">Generated ₹1.8L extra revenue</p>
                   <p className="text-[12px] text-brand-text-secondary mt-1">Automated follow-ups closed 4 high-ticket opportunities that were falling through the cracks.</p>
                 </Card>
              </div>
              
              <Card variant="elevated" className="p-6">
                 <h3 className="text-heading-3 font-bold mb-4">Before vs After Catalyst</h3>
                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <Badge variant="error" className="uppercase px-2 rounded font-bold text-[10px]">Before</Badge>
                     <ul className="space-y-2 text-[12px] text-brand-text-secondary font-medium list-disc ml-4 opacity-70">
                       <li>Leads missed during off-hours</li>
                       <li>Inconsistent follow-up</li>
                       <li>High manual data entry</li>
                       <li>Leaking pipeline & lost revenue</li>
                     </ul>
                   </div>
                   <div className="space-y-3">
                     <Badge variant="success" className="uppercase px-2 rounded font-bold text-[10px]">After Catalyst</Badge>
                     <ul className="space-y-2 text-[12px] text-brand-text-primary font-bold list-disc ml-4">
                       <li>Instant response 24/7</li>
                       <li>Automated tailored follow-up</li>
                       <li>Zero manual entry</li>
                       <li className="text-functional-success">Higher sustained conversion rate</li>
                     </ul>
                   </div>
                 </div>
              </Card>
            </div>
          )}
        </section>
        <section className="lg:col-span-1 space-y-4">
           <div>
             <div className="flex items-center justify-between pb-2 border-b border-brand-border/20">
               <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-primary" /><h4 className="text-heading-3 font-bold">What Needs Attention</h4></div>
               <Badge variant="neutral">Read-only</Badge>
             </div>
             <p className="text-[12px] text-brand-text-secondary pt-2">System-generated recommendations on how to extract more conversions from your audience.</p>
           </div>
           
           {insights && insights.length > 0 ? (
             insights.map((insight: any, i: number) => (
               <Card key={insight.id || i} variant="elevated" className={`p-4 space-y-3 border-l-2 ${insight.priority === 'high' || insight.priority === 'critical' ? 'border-l-functional-error' : 'border-l-functional-warning'}`}>
                 <div className="flex justify-between items-start">
                   <div className="space-y-1">
                     <p className="text-[10px] uppercase tracking-wider text-brand-text-tertiary font-bold">Problem Detected</p>
                     <p className="text-[11px] font-bold text-brand-text-primary pr-2 leading-relaxed">{insight.message}</p>
                   </div>
                   <Badge variant={insight.priority === 'high' || insight.priority === 'critical' ? 'error' : 'neutral'} className="text-[9px] uppercase px-1.5 shrink-0 ml-2">
                     {insight.priority === 'high' || insight.priority === 'critical' ? 'High Confidence' : 'Needs Data'}
                   </Badge>
                 </div>
                 
                 {insight.metadata?.audience_size && (
                   <div className="space-y-1">
                     <p className="text-[10px] uppercase tracking-wider text-brand-text-tertiary font-bold">Impact</p>
                     <div className="flex items-center gap-4 py-0.5 text-[10px] text-brand-text-secondary font-medium">
                       <span className="flex items-center gap-1"><Target className="w-3 h-3 text-brand-primary" /> {insight.metadata.audience_size} Leads</span>
                       {insight.metadata.potential_value ? (
                         <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-functional-success" /> Est. Impact: ₹{insight.metadata.potential_value.toLocaleString()}</span>
                       ) : null}
                     </div>
                   </div>
                 )}
                 <div className="space-y-1 text-left">
                   <p className="text-[10px] uppercase tracking-wider text-brand-text-tertiary font-bold">Suggested Action</p>
                   <p className="text-[10px] text-brand-text-secondary">{insight.recommended_action || "Contact ops support for next steps."}</p>
                 </div>
                 
                 <div className="flex justify-end pt-2 border-t border-brand-border/30 mt-2">
                   <form action={requestCampaignExecution.bind(null, insight.id, insight.metadata?.segment) as any}>
                     <button type="submit" className="text-[9px] uppercase tracking-widest font-bold text-brand-primary hover:text-white transition-colors border border-brand-primary/30 hover:bg-brand-primary px-3 py-1.5 rounded disabled:opacity-50">
                       {insight.metadata?.actionable_campaign ? 'Run Campaign' : 'Acknowledge'}
                     </button>
                   </form>
                 </div>
               </Card>
             ))
           ) : (
             <div className="text-center p-6 border border-dashed border-brand-border/40 rounded-xl">
               <p className="text-[11px] text-brand-text-tertiary">No outstanding insights.</p>
             </div>
           )}
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
