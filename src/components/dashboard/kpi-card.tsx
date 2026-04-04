import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: string
  trend?: string
  trendType?: 'positive' | 'negative' | 'neutral'
  context?: string
  isPrioritized?: boolean
}

export function KPICard({ 
  label, 
  value, 
  trend, 
  trendType = 'neutral', 
  context,
  isPrioritized = false 
}: KPICardProps) {
  return (
    <Card 
      variant="elevated" 
      className={cn(
        "p-5 flex flex-col justify-between transition-all duration-300",
        isPrioritized && "border-brand-primary/30 bg-brand-bg-elevated/60 shadow-glow"
      )}
    >
      <div className="space-y-1">
        <p className="text-label-sm text-brand-text-tertiary uppercase tracking-wider font-semibold">
          {label}
        </p>
        <h2 className={cn(
          "text-display-l font-bold tracking-tight",
          isPrioritized ? "text-brand-text-primary" : "text-brand-text-secondary"
        )}>
          {value}
        </h2>
      </div>
      
      {(trend || context) && (
        <div className="mt-4 flex flex-col">
          {trend && (
            <p className={cn(
              "text-body-sm font-medium",
              trendType === 'positive' && "text-functional-success",
              trendType === 'negative' && "text-functional-error",
              trendType === 'neutral' && "text-brand-text-secondary"
            )}>
              {trend}
            </p>
          )}
          {context && (
            <p className="text-[10px] text-brand-text-tertiary mt-0.5">
              {context}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
