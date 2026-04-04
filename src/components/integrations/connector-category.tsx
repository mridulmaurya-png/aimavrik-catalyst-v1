import * as React from "react"
import { Card } from "@/components/ui/card"
import { 
  Zap, 
  ShoppingCart, 
  Hash, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Layout, 
  CreditCard, 
  Database,
  ArrowRight
} from "lucide-react"

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
              className="p-4 flex items-center justify-between group cursor-pointer hover:border-brand-primary/40 transition-all bg-brand-bg-secondary/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-bg-primary border border-brand-border flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-text-tertiary group-hover:text-brand-primary transition-colors" />
                </div>
                <span className="text-body-sm font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                  {connector.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-text-tertiary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Card>
          );
        })}
      </div>
    </div>
  )
}
