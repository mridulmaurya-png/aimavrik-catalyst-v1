"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Save, Power, RefreshCw, Zap, Mail, MessageSquare, Clock, Shield, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { togglePlaybook, updatePlaybookConfig } from "@/app/actions/playbooks";
import { cn } from "@/lib/utils";
import { PLAYBOOK_CATEGORIES, formatCurrency } from "@/lib/config/constants";

interface PlaybookStats {
  eventsProcessed: number;
  actionsCreated: number;
  messagesSent: number;
  repliesReceived: number;
  currencyCode: string;
}

export default function PlaybookDetailClient({ playbook, stats }: { playbook: any; stats: PlaybookStats }) {
  const [isActive, setIsActive] = React.useState(playbook.is_active);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);
  
  const config = playbook.config_json || {};
  const [localConfig, setLocalConfig] = React.useState(config);

  const category = PLAYBOOK_CATEGORIES.find(c => c.id === (config.category || "lead_conversion"));

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await togglePlaybook(playbook.id, isActive);
      setIsActive(!isActive);
    } catch (e) {
      console.error(e);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePlaybookConfig(playbook.id, localConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/playbooks" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Playbooks
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-heading-1 font-bold tracking-tight">{playbook.playbook_type}</h1>
            <Badge variant={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Paused'}</Badge>
          </div>
          <p className="text-brand-text-secondary text-body-sm max-w-xl">
            {config.description || "Configure this playbook's trigger rules, execution settings, and performance monitoring."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={handleToggle}
            disabled={isToggling}
            className={cn(
              "h-11 border transition-colors gap-2",
              isActive 
                ? "bg-functional-success/5 border-functional-success/20 text-functional-success" 
                : "bg-white/[0.02] border-brand-border text-brand-text-tertiary"
            )}
          >
            {isToggling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isActive ? "Active" : "Paused"}
          </Button>
          <Button className="h-11 px-6 gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Config Sections */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Overview */}
          <Card variant="elevated" className="p-6 space-y-6">
            <h3 className="text-heading-4 font-bold border-b border-brand-border/50 pb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Playbook Name</p>
                <p className="text-body-md font-bold">{playbook.playbook_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Category</p>
                <Badge variant="info" className="capitalize">{category?.name || config.category || "Uncategorized"}</Badge>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Description</p>
                <p className="text-body-sm text-brand-text-secondary">{config.description || "No description configured."}</p>
              </div>
            </div>
          </Card>

          {/* Section 2: Trigger Rules */}
          <Card variant="elevated" className="p-6 space-y-6">
            <h3 className="text-heading-4 font-bold border-b border-brand-border/50 pb-3">Trigger Rules</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Event Type</label>
                <Input 
                  className="h-11 bg-brand-bg-primary" 
                  value={localConfig.trigger_event || ""} 
                  onChange={e => setLocalConfig({...localConfig, trigger_event: e.target.value})}
                  placeholder="e.g. lead_submitted" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Stage Condition</label>
                <select 
                  className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary"
                  value={localConfig.trigger_stage || "any"}
                  onChange={e => setLocalConfig({...localConfig, trigger_stage: e.target.value})}
                >
                  <option value="any">Any Stage</option>
                  <option value="new">New</option>
                  <option value="engaged">Engaged</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Inactivity Window</label>
                <Input 
                  className="h-11 bg-brand-bg-primary" 
                  value={localConfig.inactivity_window || ""} 
                  onChange={e => setLocalConfig({...localConfig, inactivity_window: e.target.value})}
                  placeholder="e.g. 48h, 7d" 
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Execution Rules */}
          <Card variant="elevated" className="p-6 space-y-6">
            <h3 className="text-heading-4 font-bold border-b border-brand-border/50 pb-3">Execution Rules</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Channel</label>
                <select 
                  className="w-full h-11 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary"
                  value={localConfig.channel || "whatsapp"}
                  onChange={e => setLocalConfig({...localConfig, channel: e.target.value})}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Delay Before Action</label>
                <Input 
                  className="h-11 bg-brand-bg-primary" 
                  value={localConfig.delay || ""} 
                  onChange={e => setLocalConfig({...localConfig, delay: e.target.value})}
                  placeholder="e.g. 5m, 1h, 24h" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Max Attempts</label>
                <Input 
                  type="number"
                  className="h-11 bg-brand-bg-primary" 
                  value={localConfig.max_attempts ?? 3} 
                  onChange={e => setLocalConfig({...localConfig, max_attempts: parseInt(e.target.value) || 1})}
                  min={1}
                  max={10}
                />
              </div>
              <div className="space-y-4 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig.stop_on_reply ?? true}
                    onChange={e => setLocalConfig({...localConfig, stop_on_reply: e.target.checked})}
                    className="w-4 h-4 rounded border-brand-border bg-brand-bg-primary accent-brand-primary" 
                  />
                  <span className="text-body-sm text-brand-text-secondary">Stop on reply</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig.stop_on_manual ?? true}
                    onChange={e => setLocalConfig({...localConfig, stop_on_manual: e.target.checked})}
                    className="w-4 h-4 rounded border-brand-border bg-brand-bg-primary accent-brand-primary" 
                  />
                  <span className="text-body-sm text-brand-text-secondary">Stop on manual intervention</span>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Performance & Preview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Performance Snapshot */}
          <Card variant="elevated" className="p-6 space-y-4">
            <h3 className="text-heading-4 font-bold border-b border-brand-border/50 pb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Actions Created</p>
                <p className="text-heading-3 font-bold text-brand-primary">{stats.actionsCreated}</p>
              </div>
              <div className="p-4 rounded-lg border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Messages Sent</p>
                <p className="text-heading-3 font-bold">{stats.messagesSent}</p>
              </div>
              <div className="p-4 rounded-lg border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Events</p>
                <p className="text-heading-3 font-bold">{stats.eventsProcessed}</p>
              </div>
              <div className="p-4 rounded-lg border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Replies</p>
                <p className="text-heading-3 font-bold text-brand-highlight">{stats.repliesReceived}</p>
                <p className="text-[10px] text-brand-text-tertiary">Awaiting signals</p>
              </div>
            </div>
          </Card>

          {/* Execution Flow Preview */}
          <Card variant="elevated" className="p-6 space-y-4">
            <h3 className="text-heading-4 font-bold border-b border-brand-border/50 pb-3">Execution Flow</h3>
            <div className="space-y-4">
              <FlowStep icon={<Zap className="w-4 h-4 text-brand-primary" />} label="Trigger" detail={localConfig.trigger_event || "Event signal received"} />
              <FlowStep icon={<Clock className="w-4 h-4 text-brand-text-tertiary" />} label="Wait" detail={localConfig.delay || "Configured delay"} />
              <FlowStep icon={localConfig.channel === 'email' ? <Mail className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-green-400" />} label="Send" detail={`Via ${localConfig.channel || 'whatsapp'}`} />
              <FlowStep icon={<Shield className="w-4 h-4 text-functional-success" />} label="Monitor" detail={`Max ${localConfig.max_attempts || 3} attempts`} />
            </div>
          </Card>

          {/* Category Info */}
          <Card variant="elevated" className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-text-tertiary" />
              <span className="text-label-sm font-bold text-brand-text-secondary uppercase tracking-wider">Category</span>
            </div>
            <p className="text-body-md font-bold capitalize">{category?.name || "Uncategorized"}</p>
            <p className="text-body-sm text-brand-text-tertiary">{category?.description || "Custom playbook category."}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FlowStep({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg-secondary/50 border border-brand-border/30">
      <div className="w-8 h-8 rounded-full bg-brand-bg-primary border border-brand-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">{label}</p>
        <p className="text-body-sm text-brand-text-secondary truncate">{detail}</p>
      </div>
    </div>
  );
}
