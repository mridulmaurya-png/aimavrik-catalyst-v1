"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Megaphone, Plus, Inbox, Play, Pause, Mail, MessageSquare, 
  Target, RefreshCw, X, CheckCircle2
} from "lucide-react";
import { createCampaign, updateCampaignStatus, type Campaign } from "@/app/actions/campaigns";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  { id: "remarketing", name: "Remarketing" },
  { id: "reactivation", name: "Reactivation" },
  { id: "cross_sell", name: "Cross-Sell" },
  { id: "upsell", name: "Upsell" },
  { id: "retention", name: "Retention" },
  { id: "lead_nurture", name: "Lead Nurture" },
];

const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral" | "info" | "error"> = {
  active: "success",
  draft: "neutral",
  paused: "warning",
  completed: "info",
};

interface CampaignsClientProps {
  campaigns: Campaign[];
  segments: any[];
  playbooks: any[];
}

export default function CampaignsClient({ campaigns: initialCampaigns, segments, playbooks }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = React.useState(initialCampaigns);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Create form state
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<Campaign["category"]>("lead_nurture");
  const [channel, setChannel] = React.useState<Campaign["channel"]>("whatsapp");
  const [objective, setObjective] = React.useState("");
  const [segmentId, setSegmentId] = React.useState(segments[0]?.id || "");
  const [playbookId, setPlaybookId] = React.useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = await createCampaign({
        name: name.trim(),
        category,
        channel,
        objective: objective.trim() || `${category.replace(/_/g, " ")} campaign`,
        status: "draft",
        audience_segment_id: segmentId,
        playbook_id: playbookId || null,
      });
      setCampaigns([...campaigns, created]);
      setShowCreate(false);
      setName(""); setObjective("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      await updateCampaignStatus(id, newStatus);
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus as Campaign["status"] } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Campaigns</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Create and manage revenue campaigns targeting your audience segments.
          </p>
        </div>
        <Button className="gap-2 h-11 px-6" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Create campaign
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card variant="elevated" className="p-6 space-y-6 border-brand-primary/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-4 font-bold">New Campaign</h3>
            <Button variant="ghost" className="w-8 h-8 p-0" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Campaign Name</label>
              <Input className="h-11 bg-brand-bg-primary" placeholder="e.g. Q2 Stale Lead Recovery" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Category</label>
              <select className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary" value={category} onChange={e => setCategory(e.target.value as Campaign["category"])}>
                {CATEGORY_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Channel</label>
              <select className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary" value={channel} onChange={e => setChannel(e.target.value as Campaign["channel"])}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Target Segment</label>
              <select className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary" value={segmentId} onChange={e => setSegmentId(e.target.value)}>
                {segments.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.count})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Linked Playbook (optional)</label>
              <select className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary" value={playbookId} onChange={e => setPlaybookId(e.target.value)}>
                <option value="">None</option>
                {playbooks.map((p: any) => <option key={p.id} value={p.id}>{p.playbook_type}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Objective</label>
              <Input className="h-11 bg-brand-bg-primary" placeholder="Brief goal for this campaign" value={objective} onChange={e => setObjective(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="gap-2 px-6" onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </Card>
      )}

      {/* Campaign Cards */}
      {campaigns.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map(campaign => {
            const segDef = segments.find((s: any) => s.id === campaign.audience_segment_id);
            return (
              <Card key={campaign.id} variant="elevated" className="p-6 space-y-5 group hover:border-brand-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-brand-primary" />
                  </div>
                  <Badge variant={STATUS_VARIANTS[campaign.status] || "neutral"} className="capitalize">
                    {campaign.status}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-body-md font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors">{campaign.name}</h4>
                  <p className="text-[11px] text-brand-text-tertiary">{campaign.objective}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-border/30">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Category</p>
                    <p className="text-body-sm text-brand-text-secondary capitalize">{campaign.category.replace(/_/g, " ")}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Channel</p>
                    <div className="flex items-center gap-1">
                      {campaign.channel === 'email' ? <Mail className="w-3 h-3 text-brand-text-tertiary" /> : <MessageSquare className="w-3 h-3 text-brand-text-tertiary" />}
                      <p className="text-body-sm text-brand-text-secondary capitalize">{campaign.channel}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Segment</p>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-brand-text-tertiary" />
                      <p className="text-body-sm text-brand-text-secondary">{segDef?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Audience</p>
                    <p className="text-body-sm font-bold text-brand-primary">{segDef?.count || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant={campaign.status === "active" ? "ghost" : "primary"}
                    className={cn("flex-1 h-9 text-[12px] font-bold gap-1.5", campaign.status === "active" && "border border-brand-border/40")}
                    onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                    disabled={togglingId === campaign.id}
                  >
                    {togglingId === campaign.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : campaign.status === "active" ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {campaign.status === "active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : !showCreate ? (
        <div className="p-16 border rounded-xl border-dashed border-brand-border flex flex-col items-center justify-center gap-3 bg-brand-bg-secondary/30">
          <div className="w-14 h-14 rounded-full bg-brand-bg-primary border border-brand-border flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-brand-text-tertiary" />
          </div>
          <div className="text-center">
            <h3 className="text-body-lg font-bold text-brand-text-primary">No campaigns yet</h3>
            <p className="text-brand-text-tertiary text-body-sm max-w-sm mt-1">
              Create your first campaign to target a segment with automated revenue workflows.
            </p>
          </div>
          <Button className="gap-2 mt-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Create first campaign
          </Button>
        </div>
      ) : null}
    </div>
  );
}
