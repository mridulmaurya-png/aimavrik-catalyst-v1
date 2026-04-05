import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { 
  CreditCard, 
  ShieldCheck,
  Mail
} from "lucide-react";

export default async function BillingPage() {
  let contactsCount = 0;
  let businessId = null;

  try {
    const workspace = await requireWorkspace();
    businessId = workspace.businessId;
    const supabase = await createClient();

    if (businessId) {
      const { count } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      
      contactsCount = count || 0;
    }
  } catch (e) {
    console.error("[BILLING] Safe fallback triggered:", e);
  }

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Manage your plan and system entitlements.
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
                  Your AI revenue system is managed by AiMavrik Ops. Your workspace operates under a dedicated managed service agreement with priority delivery infrastructure.
                </p>
                <div className="flex items-center gap-2 pt-2">
                   <Badge variant="success" className="px-3 py-1">Active</Badge>
                   <span className="text-[11px] text-brand-text-tertiary font-medium">Enterprise Tier Recovery Active</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h5 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">Current Usage</h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-display-s font-bold text-brand-text-primary">{contactsCount.toLocaleString()}</p>
                  <p className="text-body-xs text-brand-text-secondary">Managed Contacts</p>
                </div>
                <Badge variant="outline">Within Limit</Badge>
              </div>
            </Card>
            <Card className="p-6 space-y-4">
              <h5 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">System Status</h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-display-s font-bold text-brand-text-primary">Optimized</p>
                  <p className="text-body-xs text-brand-text-secondary">Execution Layer</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card variant="elevated" className="p-6 space-y-6">
            <h4 className="text-body-lg font-bold">Billing Support</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-brand-bg-primary border border-brand-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-body-sm font-bold">Managed Invoicing</p>
                  <p className="text-[11px] text-brand-text-tertiary">Direct bank transfer activated</p>
                </div>
              </div>
              
              <a href="mailto:ops@aimavrik.com?subject=Billing Inquiry" className="block">
                <Button variant="secondary" className="w-full gap-2 h-11 font-bold">
                  <Mail className="w-4 h-4" />
                  Contact Support
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
