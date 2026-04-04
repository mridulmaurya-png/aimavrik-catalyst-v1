import * as React from "react"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AIBriefProps {
  summary: string
  intent: string
  nextAction: string
}

export function AIContactBrief({ summary, intent, nextAction }: AIBriefProps) {
  return (
    <Card variant="elevated" className="p-6 space-y-4 border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-transparent">
      <div className="flex items-center gap-2 text-brand-primary">
        <Sparkles className="w-4 h-4 fill-brand-primary/20" />
        <span className="text-label-sm font-bold uppercase tracking-wider">AI Contact Brief</span>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-body-sm text-brand-text-primary font-medium leading-relaxed">
            {summary}
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-white/[0.02] border border-brand-border/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-brand-text-tertiary uppercase font-bold">Predicted Intent</span>
            <span className="text-[10px] text-brand-primary font-bold">{intent}</span>
          </div>
          <p className="text-body-sm text-brand-text-secondary">
            {nextAction}
          </p>
        </div>

        <Button variant="ghost" className="w-full text-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary h-9 gap-2 group">
          Update brief
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  )
}
