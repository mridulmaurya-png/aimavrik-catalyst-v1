import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  RefreshCw, 
  Settings2, 
  Unlink, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Clock,
  Zap,
  ShoppingCart,
  Mail,
  MessageSquare
} from "lucide-react"

interface IntegrationCardProps {
  provider: string
  status: 'connected' | 'error' | 'disconnected'
  lastSync: string
  eventCount: string
}

const PROVIDER_ICONS: Record<string, any> = {
  'Webhook': Zap,
  'Shopify': ShoppingCart,
  'HubSpot': Hash,
  'WhatsApp': MessageSquare,
  'Email': Mail,
};

export function IntegrationCard({
  provider,
  status,
  lastSync,
  eventCount
}: IntegrationCardProps) {
  const Icon = PROVIDER_ICONS[provider] || Hash;

  return (
    <Card variant="elevated" className="p-6 space-y-6 group hover:border-brand-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
            <Icon className="w-6 h-6 text-brand-text-secondary group-hover:text-brand-primary transition-colors" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-body-lg font-bold text-brand-text-primary">{provider}</h4>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-functional-success' : 
                status === 'error' ? 'bg-functional-error' : 'bg-brand-text-tertiary'
              }`} />
              <span className="text-[11px] text-brand-text-tertiary font-medium capitalize">{status}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" className="w-8 h-8 p-0 bg-white/[0.03] border border-brand-border/40">
            <Settings2 className="w-3.5 h-3.5 text-brand-text-tertiary" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-brand-border/30 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-tighter">
            <RefreshCw className="w-3 h-3" />
            Last Sync
          </div>
          <p className="text-body-sm font-medium text-brand-text-secondary">{lastSync}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-tighter">
            <CheckCircle2 className="w-3 h-3" />
            Events
          </div>
          <p className="text-body-sm font-bold text-brand-highlight">{eventCount}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" disabled title="Test event available in production" className="flex-1 h-9 bg-white/[0.02] border border-brand-border/40 text-[12px] font-bold opacity-50 cursor-not-allowed">
          Test
        </Button>
        <Button variant="ghost" disabled title="Disconnect available in production" className="flex-1 h-9 bg-white/[0.02] border border-brand-border/40 text-[12px] font-bold text-brand-text-tertiary opacity-50 cursor-not-allowed">
          Disconnect
        </Button>
      </div>
    </Card>
  )
}
