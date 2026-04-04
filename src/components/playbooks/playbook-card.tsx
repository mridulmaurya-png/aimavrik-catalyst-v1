"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlayCircle, PauseCircle, Settings2, Zap, ShoppingCart, UserPlus, RefreshCcw, Calendar, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { activatePlaybook, togglePlaybook } from "@/app/actions/playbooks";

interface PlaybookGridItemProps {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'paused';
  description: string;
  events: string;
  conversions: string;
  revenue: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'D2C': ShoppingCart,
  'Services': Calendar,
  'Retention': RefreshCcw,
  'Acquisition': UserPlus,
};

export function PlaybookGridItem({
  id,
  name,
  category,
  status: initialStatus,
  description,
  events,
  conversions,
  revenue
}: PlaybookGridItemProps) {
  const [status, setStatus] = React.useState(initialStatus);
  const [isToggling, setIsToggling] = React.useState(false);
  const Icon = CATEGORY_ICONS[category] || Zap;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (status === 'paused') {
        await activatePlaybook(id);
        setStatus('active');
      } else {
        await togglePlaybook(id, true);
        setStatus('paused');
      }
    } catch (err) {
      console.error("Failed to toggle playbook:", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card variant="elevated" className="p-6 flex flex-col justify-between group h-full hover:border-brand-primary/40 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-text-secondary" />
          </div>
          <Badge variant={status === 'active' ? 'success' : 'neutral'}>
            {status}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h4 className="text-heading-4 font-bold tracking-tight group-hover:text-brand-primary transition-colors">
              {name}
            </h4>
            <Badge variant="neutral" className="text-[10px] bg-white/[0.03] px-1.5 py-0 italic border-none uppercase tracking-tighter">
              {category}
            </Badge>
          </div>
          <p className="text-body-sm text-brand-text-secondary leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-3 gap-4 border-t border-brand-border/50 pt-4">
          <div>
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Events</p>
            <p className="text-body-md font-bold">{events}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Conv.</p>
            <p className="text-body-md font-bold">{conversions}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Revenue</p>
            <p className="text-body-md font-bold text-brand-highlight">{revenue}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link href={`/playbooks/${id}`} className="flex-1">
            <Button variant="secondary" className="w-full h-10 text-body-sm font-semibold gap-2 border-brand-border/40">
              <Settings2 className="w-3.5 h-3.5" />
              Configure
            </Button>
          </Link>
          <Button
            variant={status === 'active' ? "ghost" : "primary"}
            className={`h-10 px-4 gap-2 text-body-sm font-semibold ${
              status === 'active' 
                ? 'border border-brand-border/40 hover:bg-white/[0.03]' 
                : ''
            }`}
            onClick={handleToggle}
            disabled={isToggling}
          >
            {isToggling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : status === 'active' ? (
              <PauseCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {isToggling ? "..." : status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
