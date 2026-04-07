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
  INTEGRATION_TYPES,
  INTEGRATION_PROVIDERS,
  AUTOMATION_TYPES,
} from "@/lib/config/ops-constants";
import {
  updateWorkspaceLifecycle,
  addIntegration,
  updateIntegration,
  deleteIntegration,
  addAutomation,
  updateAutomation,
  deleteAutomation,
  addOpsNote,
  deleteOpsNote,
} from "@/app/actions/ops-actions";
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
  ChevronDown,
  AlertCircle,
  Users,
  Calendar,
  Database,
  Radio,
  Clock,
  Shield,
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
}

export function WorkspaceDetailShell({ data }: { data: WorkspaceDetailData }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"overview" | "integrations" | "automations" | "notes" | "history">("overview");

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
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "integrations", label: `Integrations (${data.integrations.length})`, icon: Plug },
    { key: "automations", label: `Automations (${data.automations.length})`, icon: Zap },
    { key: "notes", label: `Notes (${data.notes.length})`, icon: MessageSquare },
    { key: "history", label: "History", icon: History },
  ] as const;

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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-heading-2 font-bold tracking-tight">{biz.business_name}</h1>
            <Badge variant={getLifecycleColor(biz.status)}>{getLifecycleLabel(biz.status)}</Badge>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-brand-text-tertiary">
            <span>{ownerEmail}</span>
            <span>·</span>
            <span>Created {new Date(biz.created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span className="font-mono">{biz.id.slice(0, 8)}…</span>
          </div>
        </div>

        {/* Lifecycle Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {transitions.map((status) => (
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {getLifecycleLabel(status)}
            </Button>
          ))}
        </div>
      </div>

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
// OVERVIEW TAB
// ═══════════════════════════════════════════════

function OverviewTab({ biz, submission, config, health, integrations, automations, playbooks, isLive, isBlocked }: any) {
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <MetricBox label="Contacts" value={health.contactsCount} icon={Users} />
          <MetricBox label="Events" value={health.eventsCount} icon={Radio} />
          <MetricBox label="Actions" value={health.actionsCount} icon={Zap} />
          <MetricBox label="Integrations" value={integrations.filter((i: any) => i.status === "connected").length} icon={Plug} />
          <MetricBox label="Active Automations" value={automations.filter((a: any) => a.is_active).length} icon={Shield} />
          <MetricBox label="Playbooks" value={playbooks.filter((p: any) => p.is_active).length} icon={FileText} />
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

      {/* Setup Readiness */}
      <Card variant="elevated" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Setup State</h3>
        </div>
        <div className="space-y-3">
          <ReadinessRow label="Onboarding" ready={!!submission} />
          <ReadinessRow label="Email (Resend)" ready={!!(config.resend_api_key && config.resend_from_email)} />
          <ReadinessRow label="WhatsApp" ready={!!(config.whatsapp_api_key && config.whatsapp_sender_id)} />
          <ReadinessRow label="Execution Engine" ready={!!config.execution_mode} detail={config.execution_mode || "not set"} />
          <ReadinessRow label="Has Contacts" ready={health.contactsCount > 0} detail={`${health.contactsCount}`} />
          <ReadinessRow label="Has Active Playbooks" ready={playbooks.some((p: any) => p.is_active)} />
        </div>
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
  const [newStatus, setNewStatus] = React.useState("configured");
  const [newNotes, setNewNotes] = React.useState("");

  const handleAdd = async () => {
    if (!newProvider) return alert("Provider is required");
    setLoading(true);
    try {
      await addIntegration(businessId, {
        integration_type: newType,
        provider: newProvider,
        status: newStatus,
        notes: newNotes || undefined,
      });
      setShowAdd(false);
      setNewProvider("");
      setNewNotes("");
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
                <option value="configured">Configured</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Notes</label>
              <input value={newNotes} onChange={e => setNewNotes(e.target.value)} className="input-base h-10 text-body-sm" placeholder="Optional notes" />
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
                  <Badge variant={integ.status === "connected" ? "success" : integ.status === "error" ? "error" : "neutral"}>
                    {integ.status}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={getHealthColor(integ.health)}>{integ.health || "unknown"}</Badge>
                </td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary">
                  {integ.connected_at ? new Date(integ.connected_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary max-w-[200px] truncate">{integ.notes || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
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
// AUTOMATIONS TAB
// ═══════════════════════════════════════════════

function AutomationsTab({ automations, businessId }: { automations: any[]; businessId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", type: "lead_scoring", trigger: "", mode: "test", notes: "" });

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
      });
      setShowAdd(false);
      setForm({ name: "", type: "lead_scoring", trigger: "", mode: "test", notes: "" });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (auto: any) => {
    setLoading(true);
    try {
      await updateAutomation(auto.id, businessId, { is_active: !auto.is_active });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = async (auto: any, mode: string) => {
    setLoading(true);
    try {
      await updateAutomation(auto.id, businessId, { mode });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">Trigger</label>
              <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} className="input-base h-10 text-body-sm" placeholder="e.g. On new lead event" />
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

      <Card variant="elevated" className="overflow-hidden">
        <table className="table-premium w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Name</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Type</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Active</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Mode</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Approved By</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Last Run</th>
              <th className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary text-left">Health</th>
              <th className="h-10 px-5 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {automations.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-brand-text-tertiary text-body-sm">No automations recorded.</td></tr>
            )}
            {automations.map((auto: any) => (
              <tr key={auto.id} className="border-b border-brand-border/40 hover:bg-white/[0.015]">
                <td className="px-5 py-3">
                  <span className="text-body-sm font-bold">{auto.automation_name}</span>
                  {auto.trigger_description && <span className="block text-[10px] text-brand-text-tertiary mt-0.5">{auto.trigger_description}</span>}
                </td>
                <td className="px-5 py-3 text-body-sm text-brand-text-secondary">{getAutomationLabel(auto.automation_type)}</td>
                <td className="px-5 py-3">
                  <button 
                    onClick={() => handleToggle(auto)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${auto.is_active ? "bg-functional-success" : "bg-brand-border"}`}
                    disabled={loading}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${auto.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <select 
                    value={auto.mode || "test"} 
                    onChange={e => handleModeSwitch(auto, e.target.value)} 
                    className="bg-transparent border border-brand-border/30 rounded px-2 py-1 text-[11px] text-brand-text-secondary"
                    disabled={loading}
                  >
                    <option value="test">Test</option>
                    <option value="live">Live</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary">{auto.approved_by || "—"}</td>
                <td className="px-5 py-3 text-[11px] text-brand-text-tertiary">
                  {auto.last_run_at ? new Date(auto.last_run_at).toLocaleString() : "Never"}
                  {auto.last_result && <span className="ml-1 opacity-60">({auto.last_result})</span>}
                </td>
                <td className="px-5 py-3"><Badge variant={getHealthColor(auto.health)}>{auto.health || "unknown"}</Badge></td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(auto.id)} className="p-1.5 rounded hover:bg-functional-error/10 text-functional-error" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-brand-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[10px] text-brand-text-tertiary">{detail}</span>}
        {ready ? (
          <Check className="w-4 h-4 text-functional-success" />
        ) : (
          <X className="w-4 h-4 text-brand-text-tertiary opacity-40" />
        )}
      </div>
    </div>
  );
}
