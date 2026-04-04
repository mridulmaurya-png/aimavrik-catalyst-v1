"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Save, Power, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionSequencePreview } from "@/components/playbooks/action-preview";
import { ConfigPanel } from "@/components/playbooks/config-panel";
import { togglePlaybook, updatePlaybookConfig } from "@/app/actions/playbooks";
import { cn } from "@/lib/utils";

const SEQUENCE_STEPS = [
  { id: '1', type: 'Trigger', delay: 'Instant', preview: 'Event signal received matching playbook criteria.' },
  { id: '2', type: 'Wait', delay: 'Configured', preview: 'System waits for organic conversion before acting.' },
  { id: '3', type: 'Action', delay: 'Instant', preview: 'Dispatch message via primary channel.' },
  { id: '6', type: 'Finish', delay: 'None', preview: 'Record execution and await conversion.' },
];

export default function PlaybookDetailClient({ playbook }: { playbook: any }) {
  const [isActive, setIsActive] = React.useState(playbook.is_active);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);
  
  // Local config state matching what ConfigPanel needs
  const [config, setConfig] = React.useState(playbook.config_json || {});

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await togglePlaybook(playbook.id, isActive);
      setIsActive(!isActive);
    } catch (e) {
      console.error(e);
      alert("Failed to toggle playbook status.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePlaybookConfig(playbook.id, config);
    } catch (e) {
      console.error(e);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/playbooks" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Playbooks
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-heading-1 font-bold tracking-tight">{playbook.playbook_type}</h1>
            <p className="text-brand-text-secondary text-body-sm">
              Adjust timing, channels, rules, and execution behavior.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={handleToggle}
            disabled={isToggling}
            className={cn(
              "h-11 border transition-colors gap-2 hover:bg-white/[0.05]",
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

      <div className="grid lg:grid-cols-5 gap-8">
        {/* LEFT COLUMN: Settings & Config */}
        <div className="lg:col-span-3">
          {/* We pass the local config and a setter so the panel can update it */}
          <ConfigPanel config={config} onChange={(updates: any) => setConfig({ ...config, ...updates })} />
        </div>

        {/* RIGHT COLUMN: Preview & Stats (Graceful Zero State) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Events Processed</p>
              <p className="text-heading-3 font-bold text-brand-primary">0</p>
              <p className="text-[11px] text-brand-text-tertiary">Awaiting signals</p>
            </div>
            <div className="p-5 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-1">
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-wider">Revenue Instigated</p>
              <p className="text-heading-3 font-bold text-brand-highlight">$0</p>
              <p className="text-[11px] text-brand-text-tertiary">0 conversions tracked</p>
            </div>
          </div>

          <ActionSequencePreview steps={SEQUENCE_STEPS} />

          <Button variant="ghost" className="w-full h-12 bg-white/[0.02] border border-brand-border gap-3 text-brand-text-secondary hover:text-brand-text-primary group">
            <BarChart3 className="w-4 h-4 cursor-not-allowed opacity-50" />
            Analytics Loading...
          </Button>
        </div>
      </div>
    </div>
  );
}
