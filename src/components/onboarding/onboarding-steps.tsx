import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  ShoppingCart, 
  MessageSquare, 
  Mail, 
  Layout, 
  Calendar, 
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"

/* --- Step 1: Workspace --- */
export function StepWorkspace({ onNext, isLoading }: { onNext: (data: any) => Promise<void> | void; isLoading?: boolean }) {
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("D2C / E-commerce")
  const [timezone, setTimezone] = React.useState("Asia/Kolkata")
  const [error, setError] = React.useState("")

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Business Name is required");
      return;
    }
    setError("");
    try {
      await onNext({ name: name.trim(), type, timezone });
    } catch (e: any) {
      setError(e.message || "We couldn't create your workspace. Please try again.");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Create your workspace</h1>
        <p className="text-brand-text-secondary text-body-md">Set up your business environment to start processing events.</p>
      </div>
      <Card variant="elevated" className="p-8 space-y-6">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-functional-error/10 border border-functional-error/20 text-functional-error text-body-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-label-sm font-bold text-brand-text-secondary">Business Name</label>
            <Input 
              placeholder="e.g. Acme Corp" 
              className="h-12 bg-brand-bg-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Business Type</label>
              <select 
                className="w-full h-12 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isLoading}
              >
                <option>D2C / E-commerce</option>
                <option>Service Business</option>
                <option>SaaS</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Timezone</label>
              <select 
                className="w-full h-12 bg-brand-bg-primary border border-brand-border rounded-lg px-4 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary disabled:opacity-50"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={isLoading}
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </div>
        <Button 
          className="w-full h-12 gap-2 text-body-md font-bold" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Continue"}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </Card>
    </div>
  )
}

/* --- Step 2: Use Case --- */
export function StepUseCase({ onNext }: { onNext: (source: string) => void }) {
  const cases = [
    { id: 'leads', name: 'Recover lost leads', icon: Zap, desc: 'Engage stale inquiries automatically' },
    { id: 'speed', name: 'Improve follow-up speed', icon: Clock, desc: 'Instant response via API' },
    { id: 'repeat', name: 'Increase repeat purchases', icon: ShoppingCart, desc: 'Win-back campaigns' },
    { id: 'ops', name: 'Reduce manual ops', icon: Layout, desc: 'Automate tracking and sorting' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Primary execution goal</h1>
        <p className="text-brand-text-secondary text-body-md">What's the main driver for automating your workflow?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((s) => (
          <Card 
            key={s.id} 
            className="p-6 cursor-pointer group hover:border-brand-primary/50 transition-all bg-brand-bg-secondary/30"
            onClick={() => onNext(s.name)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-bg-primary border border-brand-border flex items-center justify-center">
                <s.icon className="w-6 h-6 text-brand-text-tertiary group-hover:text-brand-primary transition-colors" />
              </div>
              <div className="space-y-0.5">
                <p className="text-body-md font-bold text-brand-text-primary">{s.name}</p>
                <p className="text-[11px] text-brand-text-tertiary font-medium">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* --- Step 3: Connections --- */
export function StepConnections({ onNext, isLoading }: { onNext: (data: {source: string, channel: string}) => void; isLoading?: boolean }) {
  const [source, setSource] = React.useState("")
  const [channel, setChannel] = React.useState("")
  const [webhookUrl] = React.useState("https://api.catalyst.com/w/x98f2")
  const [copied, setCopied] = React.useState(false)

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isReady = source && channel;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Connect endpoints</h1>
        <p className="text-brand-text-secondary text-body-md">Establish exactly how Catalyst receives data and takes action.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-body-lg font-bold">1. Select Source</h3>
            <p className="text-[11px] text-brand-text-tertiary">Where are events coming from?</p>
          </div>
          <div className="space-y-3">
            {[
              { id: 'webhook', name: 'Custom Webhook' },
              { id: 'shopify', name: 'Shopify' },
              { id: 'meta', name: 'Meta Lead Ads' }
            ].map(s => (
              <div 
                key={s.id}
                onClick={() => setSource(s.id)} 
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center",
                  source === s.id ? "bg-brand-primary/10 border-brand-primary" : "bg-brand-bg-primary border-brand-border hover:border-brand-primary/30"
                )}
              >
                <span className={cn("text-body-sm font-bold", source === s.id ? "text-brand-primary" : "text-brand-text-primary")}>{s.name}</span>
                {source === s.id && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
              </div>
            ))}
          </div>

          {source === 'webhook' && (
            <div className="pt-2 animate-in fade-in">
              <label className="text-[10px] uppercase font-bold text-brand-text-tertiary tracking-widest block mb-2">Endpoint URL</label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="bg-brand-bg-primary font-mono text-[11px]" />
                <Button variant="secondary" onClick={copyWebhook} className="px-3 shrink-0">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card variant="elevated" className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-body-lg font-bold">2. Select Channel</h3>
            <p className="text-[11px] text-brand-text-tertiary">How should Catalyst communicate?</p>
          </div>
          <div className="space-y-3">
            {[
              { id: 'email', name: 'Email (Configured via System Sender)' },
              { id: 'whatsapp', name: 'WhatsApp (Demo Mode)' }
            ].map(c => (
              <div 
                key={c.id}
                onClick={() => setChannel(c.id)} 
                className={cn(
                  "p-3 flex justify-between items-center rounded-lg border cursor-pointer transition-all",
                  channel === c.id ? "bg-brand-primary/10 border-brand-primary" : "bg-brand-bg-primary border-brand-border hover:border-brand-primary/30"
                )}
              >
                <span className={cn("text-body-sm font-bold", channel === c.id ? "text-brand-primary" : "text-brand-text-primary")}>{c.name}</span>
                {channel === c.id && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
              </div>
            ))}
          </div>
          {channel === 'whatsapp' && (
            <div className="pt-2 p-3 rounded bg-functional-warning/10 border border-functional-warning/20 animate-in fade-in">
              <p className="text-[11px] text-functional-warning font-medium">Running in Demo Mode. WhatsApp actions will be simulated securely without consuming Meta tokens.</p>
            </div>
          )}
          {channel === 'email' && (
            <div className="pt-2 p-3 rounded bg-brand-primary/5 border border-brand-primary/10 animate-in fade-in">
              <p className="text-[11px] text-brand-text-secondary font-medium">Emails will be dispatched via secure.catalyst.com domain until custom SMTP is attached.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          className="w-full md:w-auto h-12 px-8 text-body-md font-bold" 
          onClick={() => onNext({source, channel})}
          disabled={!isReady || isLoading}
        >
          {isLoading ? "Saving Configurations..." : "Confirm & Continue"}
        </Button>
      </div>
    </div>
  )
}

/* --- Step 4: Playbook --- */
export function StepPlaybook({ onNext, isLoading }: { onNext: (play: string) => void; isLoading?: boolean }) {
  const playbooks = [
    { id: 'lead', name: 'New Lead Instant Follow-up', desc: 'Engage new submissions immediately.', outcome: 'High Conversion' },
    { id: 'cart', name: 'Abandoned Inquiry Recovery', desc: 'Revive lost checkouts automatically.', outcome: 'Revenue Recovery' },
    { id: 'prop', name: 'Proposal / Invoice Nudge', desc: 'Secure payments 2 days post-send.', outcome: 'Faster Closing' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Activate your execution rules</h1>
        <p className="text-brand-text-secondary text-body-md">Choose the primary action loop you want running.</p>
      </div>
      <div className="space-y-4">
        {playbooks.map((p) => (
          <Card 
            key={p.id} 
            className="p-6 cursor-pointer group hover:border-brand-primary/40 transition-all bg-brand-bg-secondary/30 flex items-center justify-between"
            onClick={() => onNext(p.name)}
          >
            <div className="space-y-1 pr-4">
              <p className="text-body-md font-bold text-brand-text-primary">{p.name}</p>
              <p className="text-[12px] text-brand-text-secondary leading-tight">{p.desc}</p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-4">
              <Badge variant="info" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 text-[10px] py-0 px-2 opacity-0 md:opacity-100">
                {p.outcome}
              </Badge>
              <Button disabled={isLoading} variant="secondary" className="h-8 text-[11px] px-4 group-hover:bg-brand-primary group-hover:text-white transition-colors border border-brand-border">
                Select
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* --- Step 5: Success --- */
export function StepSuccess({ state }: { state: any }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-functional-success/10 border-2 border-functional-success/30 flex items-center justify-center relative">
          <Rocket className="w-10 h-10 text-functional-success animate-bounce" />
          <div className="absolute inset-0 rounded-full border-4 border-functional-success animate-ping opacity-20" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-heading-1 font-bold tracking-tight">Your infrastructure is live</h1>
          <p className="text-brand-text-secondary text-body-md">Catalyst has activated your components successfully.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <Database className="w-3.5 h-3.5" />
            Source Configured
          </div>
          <p className="text-body-sm font-bold text-brand-text-secondary truncate capitalize">{state.source || 'Ready'}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-functional-success shadow-[0_0_8px_#00E676]" />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Listening on Port</span>
          </div>
        </Card>
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            Channel Bound
          </div>
          <p className="text-body-sm font-bold text-brand-text-secondary truncate capitalize">{state.channel || 'Ready'}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-functional-success shadow-[0_0_8px_#00E676]" />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Ready to Dispatch</span>
          </div>
        </Card>
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            Playbook Active
          </div>
          <p className="text-body-sm font-bold text-brand-text-primary leading-tight line-clamp-2 pr-2">{state.playbook || 'Default Rules'}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Execution Engine: OK</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-3 mt-8">
        <Button className="w-full max-w-md h-14 gap-3 text-body-lg font-bold" onClick={() => window.location.href = '/dashboard'}>
          Enter Command Center
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
