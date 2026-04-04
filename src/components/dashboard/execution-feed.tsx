import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  UserPlus, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Mail,
  CalendarCheck
} from "lucide-react"

interface FeedItem {
  id: string
  type: string
  contact: string
  summary: string
  time: string
  status: 'queued' | 'sent' | 'failed' | 'completed' | 'active'
}

const EVENT_ICONS: Record<string, any> = {
  'Lead received': UserPlus,
  'Message sent': MessageSquare,
  'Booking completed': CalendarCheck,
  'Proposal follow-up triggered': Zap,
  'Cart recovered': CheckCircle2,
  'Email sent': Mail,
};

interface ExecutionFeedProps {
  items: FeedItem[]
}

export function ExecutionFeed({ items }: ExecutionFeedProps) {
  return (
    <Card variant="elevated" className="p-0 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-brand-border/50">
        <h4 className="text-heading-4 font-bold">Live execution feed</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {items.map((item, index) => {
          const Icon = EVENT_ICONS[item.type] || Zap;
          return (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline line */}
              {index !== items.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-[1px] bg-brand-border/50" />
              )}
              
              <div className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center border border-brand-border bg-brand-bg-secondary",
                item.status === 'failed' && "border-functional-error/30 text-functional-error",
                item.status === 'completed' && "border-functional-success/30 text-functional-success"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-body-sm font-semibold truncate">{item.type}</p>
                  <span className="text-[10px] text-brand-text-tertiary whitespace-nowrap">{item.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-brand-text-primary font-medium">{item.contact}</span>
                  <span className="text-brand-text-tertiary">·</span>
                  <span className="text-body-sm text-brand-text-secondary truncate">{item.summary}</span>
                </div>
                <div className="mt-1">
                  <Badge variant={
                    item.status === 'completed' ? 'success' :
                    item.status === 'failed' ? 'error' :
                    item.status === 'queued' ? 'info' : 'neutral'
                  } className="px-1.5 py-0 text-[10px]">
                    {item.status}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  )
}
