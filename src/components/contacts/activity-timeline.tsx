import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  Zap, 
  Clock,
  PhoneCall,
  Edit3,
  MousePointer2
} from "lucide-react"

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  icon: string
  metadata?: string
  status?: string
}

const ICONS: Record<string, any> = {
  'lead': PlusCircle,
  'whatsapp': MessageSquare,
  'email': Mail,
  'conversion': CheckCircle2,
  'ai': Zap,
  'call': PhoneCall,
  'note': Edit3,
  'click': MousePointer2,
};

interface ActivityTimelineProps {
  events: TimelineEvent[]
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card variant="elevated" className="p-0 flex flex-col h-full bg-brand-bg-primary/30">
      <div className="p-6 border-b border-brand-border/50 bg-brand-bg-secondary/50">
        <h4 className="text-heading-4 font-bold">Activity Timeline</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {events.map((event, index) => {
          const Icon = ICONS[event.icon] || Clock;
          return (
            <div key={event.id} className="relative flex gap-6">
              {/* Timeline line */}
              {index !== events.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-32px] w-[1px] bg-brand-border/50" />
              )}
              
              <div className={cn(
                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border border-brand-border bg-brand-bg-secondary shadow-card",
                event.icon === 'conversion' && "border-functional-success/30 text-functional-success",
                event.icon === 'ai' && "border-brand-primary/30 text-brand-primary",
                event.status === 'failed' && "border-functional-error/30 text-functional-error"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-body-md font-bold text-brand-text-primary tracking-tight">
                    {event.type}
                  </p>
                  <span className="text-[11px] text-brand-text-tertiary whitespace-nowrap font-medium">
                    {event.timestamp}
                  </span>
                </div>
                
                <p className="text-body-sm text-brand-text-secondary leading-relaxed">
                  {event.description}
                </p>

                {event.metadata && (
                  <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-brand-border/50">
                    <p className="text-[11px] text-brand-text-tertiary font-mono italic">
                      {event.metadata}
                    </p>
                  </div>
                )}

                {event.status && (
                  <div className="mt-2">
                    <Badge variant={
                      event.status === 'success' || event.status === 'delivered' ? 'success' :
                      event.status === 'failed' ? 'error' : 'neutral'
                    } className="text-[10px] px-1.5 py-0">
                      {event.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  )
}
