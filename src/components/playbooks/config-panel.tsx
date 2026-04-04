import * as React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Zap, Clock, MessageCircle, BarChart3, Mail } from "lucide-react"

export function ConfigPanel({ config, onChange }: { config: any, onChange: (u: any) => void }) {
  return (
    <div className="space-y-8">
      <Card variant="elevated" className="p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-heading-4 font-bold">Execution Timing</h4>
            <Clock className="w-5 h-5 text-brand-text-tertiary" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-label-sm font-semibold text-brand-text-primary">Engagement Wait Time</label>
              <Input 
                value={config.delay || ''} 
                onChange={e => onChange({ delay: e.target.value })}
                placeholder="e.g. 5 minutes" 
                className="bg-brand-bg-secondary h-11" 
              />
              <p className="text-[11px] text-brand-text-tertiary">Delay before the first automated touchpoint.</p>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-semibold text-brand-text-primary">Max Follow-up Count</label>
              <Input 
                value={config.max_followups || '3'} 
                onChange={e => onChange({ max_followups: e.target.value })}
                placeholder="e.g. 3" 
                type="number" 
                className="bg-brand-bg-secondary h-11" 
              />
              <p className="text-[11px] text-brand-text-tertiary">Total number of automated attempts.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-brand-border/50">
          <div className="flex items-center justify-between">
            <h4 className="text-heading-4 font-bold">Channel & Content</h4>
            <MessageCircle className="w-5 h-5 text-brand-text-tertiary" />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-label-sm font-semibold text-brand-text-primary">Primary Channel</label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={config.channel === 'whatsapp' || !config.channel ? "secondary" : "ghost"}
                  onClick={() => onChange({ channel: 'whatsapp' })}
                  className={cn("justify-center h-11 gap-3", config.channel === 'whatsapp' || !config.channel ? "bg-brand-primary/5 text-brand-primary border-brand-primary/30" : "bg-white/[0.02] border-brand-border")}
                >
                  <Zap className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button 
                  variant={config.channel === 'email' ? "secondary" : "ghost"}
                  onClick={() => onChange({ channel: 'email' })}
                  className={cn("justify-center h-11 gap-3", config.channel === 'email' ? "bg-brand-primary/5 text-brand-primary border-brand-primary/30" : "bg-white/[0.02] border-brand-border")}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label-sm font-semibold text-brand-text-primary">CTA Link / Offer Override</label>
              <Input 
                value={config.cta_link || ''}
                onChange={e => onChange({ cta_link: e.target.value })}
                placeholder="https://yourstore.com/checkout?id=..." 
                className="bg-brand-bg-secondary h-11" 
              />
              <p className="text-[11px] text-brand-text-tertiary">The primary destination for this playbook.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-brand-border/50">
          <div className="flex items-center justify-between">
            <h4 className="text-heading-4 font-bold">Safety & Escalation</h4>
            <ShieldCheck className="w-5 h-5 text-brand-text-tertiary" />
          </div>

          <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-between cursor-pointer" onClick={() => onChange({ escalate: !config.escalate })}>
            <div className="space-y-1">
              <p className="text-body-sm font-bold text-brand-text-primary">Escalate to Sales Team</p>
              <p className="text-[11px] text-brand-text-tertiary">Notify owner if contact replies but doesn't convert.</p>
            </div>
            <div className={cn("w-12 h-6 rounded-full relative flex items-center px-1 transition-colors", config.escalate ? "bg-brand-primary" : "bg-brand-bg-secondary border border-brand-border")}>
              <div className={cn("w-4 h-4 rounded-full absolute transition-transform", config.escalate ? "bg-white right-1" : "bg-brand-text-tertiary left-1")} />
            </div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-heading-4 font-bold">Brand Voice Override</h4>
          <BarChart3 className="w-5 h-5 text-brand-text-tertiary" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-label-sm font-semibold text-brand-text-primary">System Notes</label>
            <textarea
              value={config.system_notes || ''}
              onChange={e => onChange({ system_notes: e.target.value })}
              className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg p-3 text-body-sm min-h-[100px] focus:outline-none focus:border-brand-primary/50 transition-colors"
              placeholder="e.g. Always refer to the user as 'Founder' instead of their first name."
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
