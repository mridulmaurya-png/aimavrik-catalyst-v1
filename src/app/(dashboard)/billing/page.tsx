import { UsageProgressCard, InvoiceTable } from "@/components/billing/billing-components";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const { count: contactsCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Zap className="w-5 h-5 fill-brand-primary/20" />
                  <h4 className="text-heading-4 font-bold tracking-tight">Enterprise Scaling Plan</h4>
                </div>
                <p className="text-body-sm text-brand-text-secondary leading-relaxed">
                  Your workspace is currently on the high-volume execution tier.
                </p>
              </div>
              <div className="text-right">
                <p className="text-heading-3 font-bold text-brand-text-primary">—</p>
                <p className="text-[11px] text-brand-text-tertiary">Billing not yet configured</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button disabled className="h-10 px-6 gap-2 opacity-50 cursor-not-allowed" title="Billing controls enabled in production workspace">
                Upgrade Plan
              </Button>
              <Button variant="ghost" disabled className="h-10 px-6 gap-2 bg-white/[0.03] border border-brand-border/50 opacity-50 cursor-not-allowed" title="Billing controls enabled in production workspace">
                Cancel Subscription
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-heading-3 font-bold">Monthly Usage</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <UsageProgressCard label="Monthly Contacts" used={contactsCount || 0} total={25000} unit="contacts" />
              <UsageProgressCard label="Inbound Events" used={0} total={100000} unit="events" />
              <UsageProgressCard label="WhatsApp Sends" used={0} total={10000} unit="messages" />
              <UsageProgressCard label="Email Sends" used={0} total={50000} unit="messages" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-heading-3 font-bold">Invoice History</h3>
            <InvoiceTable />
          </div>
        </div>

        <div className="space-y-8">
          <Card variant="elevated" className="p-6 space-y-6">
            <h4 className="text-body-lg font-bold">Payment Method</h4>
            <div className="p-4 rounded-xl border border-brand-border bg-brand-bg-primary flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-text-tertiary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-body-sm font-bold text-brand-text-primary">Visa ending in 4242</p>
                  <p className="text-[11px] text-brand-text-tertiary">Expires 12/28</p>
                </div>
              </div>
              <Button variant="ghost" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" disabled className="w-full text-brand-primary h-9 gap-2 opacity-50 cursor-not-allowed" title="Billing controls enabled in production workspace">
              Update payment method
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Card>

          <Card variant="elevated" className="p-6 space-y-4 border-functional-success/20 bg-functional-success/5">
            <div className="flex items-center gap-2 text-functional-success">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-body-sm font-bold uppercase tracking-wider">Plan Benefits</h4>
            </div>
            <ul className="space-y-3">
              {[
                "Unlimited Playbooks",
                "Advanced AI Action Decisions",
                "Custom Webhook Ingestion",
                "Multi-channel Sequence Support",
                "Priority Email Support"
              ].map(benefit => (
                <li key={benefit} className="flex items-center gap-3 text-body-sm text-brand-text-secondary">
                  <div className="w-1 h-1 rounded-full bg-functional-success" />
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
