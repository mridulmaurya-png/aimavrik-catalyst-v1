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

/* --- Step 2: Source --- */
export function StepSource({ onNext }: { onNext: (source: string) => void }) {
  const sources = [
    { id: 'webhook', name: 'Webhook', icon: Zap, desc: 'Any custom system' },
    { id: 'shopify', name: 'Shopify', icon: ShoppingCart, desc: 'E-commerce events' },
    { id: 'meta', name: 'Meta Lead Ads', icon: Layout, desc: 'Social lead capture' },
    { id: 'calendly', name: 'Calendly', icon: Calendar, desc: 'Appointment booking' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Connect your first source</h1>
        <p className="text-brand-text-secondary text-body-md">Catalyst needs one data source to start receiving events.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s) => (
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
      <div className="flex justify-center">
        <button className="text-[12px] text-brand-text-tertiary font-medium hover:text-brand-text-secondary transition-colors underline underline-offset-4">
          I'll connect this later in settings
        </button>
      </div>
    </div>
  )
}

/* --- Step 2.5: Test Event --- */
export function StepTestEvent({ source, onNext }: { source: string, onNext: () => void }) {
  const [testing, setTesting] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'linking' | 'success'>('idle')

  const triggerTest = () => {
    setTesting(true)
    setStatus('linking')
    setTimeout(() => {
      setStatus('success')
      setTesting(false)
    }, 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Send a test event</h1>
        <p className="text-brand-text-secondary text-body-md">Trigger a sample event to verify your {source} connection.</p>
      </div>
      <Card variant="elevated" className="p-10 space-y-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-bg-primary border border-brand-border flex items-center justify-center relative">
          <Zap className={cn("w-10 h-10 transition-colors", status === 'success' ? "text-brand-highlight" : "text-brand-text-tertiary")} />
          {status === 'success' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-functional-success rounded-full flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-primary flex flex-col items-center gap-3">
            <p className="text-[12px] font-bold text-brand-text-tertiary uppercase tracking-widest">System Status</p>
            <div className="flex items-center gap-3">
              <span className={cn("text-body-sm font-medium", status === 'success' ? "text-brand-text-primary" : "text-brand-text-tertiary")}>
                {status === 'idle' ? "Waiting for signal..." : 
                 status === 'linking' ? "Processing incoming payload..." : 
                 "Event 'checkout_completed' received"}
              </span>
              {status === 'linking' && <RefreshCw className="w-3 h-3 text-brand-primary animate-spin" />}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button 
            className="w-full h-12 gap-2 text-body-md font-bold" 
            disabled={testing}
            onClick={status === 'success' ? onNext : triggerTest}
          >
            {status === 'success' ? "Setup Verified" : testing ? "Sending..." : "Send Test Event"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          {status !== 'success' && (
            <Button variant="ghost" className="h-10 text-[12px] font-medium text-brand-text-tertiary" onClick={onNext}>
              Skip verification
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

/* --- Step 3: Channel --- */
export function StepChannel({ onNext }: { onNext: (chan: string) => void }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Connect communication</h1>
        <p className="text-brand-text-secondary text-body-md">Catalyst uses WhatsApp or email to execute actions.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'wa', name: 'WhatsApp', icon: MessageSquare, desc: 'Fast, high-reply rate' },
          { id: 'mail', name: 'Email', icon: Mail, desc: 'Official & transaction ready' },
        ].map((c) => (
          <Card 
            key={c.id} 
            className="p-6 cursor-pointer group hover:border-brand-primary/50 transition-all bg-brand-bg-secondary/30"
            onClick={() => onNext(c.name)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-bg-primary border border-brand-border flex items-center justify-center">
                <c.icon className="w-6 h-6 text-brand-text-tertiary group-hover:text-brand-primary transition-colors" />
              </div>
              <div className="space-y-0.5">
                <p className="text-body-md font-bold text-brand-text-primary">{c.name}</p>
                <p className="text-[11px] text-brand-text-tertiary font-medium">{c.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-center flex-col items-center gap-4">
        <p className="text-[11px] text-brand-text-tertiary font-medium">You can connect multiple channels later.</p>
        <button className="text-[12px] text-brand-text-tertiary font-medium hover:text-brand-text-secondary transition-colors underline underline-offset-4" onClick={() => onNext('Skip')}>
          I'll connect these later
        </button>
      </div>
    </div>
  )
}

/* --- Step 4: Playbook --- */
export function StepPlaybook({ onNext }: { onNext: (play: string) => void; isLoading?: boolean }) {
  const playbooks = [
    { id: 'lead', name: 'New Lead Instant Follow-up', desc: 'Trigger WhatsApp instantly on form submission.', outcome: '30% higher conversion' },
    { id: 'cart', name: 'Abandoned Cart Recovery', desc: 'Revive lost checkouts with personalized offers.', outcome: '12% revenue recovery' },
    { id: 'prop', name: 'Proposal Follow-up', desc: 'Automatically nudge clients 2 days after proposal.', outcome: '40% faster closing' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-heading-1 font-bold tracking-tight">Activate your first playbook</h1>
        <p className="text-brand-text-secondary text-body-md">Choose a system to start automating conversion.</p>
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
            <div className="text-right shrink-0">
              <Badge variant="info" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 text-[10px] py-0 px-2">
                {p.outcome}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* --- Step 5: Success --- */
export function StepSuccess({ state }: { state: any; onFinish?: () => void }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-functional-success/10 border-2 border-functional-success/30 flex items-center justify-center relative">
          <Rocket className="w-10 h-10 text-functional-success animate-bounce" />
          <div className="absolute inset-0 rounded-full border-4 border-functional-success animate-ping opacity-20" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-heading-1 font-bold tracking-tight">Your system is live</h1>
          <p className="text-brand-text-secondary text-body-md">Catalyst is now tracking activity and executing actions.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <Database className="w-3.5 h-3.5" />
            Source
          </div>
          <p className="text-body-sm font-bold text-brand-text-secondary truncate">{state.source || 'Connected'}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-functional-success" />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Valid Signals: 1</span>
          </div>
        </Card>
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            Channel
          </div>
          <p className="text-body-sm font-bold text-brand-text-secondary truncate">{state.channel || 'Not Connected'}</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", state.channel === 'Skip' ? "bg-brand-text-tertiary" : "bg-functional-success")} />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Status: {state.channel === 'Skip' ? 'Delayed' : 'Active'}</span>
          </div>
        </Card>
        <Card className="p-5 border-brand-border/40 bg-white/[0.01] space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            Playbook
          </div>
          <p className="text-body-sm font-bold text-brand-text-secondary truncate">{state.playbook || 'None'}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <span className="text-[10px] text-brand-text-tertiary font-medium">Execution: Active</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Button className="w-full h-14 gap-3 text-body-lg font-bold" onClick={() => window.location.href = '/'}>
          Launch Command Center
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex justify-center gap-6">
          <button className="text-[12px] text-brand-text-tertiary font-medium hover:text-brand-primary transition-colors">View Event Logs</button>
          <button className="text-[12px] text-brand-text-tertiary font-medium hover:text-brand-primary transition-colors">Setup Workspace Details</button>
        </div>
      </div>
    </div>
  )
}
