"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getLifecycleLabel,
  getLifecycleColor,
  LIFECYCLE_TRANSITIONS,
  getIntegrationLabel,
  getAutomationLabel,
  getHealthColor,
  getStatusColor,
  getRunStatusColor,
  getTriggerEventLabel,
  getIntegrationStatusColor,
  INTEGRATION_TYPES,
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUSES,
  AUTOMATION_TYPES,
  AUTOMATION_STATUSES,
  EXECUTION_ENGINES,
  OUTPUT_CHANNELS,
  TRIGGER_EVENTS,
} from "@/lib/config/ops-constants";
import {
  updateWorkspaceLifecycle,
  addIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegrationConnection,
  addAutomation,
  updateAutomation,
  deleteAutomation,
  testExecuteAutomation,
  checkGoLiveReadiness,
  addOpsNote,
  deleteOpsNote,
  toggleFeatureFlag,
  triggerInsightGeneration,
  updateInsightStatus,
} from "@/app/actions/ops-actions";
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_LABELS,
  FEATURE_FLAG_DESCRIPTIONS,
  type FeatureFlagKey,
} from "@/lib/config/feature-flags";
import {
  getInsightLabel,
  getInsightPriorityColor,
} from "@/lib/intelligence/types";
import {
  ArrowLeft,
  Building2,
  Plug,
  Zap,
  FileText,
  MessageSquare,
  Activity,
  History,
  Loader2,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Users,
  Calendar,
  Database,
  Radio,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Link as LinkIcon,
  Play,
  Pause,
  Archive,
  TestTube,
  Rocket,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Lightbulb,
  Brain,
  Globe,
  Eye,
  Sparkles,
} from "lucide-react";

interface WorkspaceDetailData {
  business: any;
  integrations: any[];
  automations: any[];
  notes: any[];
  history: any[];
  health: {
    contactsCount: number;
    eventsCount: number;
    actionsCount: number;
    lastEventAt: string | null;
    lastActionAt: string | null;
    lastActionStatus: string | null;
  };
  playbooks: any[];
  executionRuns: any[];
  featureFlags: any[];
  insights: any[];
}

type TabKey = "overview" | "integrations" | "automations" | "execution" | "intelligence" | "flags" | "notes" | "history";

export function WorkspaceDetailShell({ data }: { data: WorkspaceDetailData }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");

  const biz = data.business;
  const submission = biz.onboarding_submissions?.[0];
  const config = biz.business_settings?.[0]?.config_json || {};
  const ownerMember = biz.team_members?.[0];
  const ownerEmail = biz.owner_email || (ownerMember?.users as any)?.email || "—";
  const transitions = LIFECYCLE_TRANSITIONS[biz.status] || [];

  const handleLifecycleChange = async (newStatus: string) => {
    const reason = prompt(`Reason for changing status to "${getLifecycleLabel(newStatus)}"? (optional)`);
    setLoading(true);
    try {
      await updateWorkspaceLifecycle(biz.id, newStatus as any, reason || undefined);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Derive execution health
  const isLive = biz.status === "active" && data.health.lastEventAt;
  const isBlocked = biz.status !== "active";

  const tabs = [
    { key: "overview" as TabKey, label: "Overview", icon: Building2 },
    { key: "integrations" as TabKey, label: `Integrations (${data.integrations.length})`, icon: Plug },
    { key: "automations" as TabKey, label: `Automations (${data.automations.length})`, icon: Zap },
    { key: "execution" as TabKey, label: `Execution (${(data.executionRuns || []).length})`, icon: Activity },
    { key: "intelligence" as TabKey, label: `Intelligence (${(data.insights || []).length})`, icon: Brain },
    { key: "flags" as TabKey, label: "Feature Flags", icon: ToggleLeft },
    { key: "notes" as TabKey, label: `Notes (${data.notes.length})`, icon: MessageSquare },
    { key: "history" as TabKey, label: "History", icon: History },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3 text-brand-text-tertiary">
        <Link href="/ops/workspaces" className="flex items-center gap-1 text-body-sm hover:text-brand-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-brand-text-primary font-bold text-body-sm">{biz.business_name}</span>
      </div>

      {/* Business Header */}
      <Card variant="default" className="p-6 bg-brand-bg-primary/40 border-brand-border/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-heading-2 font-bold tracking-tight">{biz.business_name}</h1>
                <Badge variant={getLifecycleColor(biz.status)}>{getLifecycleLabel(biz.status)}</Badge>
                {data.health.contactsCount > 0 && (
                  <Badge variant="neutral" className="gap-1.5 self-center">
                    <Users className="w-3 h-3" />
                    {data.health.contactsCount} Users
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 pt-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Business ID</span>
                  <p className="text-body-sm font-mono text-brand-text-secondary">{biz.id}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Owner</span>
                  <p className="text-body-sm text-brand-text-secondary">{ownerEmail}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Timestamps</span>
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
                    <span title="Created"><Calendar className="w-3 h-3 text-brand-text-tertiary inline mr-1" />{new Date(biz.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span title="Last Updated"><Clock className="w-3 h-3 text-brand-text-tertiary inline mr-1" />{new Date(biz.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Onboarding</span>
                  <div className="flex items-center gap-1.5">
                    {submission ? (
                      <Badge variant="success" className="h-5 text-[9px] gap-1 px-1.5">
                        <Check className="w-2.5 h-2.5" />
                        SUBMITTED
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="h-5 text-[9px] gap-1 px-1.5">
                        <Clock className="w-2.5 h-2.5" />
                        PENDING
                      </Badge>
                    )}
                    <span className="text-[10px] text-brand-text-tertiary">{submission ? new Date(submission.submitted_at).toLocaleDateString() : 'Awaiting start'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle Actions */}
          <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
            {transitions.map((status: string) => (
              <Button
                key={status}
                variant={status === "active" || status === "ready_for_activation" ? "primary" : status === "restricted" || status === "deactivated" ? "ghost" : "secondary"}
                className={`h-9 text-body-sm px-4 ${
                  status === "restricted" || status === "deactivated" 
                    ? "text-functional-error hover:bg-functional-error/10" 
                    : ""
                }`}
                onClick={() => handleLifecycleChange(status)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                {getLifecycleLabel(status)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-border/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-body-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "text-brand-primary border-brand-primary"
                : "text-brand-text-tertiary border-transparent hover:text-brand-text-secondary hover:border-brand-border"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab 
          biz={biz} 
          submission={submission} 
          config={config} 
          health={data.health}
          integrations={data.integrations}
          automations={data.automations}
          playbooks={data.playbooks}
          executionRuns={data.executionRuns || []}
          isLive={!!isLive}
          isBlocked={!!isBlocked}
        />
      )}
      {activeTab === "integrations" && (
        <IntegrationsTab integrations={data.integrations} businessId={biz.id} />
      )}
      {activeTab === "automations" && (
        <AutomationsTab automations={data.automations} businessId={biz.id} />
      )}
      {activeTab === "execution" && (
        <ExecutionTab runs={data.executionRuns || []} automations={data.automations} businessId={biz.id} />
      )}
      {activeTab === "intelligence" && (
        <IntelligenceTab insights={data.insights || []} businessId={biz.id} />
      )}
      {activeTab === "flags" && (
        <FeatureFlagsTab flags={data.featureFlags || []} businessId={biz.id} />
      )}
      {activeTab === "notes" && (
        <NotesTab notes={data.notes} businessId={biz.id} />
      )}
      {activeTab === "history" && (
        <HistoryTab history={data.history} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// OVERVIEW TAB (with Go Live Readiness)
// ═══════════════════════════════════════════════

function OverviewTab({ biz, submission, config, health, integrations, automations, playbooks, executionRuns, isLive, isBlocked }: any) {
  const [readiness, setReadiness] = React.useState<any>(null);
  const [loadingReadiness, setLoadingReadiness] = React.useState(false);

  const handleCheckReadiness = async () => {
    setLoadingReadiness(true);
    try {
      const result = await checkGoLiveReadiness(biz.id);
      setReadiness(result);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingReadiness(false);
    }
  };

  // Auto-check on mount
  React.useEffect(() => {
    handleCheckReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Execution Health — Full Width */}
      <Card variant="elevated" className="lg:col-span-3 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Execution Readiness</h3>
          {isLive ? (
            <Badge variant="success" className="ml-auto">Live & Active</Badge>
          ) : isBlocked ? (
            <Badge variant="warning" className="ml-auto">Blocked — Status: {getLifecycleLabel(biz.status)}</Badge>
          ) : (
            <Badge variant="neutral" className="ml-auto">Awaiting Data</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <MetricBox label="Contacts" value={health.contactsCount} icon={Users} />
          <MetricBox label="Events" value={health.eventsCount} icon={Radio} />
          <MetricBox label="Actions" value={health.actionsCount} icon={Zap} />
          <MetricBox label="Integrations" value={integrations.filter((i: any) => i.status === "connected").length} icon={Plug} />
          <MetricBox label="Active Auto" value={automations.filter((a: any) => a.is_active).length} icon={Shield} />
          <MetricBox label="Playbooks" value={playbooks.filter((p: any) => p.is_active).length} icon={FileText} />
          <MetricBox label="Exec Runs" value={(executionRuns || []).length} icon={Activity} />
        </div>
        <div className="flex gap-8 mt-4 pt-4 border-t border-brand-border/30">
          <div className="text-[11px] text-brand-text-tertiary">
            Last Event: <span className="text-brand-text-secondary font-bold">{health.lastEventAt ? new Date(health.lastEventAt).toLocaleString() : "Never"}</span>
          </div>
          <div className="text-[11px] text-brand-text-tertiary">
            Last Action: <span className="text-brand-text-secondary font-bold">{health.lastActionAt ? new Date(health.lastActionAt).toLocaleString() : "Never"}</span>
            {health.lastActionStatus && <span className="ml-1 text-brand-text-tertiary">({health.lastActionStatus})</span>}
          </div>
        </div>
      </Card>

      {/* Go Live Readiness Panel */}
      <Card variant="elevated" className="lg:col-span-2 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Go Live Readiness</h3>
          <Button variant="ghost" className="ml-auto h-7 text-[10px]" onClick={handleCheckReadiness} disabled={loadingReadiness}>
            {loadingReadiness ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        
        {readiness ? (
          <>
            <div className="space-y-3">
              {readiness.checks.map((check: any, i: number) => (
                <ReadinessRow key={i} label={check.label} ready={check.ready} detail={check.ready ? undefined : check.reason} />
              ))}
            </div>
            <div className="pt-4 border-t border-brand-border/30">
              {readiness.allReady ? (
                <div className="flex items-center gap-2 text-functional-success">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ready for Go-Live</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-functional-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Not Ready — {readiness.blockingReasons.length} Blocking Issue{readiness.blockingReasons.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-1">
                    {readiness.blockingReasons.map((reason: string, i: number) => (
                      <p key={i} className="text-[10px] text-functional-error pl-7">• {reason}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-24 text-brand-text-tertiary text-body-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking readiness…
          </div>
        )}
      </Card>

      {/* Business Profile */}
      <Card variant="elevated" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Business Profile</h3>
        </div>
        <div className="space-y-3">
          <InfoRow label="Name" value={biz.business_name} />
          <InfoRow label="Type" value={biz.business_type || "—"} />
          <InfoRow label="Website" value={biz.website || "—"} />
          <InfoRow label="Timezone" value={biz.timezone || "UTC"} />
          <InfoRow label="Currency" value={biz.currency_code || "INR"} />
        </div>
      </Card>

      {/* Onboarding Submission */}
      <Card variant="elevated" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Onboarding Data</h3>
        </div>
        {submission ? (
          <div className="space-y-3">
            <InfoRow label="Business Type" value={submission.business_type} />
            <InfoRow label="Use Case" value={submission.use_case} />
            <InfoRow label="Monthly Volume" value={submission.monthly_volume} />
            <InfoRow label="Channels" value={submission.channels?.join(", ") || "—"} />
            <InfoRow label="Lead Sources" value={submission.lead_sources?.join(", ") || "—"} />
            <InfoRow label="Voice AI" value={submission.ai_voice_needed ? "Yes" : "No"} />
            <InfoRow label="Chatbot" value={submission.ai_chatbot_needed ? "Yes" : "No"} />
            {submission.conversion_challenge && (
              <div className="pt-2 border-t border-brand-border/30">
                <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Challenge</span>
                <p className="text-body-sm text-brand-text-secondary mt-1 leading-relaxed">{submission.conversion_challenge}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="w-5 h-5 text-brand-text-tertiary opacity-40 mb-2" />
            <p className="text-[11px] text-brand-text-tertiary">Not submitted yet</p>
          </div>
        )}
      </Card>

      {/* Quick Execution Summary */}
      <Card variant="elevated" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Execution Summary</h3>
        </div>
        <div className="space-y-3">
          <InfoRow label="Total Runs" value={String((executionRuns || []).length)} />
          <InfoRow label="Completed" value={String((executionRuns || []).filter((r: any) => r.status === "completed").length)} />
          <InfoRow label="Handed Off" value={String((executionRuns || []).filter((r: any) => r.status === "handed_off").length)} />
          <InfoRow label="Blocked" value={String((executionRuns || []).filter((r: any) => r.status === "blocked").length)} />
          <InfoRow label="Failed" value={String((executionRuns || []).filter((r: any) => r.status === "failed").length)} />
          <InfoRow label="Test Runs" value={String((executionRuns || []).filter((r: any) => r.mode === "test").length)} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// EXECUTION TAB
// ═══════════════════════════════════════════════

function ExecutionTab({ runs, automations, businessId }: { runs: any[]; automations: any[]; businessId: string }) {
  const autoMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of automations) m[a.id] = a.automation_name;
    return m;
  }, [automations]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-4 font-bold">Execution Logs</h3>
        <span className="text-[11px] text-brand-text-tertiary">{runs.length} runs recorded</span>
      </div>

      <Card variant="elevated" className="overflow-hidden">
        <table className="table-premium w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Time</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Trigger</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Automation</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Engine</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Channel</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Mode</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Status</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Blocked Reason</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-brand-text-tertiary text-body-sm">No execution runs recorded yet.</td></tr>
            )}
            {runs.map((run: any) => (
              <tr key={run.id} className="border-b border-brand-border/40 hover:bg-white/[0.015]">
                <td className="px-4 py-3 text-[11px] text-brand-text-tertiary whitespace-nowrap">
                  {new Date(run.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold text-brand-text-secondary">{getTriggerEventLabel(run.trigger_event)}</span>
                </td>
                <td className="px-4 py-3 text-[11px] text-brand-text-secondary">
                  {run.automation_id ? (autoMap[run.automation_id] || run.automation_id.substring(0, 8)) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">{run.execution_engine}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">{run.output_channel}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={run.mode === "live" ? "warning" : "neutral"} className="text-[9px]">
                    {run.mode}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getRunStatusColor(run.status)} className="text-[9px]">
                    {run.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[10px] text-brand-text-tertiary max-w-[200px] truncate" title={run.blocked_reason || ""}>
                  {run.blocked_reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// INTEGRATIONS TAB
// ═══════════════════════════════════════════════

function IntegrationsTab({ integrations, businessId }: { integrations: any[]; businessId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [newType, setNewType] = React.useState("email");
  const [newProvider, setNewProvider] = React.useState("");
  const [newStatus, setNewStatus] = React.useState("pending");
  const [newNotes, setNewNotes] = React.useState("");
  const [newMode, setNewMode] = React.useState("internal");
  const [newWebhook, setNewWebhook] = React.useState("");
  const [newRef, setNewRef] = React.useState("");
  const [newCredentials, setNewCredentials] = React.useState<any>({});

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    type: "",
    provider: "",
    status: "",
    health: "",
    notes: "",
    execution_mode: "",
    webhook_url: "",
    credentials: {} as any,
  });

  const handleEditMode = (integ: any) => {
    setEditForm({
      type: integ.integration_type || "",
      provider: integ.provider || "",
      status: integ.status || "pending",
      health: integ.health || "unknown",
      notes: integ.notes || "",
      execution_mode: integ.execution_mode || "internal",
      webhook_url: integ.webhook_url || "",
      credentials: integ.credentials || {},
    });
    setEditingId(integ.id);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await updateIntegration(editingId, businessId, {
        status: editForm.status,
        health: editForm.health,
        notes: editForm.notes || undefined,
        execution_mode: editForm.execution_mode,
        webhook_url: editForm.webhook_url || undefined,
        provider: editForm.provider || undefined,
        credentials: editForm.credentials,
      });
      alert("Integration updated successfully!");
      setEditingId(null);
      router.refresh();
    } catch (e: any) {
      alert(`Error updating integration: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newProvider) return alert("Provider is required");
    setLoading(true);
    try {
      await addIntegration(businessId, {
        integration_type: newType,
        provider: newProvider,
        status: newStatus,
        notes: newNotes || undefined,
        execution_mode: newMode,
        webhook_url: newWebhook || undefined,
        connection_reference: newRef || undefined,
        credentials: newCredentials,
      });
      setShowAdd(false);
      setNewProvider("");
      setNewNotes("");
      setNewWebhook("");
      setNewRef("");
      setNewCredentials({});
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (integ: any, newStatus: string) => {
    setLoading(true);
    try {
      await updateIntegration(integ.id, businessId, { status: newStatus });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this integration record?")) return;
    setLoading(true);
    try {
      await deleteIntegration(id, businessId);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-4 font-bold">Integration Registry</h3>
        <Button variant="secondary" className="h-9 text-body-sm gap-2" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card variant="elevated" className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Type</label>
              <select 
                value={newType} 
                onChange={e => { setNewType(e.target.value); setNewProvider(INTEGRATION_PROVIDERS[e.target.value]?.[0] || ""); }}
                className="input-base h-10 text-body-sm"
              >
                {INTEGRATION_TYPES.map(t => <option key={t} value={t}>{getIntegrationLabel(t)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Provider</label>
              <select value={newProvider} onChange={e => setNewProvider(e.target.value)} className="input-base h-10 text-body-sm">
                <option value="">Select…</option>
                {(INTEGRATION_PROVIDERS[newType] || []).map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-base h-10 text-body-sm">
                {INTEGRATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Notes</label>
              <input value={newNotes} onChange={e => setNewNotes(e.target.value)} className="input-base h-10 text-body-sm" placeholder="Optional notes" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Execution Mode</label>
              <select value={newMode} onChange={e => setNewMode(e.target.value)} className="input-base h-10 text-body-sm">
                <option value="internal">Internal</option>
                <option value="n8n">n8n Workflow</option>
                <option value="external_api">External API</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Webhook / API URL</label>
              <input value={newWebhook} onChange={e => setNewWebhook(e.target.value)} className="input-base h-10 text-body-sm" placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">System Reference (ID)</label>
              <input value={newRef} onChange={e => setNewRef(e.target.value)} className="input-base h-10 text-body-sm" placeholder="Account ID or Ref" />
            </div>
            
            {newType === 'whatsapp' && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key (Token)</label>
                  <input type="password" value={newCredentials?.api_key || ''} onChange={e => setNewCredentials({...newCredentials, api_key: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Phone Number ID</label>
                  <input value={newCredentials?.phone_number_id || ''} onChange={e => setNewCredentials({...newCredentials, phone_number_id: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
              </div>
            )}
            {newType === 'email' && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key</label>
                  <input type="password" value={newCredentials?.api_key || ''} onChange={e => setNewCredentials({...newCredentials, api_key: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">From Email</label>
                  <input value={newCredentials?.from_email || ''} onChange={e => setNewCredentials({...newCredentials, from_email: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
              </div>
            )}
            {newType === 'voice' && (
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key</label>
                  <input type="password" value={newCredentials?.api_key || ''} onChange={e => setNewCredentials({...newCredentials, api_key: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Caller ID</label>
                  <input value={newCredentials?.caller_id || ''} onChange={e => setNewCredentials({...newCredentials, caller_id: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Agent ID</label>
                  <input value={newCredentials?.agent_id || ''} onChange={e => setNewCredentials({...newCredentials, agent_id: e.target.value})} className="input-base h-10 text-body-sm" />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="h-9 text-body-sm" onClick={handleAdd} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </Button>
            <Button variant="ghost" className="h-9 text-body-sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Edit Form Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="elevated" className="p-6 w-full max-w-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-4">
              <h3 className="text-heading-4 font-bold">Edit Integration</h3>
              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/5 rounded text-brand-text-tertiary hover:text-brand-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Type</label>
                <select value={editForm.type} disabled className="input-base h-10 text-body-sm opacity-60">
                  <option value={editForm.type}>{getIntegrationLabel(editForm.type)}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Provider</label>
                <input value={editForm.provider} onChange={e => setEditForm(f => ({...f, provider: e.target.value}))} className="input-base h-10 text-body-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} className="input-base h-10 text-body-sm">
                  {INTEGRATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Health</label>
                <select value={editForm.health} onChange={e => setEditForm(f => ({...f, health: e.target.value}))} className="input-base h-10 text-body-sm">
                  <option value="unknown">unknown</option>
                  <option value="healthy">healthy</option>
                  <option value="degraded">degraded</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Execution Mode</label>
                <select value={editForm.execution_mode} onChange={e => setEditForm(f => ({...f, execution_mode: e.target.value}))} className="input-base h-10 text-body-sm">
                  <option value="internal">Internal</option>
                  <option value="n8n">n8n Workflow</option>
                  <option value="external_api">External API</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Webhook / API URL</label>
                <input value={editForm.webhook_url} onChange={e => setEditForm(f => ({...f, webhook_url: e.target.value}))} className="input-base h-10 text-body-sm" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} className="input-base py-2 min-h-[80px] text-body-sm" />
              </div>
              
              {editForm.type === 'whatsapp' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key (Token)</label>
                    <input type="password" value={editForm.credentials?.api_key || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, api_key: e.target.value}}))} className="input-base h-10 text-body-sm" />
                    <p className="text-[10px] text-brand-text-secondary italic mt-1">Provided by your WhatsApp provider dashboard (System Admin &gt; Security &gt; Tokens).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Phone Number ID</label>
                    <input value={editForm.credentials?.phone_number_id || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, phone_number_id: e.target.value}}))} className="input-base h-10 text-body-sm" />
                    <p className="text-[10px] text-brand-text-secondary italic mt-1">Found in WhatsApp Manager &gt; Phone Numbers.</p>
                  </div>
                </>
              )}
              {editForm.type === 'email' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key</label>
                    <input type="password" value={editForm.credentials?.api_key || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, api_key: e.target.value}}))} className="input-base h-10 text-body-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">From Email</label>
                    <input value={editForm.credentials?.from_email || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, from_email: e.target.value}}))} className="input-base h-10 text-body-sm" />
                  </div>
                </>
              )}
              {editForm.type === 'voice' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">API Key</label>
                    <input type="password" value={editForm.credentials?.api_key || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, api_key: e.target.value}}))} className="input-base h-10 text-body-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Caller ID</label>
                    <input value={editForm.credentials?.caller_id || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, caller_id: e.target.value}}))} className="input-base h-10 text-body-sm" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Agent ID</label>
                    <input value={editForm.credentials?.agent_id || ''} onChange={e => setEditForm(f => ({...f, credentials: {...f.credentials, agent_id: e.target.value}}))} className="input-base h-10 text-body-sm" />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border/40">
              <Button variant="ghost" onClick={() => setEditingId(null)} disabled={loading}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Table */}
      <Card variant="elevated" className="overflow-hidden">
        <table className="table-premium w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Type</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Provider</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Status</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Health</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Connected</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Notes</th>
              <th className="h-10 px-5 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {integrations.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-brand-text-tertiary text-body-sm">No integrations recorded.</td></tr>
            )}
            {integrations.map((integ: any) => (
              <tr key={integ.id} className="border-b border-brand-border/40 hover:bg-white/[0.015]">
                <td className="px-5 py-3 text-body-sm font-bold">{getIntegrationLabel(integ.integration_type)}</td>
                <td className="px-5 py-3 text-body-sm text-brand-text-secondary">{integ.provider || "—"}</td>
                <td className="px-5 py-3">
                  <Badge variant={getIntegrationStatusColor(integ.status)}>
                    {integ.status}
                  </Badge>
                  <div className="text-[9px] text-brand-text-tertiary mt-1 uppercase font-bold">{integ.execution_mode}</div>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={getHealthColor(integ.health)}>{integ.health || "unknown"}</Badge>
                  {integ.last_tested_at && (
                    <div className="text-[9px] text-brand-text-tertiary mt-1">Tested: {new Date(integ.last_tested_at).toLocaleDateString()}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary">
                  {integ.connected_at ? new Date(integ.connected_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary max-w-[200px] truncate">
                  {integ.notes || "—"}
                  {integ.webhook_url && <div className="text-[9px] opacity-60 mt-1 truncate">{integ.webhook_url}</div>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await testIntegrationConnection(integ.id, businessId);
                          alert(`${res.status.toUpperCase()}: ${res.message}`);
                          router.refresh();
                        } catch (e: any) {
                          alert(e.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-text-tertiary hover:text-brand-primary" 
                      title="Test Connection"
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </button>
                    {integ.status !== "connected" && (
                      <button onClick={() => handleStatusToggle(integ, "connected")} className="p-1.5 rounded hover:bg-functional-success/10 text-functional-success" title="Mark Connected">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {integ.status === "connected" && (
                      <button onClick={() => handleStatusToggle(integ, "disconnected")} className="p-1.5 rounded hover:bg-functional-warning/10 text-functional-warning" title="Disconnect">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleEditMode(integ)} className="p-1.5 rounded hover:bg-brand-text-tertiary/20 text-brand-text-tertiary hover:text-white" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(integ.id)} className="p-1.5 rounded hover:bg-functional-error/10 text-functional-error" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// AUTOMATIONS TAB (with Test/Activate/Pause/Archive actions)
// ═══════════════════════════════════════════════

function AutomationsTab({ automations, businessId }: { automations: any[]; businessId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ 
    name: "", 
    type: "lead_scoring", 
    trigger: "", 
    mode: "test", 
    notes: "",
    engine: "internal",
    channel: "internal_task",
    trigger_event: "lead_created",
    webhook_url: "",
    workflow_id: "",
    fallback_action: "block",
    required_integration_type: "",
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: "",
    trigger_event: "",
    execution_engine: "",
    output_channel: "",
    status: "",
    mode: "test"
  });

  const handleEditMode = (auto: any) => {
    setEditForm({
      name: auto.automation_name || "",
      trigger_event: auto.trigger_event || "",
      execution_engine: auto.execution_engine || "internal",
      output_channel: auto.output_channel || "internal_task",
      status: auto.status || "draft",
      mode: auto.mode || "test",
    });
    setEditingId(auto.id);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await updateAutomation(editingId, businessId, {
        automation_name: editForm.name,
        trigger_event: editForm.trigger_event,
        execution_engine: editForm.execution_engine,
        output_channel: editForm.output_channel,
        status: editForm.status,
        mode: editForm.mode,
      });
      alert("Automation updated successfully!");
      setEditingId(null);
      router.refresh();
    } catch (e: any) {
      alert(`Error updating automation: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name) return alert("Automation name is required");
    setLoading(true);
    try {
      await addAutomation(businessId, {
        automation_name: form.name,
        automation_type: form.type,
        trigger_description: form.trigger || undefined,
        mode: form.mode,
        notes: form.notes || undefined,
        execution_engine: form.engine,
        output_channel: form.channel,
        trigger_event: form.trigger_event,
        webhook_url: form.webhook_url || undefined,
        workflow_id: form.workflow_id || undefined,
        fallback_action: form.fallback_action,
        required_integration_type: form.required_integration_type || undefined,
      });
      setShowAdd(false);
      setForm({ name: "", type: "lead_scoring", trigger: "", mode: "test", notes: "", engine: "internal", channel: "internal_task", trigger_event: "lead_created", webhook_url: "", workflow_id: "", fallback_action: "block", required_integration_type: "" });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (auto: any, newStatus: string) => {
    setLoading(true);
    try {
      await updateAutomation(auto.id, businessId, { status: newStatus });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestExecution = async (auto: any) => {
    setTestingId(auto.id);
    try {
      const result = await testExecuteAutomation(auto.id, businessId);
      const statuses = result.results.map((r: any) => `${r.status}${r.blocked_reason ? `: ${r.blocked_reason}` : ""}`).join("\n");
      alert(`Test Execution Complete:\n${statuses}`);
      router.refresh();
    } catch (e: any) {
      alert(`Test Error: ${e.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation record?")) return;
    setLoading(true);
    try {
      await deleteAutomation(id, businessId);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-4 font-bold">Automation Registry</h3>
        <Button variant="secondary" className="h-9 text-body-sm gap-2" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" />
          Add Automation
        </Button>
      </div>

      {showAdd && (
        <Card variant="elevated" className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base h-10 text-body-sm" placeholder="e.g. Lead Scoring v1" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-base h-10 text-body-sm">
                {AUTOMATION_TYPES.map(t => <option key={t} value={t}>{getAutomationLabel(t)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className="input-base h-10 text-body-sm">
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Trigger Event</label>
              <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className="input-base h-10 text-body-sm">
                {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{getTriggerEventLabel(t)}</option>)}
              </select>
              <p className="text-[10px] text-brand-text-secondary italic mt-1">This specific event forces execution. Eg. 'lead_created' will trigger whenever a lead hits ingestion.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Exec Engine</label>
              <select value={form.engine} onChange={e => setForm(f => ({ ...f, engine: e.target.value }))} className="input-base h-10 text-body-sm">
                {EXECUTION_ENGINES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Output Channel</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="input-base h-10 text-body-sm">
                {OUTPUT_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Fallback</label>
              <select value={form.fallback_action} onChange={e => setForm(f => ({ ...f, fallback_action: e.target.value }))} className="input-base h-10 text-body-sm">
                <option value="block">Block</option>
                <option value="skip">Skip</option>
                <option value="notify_ops">Notify Ops</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Webhook URL</label>
              <input value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} className="input-base h-10 text-body-sm" placeholder="URL or ID" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Required Integration Type</label>
              <select value={form.required_integration_type} onChange={e => setForm(f => ({ ...f, required_integration_type: e.target.value }))} className="input-base h-10 text-body-sm">
                <option value="">None</option>
                {INTEGRATION_TYPES.map(t => <option key={t} value={t}>{getIntegrationLabel(t)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base h-10 text-body-sm" placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="h-9 text-body-sm" onClick={handleAdd} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </Button>
            <Button variant="ghost" className="h-9 text-body-sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Edit Form Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="elevated" className="p-6 w-full max-w-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-4">
              <h3 className="text-heading-4 font-bold">Edit Automation</h3>
              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/5 rounded text-brand-text-tertiary hover:text-brand-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} className="input-base h-10 text-body-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Trigger Event</label>
                <select value={editForm.trigger_event} onChange={e => setEditForm(f => ({...f, trigger_event: e.target.value}))} className="input-base h-10 text-body-sm">
                  {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{getTriggerEventLabel(t)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Execution Engine</label>
                <select value={editForm.execution_engine} onChange={e => setEditForm(f => ({...f, execution_engine: e.target.value}))} className="input-base h-10 text-body-sm">
                  {EXECUTION_ENGINES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Output Channel</label>
                <select value={editForm.output_channel} onChange={e => setEditForm(f => ({...f, output_channel: e.target.value}))} className="input-base h-10 text-body-sm">
                  {OUTPUT_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} className="input-base h-10 text-body-sm">
                  <option value="draft">draft</option>
                  <option value="review">review</option>
                  <option value="approved">approved</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="failed">failed</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Mode</label>
                <select value={editForm.mode} onChange={e => setEditForm(f => ({...f, mode: e.target.value}))} className="input-base h-10 text-body-sm">
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border/40">
              <Button variant="ghost" onClick={() => setEditingId(null)} disabled={loading}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card variant="elevated" className="overflow-hidden">
        <table className="table-premium w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Name</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Trigger</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Status</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Engine</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Channel</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Mode</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Last Run</th>
              <th className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {automations.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-brand-text-tertiary text-body-sm">No automations recorded.</td></tr>
            )}
            {automations.map((auto: any) => (
              <tr key={auto.id} className="border-b border-brand-border/40 hover:bg-white/[0.015]">
                <td className="px-4 py-3">
                  <span className="text-body-sm font-bold">{auto.automation_name}</span>
                  <span className="block text-[10px] text-brand-text-tertiary mt-0.5">{getAutomationLabel(auto.automation_type)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold text-brand-text-secondary">{getTriggerEventLabel(auto.trigger_event || "—")}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusColor(auto.status || "draft")} className="text-[9px]">{auto.status || "draft"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-brand-primary" />
                      {auto.execution_engine}
                    </span>
                    <span className="text-[9px] opacity-60 truncate max-w-[100px]">{auto.webhook_url || auto.workflow_id || 'no link'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">
                  {auto.output_channel || "internal"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={auto.mode === "live" ? "warning" : "neutral"} className="text-[9px]">{auto.mode || "test"}</Badge>
                </td>
                <td className="px-4 py-3 text-[11px] text-brand-text-tertiary">
                  {auto.last_run_at ? new Date(auto.last_run_at).toLocaleString() : "Never"}
                  {auto.last_result && <span className={`ml-1 ${auto.last_result === 'success' ? 'text-functional-success' : 'text-functional-error'}`}>({auto.last_result})</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {/* Test */}
                    <button 
                      onClick={() => handleTestExecution(auto)}
                      className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-text-tertiary hover:text-brand-primary" 
                      title="Test Execute"
                      disabled={testingId === auto.id}
                    >
                      {testingId === auto.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
                    </button>
                    {/* Approve */}
                    {(auto.status === "draft" || auto.status === "review") && (
                      <button onClick={() => handleStatusChange(auto, "approved")} className="p-1.5 rounded hover:bg-functional-success/10 text-functional-success" title="Approve">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Activate */}
                    {auto.status === "approved" && (
                      <button onClick={() => handleStatusChange(auto, "active")} className="p-1.5 rounded hover:bg-functional-success/10 text-functional-success" title="Activate">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Pause */}
                    {auto.status === "active" && (
                      <button onClick={() => handleStatusChange(auto, "paused")} className="p-1.5 rounded hover:bg-functional-warning/10 text-functional-warning" title="Pause">
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Archive */}
                    {(auto.status === "paused" || auto.status === "failed") && (
                      <button onClick={() => handleStatusChange(auto, "archived")} className="p-1.5 rounded hover:bg-brand-text-tertiary/10 text-brand-text-tertiary" title="Archive">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Edit */}
                    <button onClick={() => handleEditMode(auto)} className="p-1.5 rounded hover:bg-brand-text-tertiary/20 text-brand-text-tertiary hover:text-white" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleDelete(auto.id)} className="p-1.5 rounded hover:bg-functional-error/10 text-functional-error" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════

function NotesTab({ notes, businessId }: { notes: any[]; businessId: string }) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addOpsNote(businessId, content.trim());
      setContent("");
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    setLoading(true);
    try {
      await deleteOpsNote(id, businessId);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="text-heading-4 font-bold">Internal Notes</h3>

      {/* Add Note */}
      <Card variant="elevated" className="p-5 space-y-3">
        <textarea 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          className="input-base h-24 py-3 resize-none"
          placeholder="Add an internal note about this workspace…"
        />
        <Button variant="primary" className="h-9 text-body-sm gap-2" onClick={handleAdd} disabled={loading || !content.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Post Note
        </Button>
      </Card>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-body-sm text-brand-text-tertiary py-8 text-center">No internal notes yet.</p>
        )}
        {notes.map((note: any) => (
          <Card key={note.id} className="p-4 border border-brand-border/40 bg-brand-bg-secondary/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary">
                <span className="font-bold text-brand-text-secondary">{note.author_email}</span>
                <span>·</span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <button onClick={() => handleDelete(note.id)} className="p-1 rounded hover:bg-functional-error/10 text-brand-text-tertiary hover:text-functional-error">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-body-sm text-brand-text-primary leading-relaxed whitespace-pre-wrap">{note.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════

function HistoryTab({ history }: { history: any[] }) {
  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="text-heading-4 font-bold">Status History</h3>
      
      {history.length === 0 && (
        <p className="text-body-sm text-brand-text-tertiary py-8 text-center">No status changes recorded yet.</p>
      )}

      <div className="space-y-0">
        {history.map((entry: any, i: number) => (
          <div key={entry.id} className="flex gap-4 py-3 border-b border-brand-border/20 last:border-0">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5" />
              {i < history.length - 1 && <div className="w-px flex-1 bg-brand-border/30 mt-1" />}
            </div>
            <div className="flex-1 space-y-1 pb-2">
              <div className="flex items-center gap-2">
                {entry.old_status && (
                  <>
                    <Badge variant={getLifecycleColor(entry.old_status)} className="text-[9px]">{getLifecycleLabel(entry.old_status)}</Badge>
                    <span className="text-brand-text-tertiary text-[10px]">→</span>
                  </>
                )}
                <Badge variant={getLifecycleColor(entry.new_status)} className="text-[9px]">{getLifecycleLabel(entry.new_status)}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary">
                <span className="font-bold">{entry.changed_by}</span>
                <span>·</span>
                <span>{new Date(entry.changed_at).toLocaleString()}</span>
              </div>
              {entry.reason && (
                <p className="text-[11px] text-brand-text-secondary mt-1">{entry.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// INTELLIGENCE TAB
// ═══════════════════════════════════════════════

function IntelligenceTab({ insights, businessId }: { insights: any[]; businessId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<string>("all");

  const openInsights = insights.filter((i: any) => i.status === "open");
  const fixingTypes = ['integration_failure', 'action_failed', 'stuck_lead', 'engine_error', 'configuration_needed'];
  const fixingNeeds = openInsights.filter((i: any) => fixingTypes.includes(i.type));
  const opportunities = openInsights.filter((i: any) => !fixingTypes.includes(i.type));

  const filteredInsights = filter === "all" ? insights : insights.filter((i: any) => i.status === filter);
  const openCount = openInsights.length;
  const highCount = insights.filter((i: any) => (i.priority === "critical" || i.priority === "high") && i.status === 'open').length;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await triggerInsightGeneration(businessId);
      alert(`Intelligence run complete:\n• Insights generated: ${result.insights_generated}\n• Events created: ${result.events_created}\n• Festivals found: ${result.festivals_found}`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (insightId: string, status: string) => {
    setLoading(true);
    try {
      await updateInsightStatus(insightId, businessId, status);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-heading-4 font-bold">Insights Board</h3>
          <Badge variant={openCount > 0 ? "warning" : "neutral"} className="text-[9px]">{openCount} open</Badge>
          {highCount > 0 && <Badge variant="error" className="text-[9px]">{highCount} high priority</Badge>}
        </div>
        <Button variant="secondary" className="h-9 text-body-sm gap-2" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          Run Intelligence
        </Button>
      </div>

      <div className="flex gap-1">
        {["all", "open", "acknowledged", "acted", "dismissed"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
              filter === s ? "bg-brand-primary text-white" : "bg-brand-bg-primary/30 text-brand-text-tertiary hover:text-brand-text-secondary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filter === "open" ? (
          <>
            {fixingNeeds.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-functional-error">
                  <AlertCircle className="w-4 h-4" />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest">What needs fixing now</h4>
                </div>
                {fixingNeeds.map((insight: any) => (
                   <InsightCard key={insight.id} insight={insight} businessId={businessId} handleStatusChange={handleStatusChange} loading={loading} />
                ))}
              </div>
            )}
            {opportunities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest">Opportunities & Re-engagement</h4>
                </div>
                {opportunities.map((insight: any) => (
                   <InsightCard key={insight.id} insight={insight} businessId={businessId} handleStatusChange={handleStatusChange} loading={loading} />
                ))}
              </div>
            )}
            {fixingNeeds.length === 0 && opportunities.length === 0 && (
              <Card variant="elevated" className="p-12 text-center text-brand-text-tertiary text-body-sm">
                No open insights. Everything looks clear!
              </Card>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {filteredInsights.length === 0 ? (
              <Card variant="elevated" className="p-12 text-center text-brand-text-tertiary text-body-sm">
                No insights to display in this category.
              </Card>
            ) : (
              filteredInsights.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} businessId={businessId} handleStatusChange={handleStatusChange} loading={loading} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight, businessId, handleStatusChange, loading }: { insight: any, businessId: string, handleStatusChange: any, loading: boolean }) {
  return (
    <Card variant="elevated" className="p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${
          insight.priority === "critical" ? "bg-functional-error/10 text-functional-error" :
          insight.priority === "high" ? "bg-functional-warning/10 text-functional-warning" : "bg-brand-primary/10 text-brand-primary"
        }`}>
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">
            {getInsightLabel(insight.type)} • {new Date(insight.created_at).toLocaleString()}
          </p>
          <p className="text-body-sm text-brand-text-primary mt-1 font-bold">{insight.message}</p>
          {insight.recommended_action && (
             <p className="text-[11px] text-brand-text-secondary mt-1 italic">💡 {insight.recommended_action}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {insight.status === "open" && (
            <>
              <button onClick={() => handleStatusChange(insight.id, "acknowledged")} className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-text-tertiary transition-colors" title="Acknowledge"><Eye className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleStatusChange(insight.id, "acted")} className="p-1.5 rounded hover:bg-functional-success/10 text-functional-success transition-colors" title="Mark Acted"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleStatusChange(insight.id, "dismissed")} className="p-1.5 rounded hover:bg-functional-error/10 text-brand-text-tertiary transition-colors" title="Dismiss"><X className="w-3.5 h-3.5" /></button>
            </>
          )}
          <Badge variant={insight.status === "open" ? "warning" : insight.status === "acted" ? "success" : "neutral"} className="text-[9px] h-6">{insight.status}</Badge>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════
// FEATURE FLAGS TAB
// ═══════════════════════════════════════════════

function FeatureFlagsTab({ flags, businessId }: { flags: any[]; businessId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);

  const flagMap: Record<string, boolean> = {};
  for (const f of flags) {
    flagMap[f.flag_key] = f.enabled;
  }

  const handleToggle = async (flagKey: string, currentValue: boolean) => {
    const newValue = !currentValue;
    const action = newValue ? "ENABLE" : "DISABLE";
    if (!confirm(`${action} "${FEATURE_FLAG_LABELS[flagKey as FeatureFlagKey]}" for this workspace?`)) return;

    setLoading(flagKey);
    try {
      await toggleFeatureFlag(businessId, flagKey, newValue);
      alert(`Flag ${newValue ? "enabled" : "disabled"} successfully.`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-4 font-bold">Feature Flags</h3>
        <span className="text-[11px] text-brand-text-tertiary">
          {Object.values(flagMap).filter(Boolean).length} of {FEATURE_FLAGS.length} enabled
        </span>
      </div>

      <div className="space-y-2">
        {FEATURE_FLAGS.map((flagKey) => {
          const enabled = flagMap[flagKey] || false;
          const isLoading = loading === flagKey;
          const flagMeta = flags.find((f: any) => f.flag_key === flagKey);

          return (
            <Card key={flagKey} variant="elevated" className={`p-4 transition-colors ${enabled ? "border-functional-success/30" : ""}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggle(flagKey, enabled)}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-brand-text-tertiary" />
                  ) : enabled ? (
                    <ToggleRight className="w-6 h-6 text-functional-success" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-brand-text-tertiary" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-bold text-brand-text-primary">
                      {FEATURE_FLAG_LABELS[flagKey]}
                    </span>
                    <Badge variant={enabled ? "success" : "neutral"} className="text-[9px]">
                      {enabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-brand-text-tertiary mt-0.5">
                    {FEATURE_FLAG_DESCRIPTIONS[flagKey]}
                  </p>
                  {flagMeta?.updated_at && (
                    <p className="text-[9px] text-brand-text-tertiary mt-1">
                      Last changed: {new Date(flagMeta.updated_at).toLocaleString()}{" "}
                      {flagMeta.updated_by && `by ${flagMeta.updated_by}`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SHARED MICRO-COMPONENTS
// ═══════════════════════════════════════════════

function MetricBox({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="p-3 bg-brand-bg-primary/50 border border-brand-border/30 rounded-xl text-center space-y-1">
      <Icon className="w-4 h-4 text-brand-text-tertiary mx-auto" />
      <p className="text-heading-3 font-bold">{value}</p>
      <p className="text-[9px] text-brand-text-tertiary uppercase tracking-widest font-bold">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">{label}</span>
      <span className="text-body-sm text-brand-text-secondary font-medium">{value}</span>
    </div>
  );
}

function ReadinessRow({ label, ready, detail }: { label: string; ready: boolean; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <span className="text-[11px] text-brand-text-secondary">{label}</span>
        {!ready && detail && <p className="text-[10px] text-functional-error mt-0.5">{detail}</p>}
      </div>
      <div className="shrink-0">
        {ready ? (
          <Check className="w-4 h-4 text-functional-success" />
        ) : (
          <X className="w-4 h-4 text-functional-error" />
        )}
      </div>
    </div>
  );
}
