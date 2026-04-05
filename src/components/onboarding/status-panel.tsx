"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Search, 
  Settings, 
  Activity, 
  ShieldAlert,
  Clock,
  ArrowRight
} from "lucide-react";

interface StatusPanelProps {
  businessStatus: string;
}

export function OnboardingStatusPanel({ businessStatus }: StatusPanelProps) {
  const steps = [
    { id: 'signup_received', label: 'Signup Received', icon: ClipboardCheck, desc: 'Setup your workspace' },
    { id: 'onboarding_submitted', label: 'Requirements', icon: Search, desc: 'Client info submitted' },
    { id: 'under_review', label: 'Managed Review', icon: Settings, desc: 'Ops is validating setup' },
    { id: 'setup_in_progress', label: 'System Setup', icon: Activity, desc: 'Configuring AI engines' },
    { id: 'active', label: 'Active', icon: Activity, desc: 'Live Orchestration' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === businessStatus);
  const displayIndex = currentStepIndex === -1 ? (businessStatus === 'active' ? 4 : 0) : currentStepIndex;

  return (
    <Card variant="elevated" className="overflow-hidden bg-brand-bg-secondary border-brand-border/40 shadow-glow animate-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Main Status Display */}
        <div className="flex-1 p-8 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                <Activity className="w-5 h-5 text-brand-primary" />
             </div>
             <div className="space-y-1">
                <h3 className="text-body-lg font-bold text-brand-text-primary">System Lifecycle Status</h3>
                <div className="flex items-center gap-2">
                   <Badge variant={businessStatus === 'active' ? 'success' : 'neutral'} className="text-[9px] h-4 leading-none uppercase font-bold tracking-widest px-1.5 rounded-full">
                     {businessStatus.replace('_', ' ')}
                   </Badge>
                   <span className="text-[11px] text-brand-text-tertiary">·</span>
                   <span className="text-[11px] text-brand-text-tertiary font-medium">Managed AI Orchestration</span>
                </div>
             </div>
          </div>

          <p className="text-body-sm text-brand-text-secondary max-w-sm leading-relaxed">
            {businessStatus === 'signup_received' && "Welcome. Please complete your requirements form to begin the managed activation process."}
            {businessStatus === 'onboarding_submitted' && "We've received your requirements. AiMavrik Ops is now reviewing your lead sources."}
            {businessStatus === 'under_review' && "Your workspace is currently under expert review to ensure orchestration fidelity."}
            {businessStatus === 'setup_in_progress' && "Your AI engines are being configured by our team. You will be notified once active."}
            {businessStatus === 'active' && "Your architecture is validated and active. All orchestration routes are live."}
            {businessStatus === 'restricted' && "Workspace restricted. Please contact AiMavrik Ops for details."}
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="bg-brand-bg-primary/50 border-l border-brand-border/30 p-8 min-w-[320px]">
           <div className="space-y-6">
              {steps.map((s, idx) => {
                const isComplete = idx < displayIndex || (businessStatus === 'active' && idx <= 4);
                const isActive = idx === displayIndex && businessStatus !== 'active';
                const Icon = s.icon;
                
                return (
                  <div key={s.id} className={`flex items-start gap-4 transition-all ${idx > displayIndex && businessStatus !== 'active' ? 'opacity-30' : ''}`}>
                    <div className="relative pt-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isComplete ? 'bg-brand-primary border-brand-primary text-white shadow-glow' : (isActive ? 'border-brand-primary text-brand-primary' : 'border-brand-border')}`}>
                            {isComplete ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        {idx !== steps.length - 1 && (
                            <div className={`absolute left-3 top-7 w-[1px] h-6 bg-brand-border/40`} />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isComplete || isActive ? 'text-brand-text-primary' : 'text-brand-text-tertiary'}`}>{s.label}</p>
                        <p className="text-[10px] text-brand-text-tertiary leading-none">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </Card>
  );
}

function Check({ className, strokeWidth }: { className?: string, strokeWidth?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}
