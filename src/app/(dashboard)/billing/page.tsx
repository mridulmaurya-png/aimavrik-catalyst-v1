import { UsageProgressCard, InvoiceTable } from "@/components/billing/billing-components";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { 
  CreditCard, 
  ChevronRight, 
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

export default async function BillingPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  let contactsCount = 0;
  
  try {
    const { count } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId);
    
    contactsCount = count || 0;
  } catch (e) {
    console.error("[BILLING] Failed to fetch usage data, falling back to defaults:", e);
  }

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Manage your plan, usage, and subscription details.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card variant="elevated" className="p-8 space-y-8 bg-gradient-to-br from-brand-primary/5 to-transparent border-brand-primary/20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-primary">
                  <ShieldCheck className="w-6 h-6" />
                  <h4 className="text-heading-3 font-bold tracking-tight">Managed Infrastructure</h4>
                </div>
                <p className="text-body-md text-brand-text-secondary leading-relaxed max-w-xl">
                  Your Catalyst workspace is currently operating under a managed service agreement. Subscription updates, custom scaling, and performance billing are handled directly by AiMavrik Ops.
                </p>
                <div className="flex items-center gap-2 pt-2">
                   <Badge variant="success" className="px-3 py-1">Active</Badge>
                   <span className="text-[11px] text-brand-text-tertiary font-medium">Next review scheduled for next month</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-heading-3 font-bold">Workspace Limits</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <UsageProgressCard label="Monthly Contacts" used={contactsCount || 0} total={50000} unit="contacts" />
              <UsageProgressCard label="Revenue Execution" used={0} total={100} unit="playbooks" />
            </div>
            <p className="text-[11px] text-brand-text-tertiary italic">Usage data is refreshed every 24 hours. Contact your account manager for limit increases.</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card variant="elevated" className="p-6 space-y-6">
            <h4 className="text-body-lg font-bold">Billing Coordination</h4>
            <div className="p-6 rounded-xl border border-brand-border bg-brand-bg-primary space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-brand-primary" />
              </div>
              <p className="text-body-sm text-brand-text-secondary">
                Your payment methods and billing cycles are managed securely through our operator portal.
              </p>
              <Button variant="secondary" className="w-full text-body-sm font-bold border-brand-border h-11" onClick={() => window.location.href = 'mailto:ops@aimavrik.com?subject=Billing Inquiry'}>
                Contact Ops Support
              </Button>
            </div>
          </Card>

          <Card variant="elevated" className="p-6 space-y-4 border-brand-primary/20 bg-brand-primary/5">
            <div className="flex items-center gap-2 text-brand-primary">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-body-sm font-bold uppercase tracking-wider">Active Entitlements</h4>
            </div>
            <ul className="space-y-3">
              {[
                "Unlimited Managed Playbooks",
                "Priority Channel Routing",
                "Advanced Revenue Attribution",
                "Managed Delivery Infrastructure",
                "24/7 Monitoring"
              ].map(benefit => (
                <li key={benefit} className="flex items-center gap-3 text-body-sm text-brand-text-secondary">
                  <div className="w-1 h-1 rounded-full bg-brand-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
