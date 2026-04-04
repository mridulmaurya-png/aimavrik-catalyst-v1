import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface HealthMetric {
  label: string
  value: string
  status: 'healthy' | 'warning' | 'failed'
}

interface ExecutionHealthProps {
  metrics: HealthMetric[]
}

export function ExecutionHealth({ metrics }: ExecutionHealthProps) {
  return (
    <Card variant="elevated" className="p-6 flex flex-col h-full">
      <h4 className="text-heading-4 font-bold mb-6">Execution health</h4>
      
      <div className="space-y-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-body-sm text-brand-text-secondary">{metric.label}</p>
              <p className="text-body-lg font-bold">{metric.value}</p>
            </div>
            <Badge variant={
              metric.status === 'healthy' ? 'success' :
              metric.status === 'warning' ? 'warning' : 'error'
            }>
              {metric.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
