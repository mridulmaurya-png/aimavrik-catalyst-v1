"use client";

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ShieldCheck, Zap, Info, ArrowRight } from "lucide-react"

export function WebhookSetupPanel({ businessId }: { businessId?: string }) {
  const [copied, setCopied] = React.useState(false)
  
  // Build real webhook URL from the app's own ingest endpoint
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
  const webhookUrl = `${baseUrl}/api/ingest/webhook`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card variant="elevated" className="p-8 space-y-8 bg-gradient-to-br from-brand-primary/5 to-transparent border-brand-primary/20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-brand-primary">
            <Zap className="w-5 h-5 fill-brand-primary/20" />
            <h4 className="text-heading-4 font-bold tracking-tight">Custom Webhook Ingestion</h4>
          </div>
          <p className="text-body-sm text-brand-text-secondary leading-relaxed">
            Connect any external system to AiMavrik Catalyst by sending event payloads to your unique endpoint.
          </p>
          
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-functional-success font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Incoming events are validated and deduplicated automatically.
            </div>
            <div className="flex items-center gap-2 text-[11px] text-brand-text-tertiary font-medium">
              <Info className="w-3.5 h-3.5" />
              All received raw payloads are visible in Event Logs for debugging.
            </div>
          </div>
        </div>
        
        <Badge variant="info" className="px-3 py-1 bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          Ready for Inbound
        </Badge>
      </div>

      <div className="space-y-4 pt-4 border-t border-brand-border/50">
        <div className="space-y-2">
          <label className="text-label-sm font-semibold text-brand-text-primary">Your Webhook URL</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-brand-bg-primary border border-brand-border rounded-lg px-4 h-11 flex items-center font-mono text-body-sm text-brand-text-secondary overflow-hidden overflow-ellipsis whitespace-nowrap">
              {webhookUrl}
            </div>
            <Button 
              variant="secondary" 
              className="h-11 px-4 gap-2 border-brand-border/50 shrink-0"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-4 h-4 text-functional-success" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {businessId && (
            <p className="text-[10px] text-brand-text-tertiary font-mono">
              Include header: <code className="bg-brand-bg-primary px-1.5 py-0.5 rounded border border-brand-border">x-business-id: {businessId}</code>
            </p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-semibold text-brand-text-primary">Sample JSON Payload</span>
            <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-widest">POST Request</span>
          </div>
          <div className="rounded-xl bg-brand-bg-primary border border-brand-border p-4 font-mono text-[12px] leading-relaxed text-brand-text-secondary overflow-x-auto">
            <pre>
{`{
  "business_id": "${businessId || 'your-business-id'}",
  "event_type": "new_lead",
  "email": "alex@example.com",
  "full_name": "Alex Rivera",
  "source": "webhook",
  "metadata": {
    "utm_source": "google",
    "landing_page": "/pricing"
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  )
}
