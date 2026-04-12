import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

interface Connector {
  id: string
  name: string
  icon: any
}

interface ConnectorCategoryProps {
  title: string
  connectors: Connector[]
}

export function ConnectorCategoryBlock({ title, connectors }: ConnectorCategoryProps) {
  return (
    <div className="space-y-4">
      <h5 className="text-[11px] font-bold text-brand-text-tertiary uppercase tracking-widest pl-1">
        {title}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {connectors.map((connector) => {
          const Icon = connector.icon;
          return (
            <Card 
              key={connector.id} 
              className="p-4 flex items-center justify-between transition-all bg-brand-bg-secondary/30 opacity-60 cursor-not-allowed"
              title={`${connector.name} — Use webhook via n8n for integration`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-bg-primary border border-brand-border flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-text-tertiary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-bold text-brand-text-secondary">
                    {connector.name}
                  </span>
                  <Badge variant="neutral" className="w-fit text-[9px] px-1.5 py-0 uppercase tracking-wider border-none bg-white/[0.04]">
                    Use Webhook
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
