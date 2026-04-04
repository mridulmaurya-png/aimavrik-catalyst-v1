import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  X, 
  Info, 
  ShieldCheck, 
  FileJson, 
  Database,
  ArrowRight,
  RotateCcw,
  Zap,
  User,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EventDrawerProps {
  isOpen: boolean
  onClose: () => void
  event: any | null
}

export function EventDetailDrawer({ isOpen, onClose, event }: EventDrawerProps) {
  if (!event) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-brand-bg-primary/80 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-xl bg-brand-bg-secondary border-l border-brand-border z-[60] shadow-xl transition-transform duration-300 transform p-0 overflow-y-auto no-scrollbar",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-brand-bg-secondary/90 backdrop-blur-md border-b border-brand-border/50 p-6 flex items-center justify-between z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-heading-4 font-bold tracking-tight">Event Detail</h2>
              <Badge variant="neutral" className="bg-white/[0.05] border-brand-border/40 font-mono text-[10px]">
                {event.id}
              </Badge>
            </div>
            <p className="text-body-sm text-brand-text-tertiary">Received {event.receivedAt}</p>
          </div>
          <Button variant="ghost" className="w-10 h-10 p-0 rounded-full hover:bg-white/[0.05]" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8 space-y-10">
          {/* Section 1: Event Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
              <Info className="w-3.5 h-3.5" />
              Event Summary
            </div>
            <div className="p-5 rounded-xl border border-brand-border bg-brand-bg-primary space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-body-md font-bold text-brand-text-primary capitalize">{event.type.replace('_', ' ')}</p>
                  <p className="text-[11px] text-brand-text-tertiary">System received this event from {event.source}.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03]">
                <User className="w-4 h-4 text-brand-text-tertiary" />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-body-sm font-medium text-brand-text-secondary">{event.contact}</span>
                  <Button variant="ghost" className="h-7 text-brand-primary text-[10px] font-bold p-0 px-2 gap-1 group">
                    View Contact
                    <ExternalLink className="w-3 h-3 transition-transform group-hover:scale-110" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Processing Result */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Processing Result
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-white/[0.01]">
                <div className="space-y-0.5">
                  <p className="text-body-sm font-bold text-brand-text-primary">Playbook Matching</p>
                  <p className="text-[11px] text-brand-text-tertiary">System matched this event to a revenue system.</p>
                </div>
                <Badge variant="success" className="px-3">Matched</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-white/[0.01]">
                <div className="space-y-0.5">
                  <p className="text-body-sm font-bold text-brand-text-primary">Execution Status</p>
                  <p className="text-[11px] text-brand-text-tertiary">All automated steps triggered successfully.</p>
                </div>
                <Badge variant="info" className="px-3">Executed</Badge>
              </div>
            </div>
          </div>

          {/* Section 3: Normalized Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
              <Database className="w-3.5 h-3.5" />
              Extracted Fields
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary font-bold uppercase">Email</p>
                <p className="text-body-sm font-medium text-brand-text-secondary truncate">{event.contact}</p>
              </div>
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary font-bold uppercase">Customer Stage</p>
                <p className="text-body-sm font-medium text-brand-text-secondary">Returning Customer</p>
              </div>
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary font-bold uppercase">Internal Score</p>
                <p className="text-body-sm font-bold text-brand-highlight">84/100</p>
              </div>
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-secondary/50 space-y-1">
                <p className="text-[10px] text-brand-text-tertiary font-bold uppercase">Rule Priority</p>
                <Badge variant="neutral" className="text-[10px] px-1.5 py-0">High</Badge>
              </div>
            </div>
          </div>

          {/* Section 4: Raw Payload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
              <FileJson className="w-3.5 h-3.5" />
              Raw Message Payload
            </div>
            <div className="rounded-xl bg-brand-bg-primary border border-brand-border p-5 font-mono text-[12px] leading-relaxed text-brand-text-tertiary/80 overflow-x-auto">
              <pre>
{`{
  "event_id": "${event.id}",
  "source": "${event.source}",
  "type": "${event.type}",
  "timestamp": "2026-03-26T12:04:11Z",
  "data": {
    "email": "${event.contact}",
    "currency": "USD",
    "total": 1240.00,
    "items": 4,
    "ip": "45.12.8.192"
  }
}`}
              </pre>
            </div>
          </div>

          {/* Section 5: Retry Action */}
          <div className="pt-6 border-t border-brand-border/50 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-functional-warning/5 border border-functional-warning/20 flex gap-4">
              <Info className="w-5 h-5 text-functional-warning shrink-0" />
              <p className="text-[12px] text-brand-text-secondary leading-tight">
                Retrying an event will re-process the entire rule logic and may trigger duplicate downstream actions if not already handled by the recipient system.
              </p>
            </div>
            <Button variant="secondary" className="w-full h-12 gap-3 font-bold border-brand-border/50">
              <RotateCcw className="w-4 h-4" />
              Force Retry Event Logic
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
