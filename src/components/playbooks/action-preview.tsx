import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Zap, 
  MessageSquare, 
  Mail, 
  Clock, 
  UserPlus, 
  CheckCircle2,
  ChevronDown
} from "lucide-react"

interface ActionStep {
  id: string
  type: string
  delay: string
  preview: string
}

const STEP_ICONS: Record<string, any> = {
  'Trigger': Zap,
  'WhatsApp': MessageSquare,
  'Email': Mail,
  'Wait': Clock,
  'Finish': CheckCircle2,
  'Task': UserPlus
};

interface ActionSequencePreviewProps {
  steps: ActionStep[]
}

export function ActionSequencePreview({ steps }: ActionSequencePreviewProps) {
  return (
    <Card variant="elevated" className="p-8 space-y-8 bg-brand-bg-primary/30">
      <div className="flex items-center justify-between border-b border-brand-border/50 pb-6">
        <h4 className="text-heading-4 font-bold">Execution Sequence</h4>
        <Badge variant="info">Visual Preview</Badge>
      </div>

      <div className="space-y-0 relative">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.type] || Zap;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-6 pb-12 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-brand-border/50" />
              )}
              
              <div className={cn(
                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border border-brand-border bg-brand-bg-secondary shadow-card transition-colors",
                step.type === 'Trigger' ? "border-brand-primary/40 text-brand-primary" : "text-brand-text-tertiary"
              )}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 pt-1.5 space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-body-md font-bold text-brand-text-primary tracking-tight">
                    {step.type === 'Wait' ? `Wait ${step.delay}` : step.type}
                  </p>
                  {step.type !== 'Wait' && step.type !== 'Trigger' && (
                    <span className="text-[10px] text-brand-text-tertiary font-bold px-1.5 py-0.5 rounded border border-brand-border/50 uppercase tracking-tighter">
                      Action
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-brand-text-secondary leading-relaxed max-w-md">
                  {step.preview}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  )
}
