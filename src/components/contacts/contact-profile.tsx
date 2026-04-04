import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Tag, 
  User, 
  ShieldCheck,
  PauseCircle,
  Zap,
  StickyNote
} from "lucide-react"

interface ContactProfileProps {
  contact: {
    name: string
    email: string
    phone: string
    source: string
    stage: string
    type: string
    revenue: string
    firstSeen: string
    lastActive: string
    tags: string[]
  }
}

export function ContactProfileCard({ contact }: ContactProfileProps) {
  return (
    <Card variant="elevated" className="p-6 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
          <User className="w-10 h-10 text-brand-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-heading-3 font-bold">{contact.name}</h3>
          <Badge variant="success" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
            {contact.stage}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-brand-border/50">
        <div className="flex items-center gap-3 text-body-sm">
          <Mail className="w-4 h-4 text-brand-text-tertiary" />
          <span className="text-brand-text-secondary">{contact.email}</span>
        </div>
        <div className="flex items-center gap-3 text-body-sm">
          <Phone className="w-4 h-4 text-brand-text-tertiary" />
          <span className="text-brand-text-secondary">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-body-sm">
          <Globe className="w-4 h-4 text-brand-text-tertiary" />
          <span className="text-brand-text-secondary">Source: {contact.source}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-brand-border/50">
        <div className="space-y-1">
          <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tight">Revenue</p>
          <p className="text-body-lg font-bold text-brand-highlight">{contact.revenue}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tight">Type</p>
          <p className="text-body-lg font-bold">{contact.type}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map(tag => (
            <Badge key={tag} variant="neutral" className="text-[10px] bg-white/[0.03] border-brand-border">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="space-y-2 text-[11px] text-brand-text-tertiary">
          <div className="flex justify-between">
            <span>First seen</span>
            <span>{contact.firstSeen}</span>
          </div>
          <div className="flex justify-between">
            <span>Last active</span>
            <span>{contact.lastActive}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 pt-4">
        <Button variant="secondary" className="w-full justify-start gap-3 h-10">
          <PauseCircle className="w-4 h-4" />
          Pause automation
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 bg-white/[0.02]">
          <ShieldCheck className="w-4 h-4" />
          Mark human-owned
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 bg-white/[0.02]">
          <StickyNote className="w-4 h-4" />
          Add note
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 bg-white/[0.02] text-brand-primary">
          <Zap className="w-4 h-4" />
          Trigger manual follow-up
        </Button>
      </div>
    </Card>
  )
}
