import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface AnalyticsKpiProps {
  label: string
  value: string
  trend: string
  change: 'positive' | 'negative' | 'neutral'
  subtitle?: string
}

export function AnalyticsKpiCard({ 
  label, 
  value, 
  trend, 
  change,
  subtitle 
}: AnalyticsKpiProps) {
  return (
    <Card variant="elevated" className="p-6 space-y-3">
      <p className="text-[11px] text-brand-text-tertiary font-bold uppercase tracking-widest pl-0.5">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <h2 className="text-heading-2 font-bold tracking-tight text-brand-text-primary group-hover:text-brand-primary transition-colors">
          {value}
        </h2>
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full border",
          change === 'positive' ? "text-functional-success bg-functional-success/5 border-functional-success/20" :
          change === 'negative' ? "text-functional-error bg-functional-error/5 border-functional-error/20" :
          "text-brand-text-tertiary bg-white/[0.03] border-brand-border/50"
        )}>
          {change === 'positive' && <TrendingUp className="w-3 h-3" />}
          {change === 'negative' && <TrendingDown className="w-3 h-3" />}
          {change === 'neutral' && <Minus className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      {subtitle && (
        <p className="text-[11px] text-brand-text-tertiary font-medium">
          {subtitle}
        </p>
      )}
    </Card>
  )
}
