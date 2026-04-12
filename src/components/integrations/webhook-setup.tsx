"use client";

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ShieldCheck, Zap, Info, ArrowRight } from "lucide-react"

export function WebhookSetupPanel({ businessId }: { businessId?: string }) {
  const [copied, setCopied] = React.useState(false)
  const [testTesting, setTestTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<'idle' | 'success' | 'error'>('idle')
  
  // Build real webhook URL from the app's own ingest endpoint
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
  const webhookUrl = `${baseUrl}/api/ingest/webhook`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendTestEvent = async () => {
    setTestTesting(true);
    setTestResult('idle');
    try {
      const res = await fetch(webhookUrl || '/api/events/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(businessId ? { 'x-business-id': businessId } : {}),
        },
        body: JSON.stringify({
          business_id: businessId || "workspace_id",
          event_type: "lead_created",
          data: {
            full_name: "Alex Rivera",
            email: "alex@example.com",
            phone: "+919999999999",
            source: "meta_ads",
            language: "en",
            region: "north_india",
            metadata: {
              utm_source: "google",
              landing_page: "/pricing"
            }
          }
        })
      });
      if (!res.ok) throw new Error("Failed");
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setTestTesting(false);
      setTimeout(() => setTestResult('idle'), 3000);
    }
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
            <div className="flex items-center gap-2 text-[11px] text-brand-text-tertiary font-medium">
              <Info className="w-3.5 h-3.5" />
              Language and region improve communication accuracy and campaign performance.
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
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-widest">POST Request</span>
              <Button variant="secondary" className="h-8 text-xs gap-2" onClick={sendTestEvent} disabled={testTesting}>
                {testTesting ? 'Sending...' : testResult === 'success' ? <Check className="w-3.5 h-3.5 text-functional-success" /> : testResult === 'error' ? 'Error' : <ArrowRight className="w-3.5 h-3.5" />}
                Send Test Event
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-brand-bg-primary border border-brand-border p-4 font-mono text-[12px] leading-relaxed text-brand-text-secondary overflow-x-auto">
            <pre>
{`{
  "business_id": "${businessId || 'workspace_id'}",
  "event_type": "lead_created",
  "data": {
    "full_name": "Alex Rivera",
    "email": "alex@example.com",
    "phone": "+919999999999",
    "source": "meta_ads",
    "language": "en",
    "region": "north_india",
    "metadata": {
      "utm_source": "google",
      "landing_page": "/pricing"
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  )
}
