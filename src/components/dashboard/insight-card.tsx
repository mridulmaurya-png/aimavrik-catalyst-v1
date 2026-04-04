import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ArrowRight } from "lucide-react"

interface InsightCardProps {
  text: string
  action: string
  cta: string
}

export function InsightCard({ text, action, cta }: InsightCardProps) {
  return (
    <Card variant="elevated" className="p-6 transition-all hover:border-brand-primary/50 group bg-gradient-to-br from-brand-bg-elevated/80 to-brand-bg-primary/40">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-body-sm text-brand-text-primary leading-relaxed font-medium">
              {text}
            </p>
            <p className="text-[11px] text-brand-text-tertiary">
              {action}
            </p>
          </div>
          <Button variant="ghost" className="h-8 px-0 text-brand-primary hover:bg-transparent hover:text-brand-primary/80 group mt-2">
            <span className="text-body-sm font-semibold">{cta}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
