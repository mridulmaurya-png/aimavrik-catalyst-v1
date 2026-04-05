import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlayCircle, MessageCircle, Send, ShieldAlert, XCircle } from "lucide-react"

interface Playbook {
  name: string
  step: string
  nextAction: string
  status: 'active' | 'paused'
}

export function AssignedPlaybooks({ playbooks }: { playbooks: Playbook[] }) {
  return (
    <Card variant="elevated" className="p-6 space-y-6">
      <h4 className="text-heading-4 font-bold border-b border-brand-border/50 pb-4">Assigned Playbooks</h4>
      
      <div className="space-y-6">
        {playbooks.map(playbook => (
          <div key={playbook.name} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-body-sm font-bold text-brand-text-primary">{playbook.name}</p>
                <p className="text-[11px] text-brand-text-tertiary">Current: {playbook.step}</p>
              </div>
              <Badge variant={playbook.status === 'active' ? 'success' : 'neutral'}>
                {playbook.status}
              </Badge>
            </div>
            <p className="text-[11px] text-brand-text-secondary flex items-center gap-1.5">
              <span className="font-semibold text-brand-text-tertiary">Next item:</span>
              {playbook.nextAction}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function QuickActions() {
  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <h4 className="text-heading-4 font-bold">Quick Actions</h4>
      <div className="grid grid-cols-1 gap-2">
        <Button variant="secondary" disabled title="Direct WhatsApp sending — coming in V2" className="justify-start gap-3 h-10 border-brand-primary/20 hover:border-brand-primary/40 opacity-50 cursor-not-allowed">
          <MessageCircle className="w-4 h-4 text-brand-primary" />
          Send WhatsApp now
        </Button>
        <Button variant="ghost" disabled title="Direct Email sending — coming in V2" className="justify-start gap-3 h-10 bg-white/[0.02] opacity-50 cursor-not-allowed">
          <Send className="w-4 h-4" />
          Send Email now
        </Button>
        <Button variant="ghost" disabled title="Sales escalation — coming in V2" className="justify-start gap-3 h-10 bg-white/[0.02] text-functional-warning opacity-50 cursor-not-allowed">
          <ShieldAlert className="w-4 h-4" />
          Escalate to Sales
        </Button>
        <Button variant="ghost" disabled title="Manual automation pause — coming in V2" className="justify-start gap-3 h-10 bg-white/[0.02] text-functional-error opacity-50 cursor-not-allowed">
          <XCircle className="w-4 h-4" />
          Pause all automation
        </Button>
      </div>
    </Card>
  )
}
