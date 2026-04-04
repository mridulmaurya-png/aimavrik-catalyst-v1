import { WebhookSetupPanel } from "@/components/integrations/webhook-setup";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { ConnectorCategoryBlock } from "@/components/integrations/connector-category";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { ShieldAlert } from "lucide-react";
import { 
  Zap, 
  ShoppingCart, 
  Hash, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Layout, 
  CreditCard, 
  Database,
  Plus
} from "lucide-react"

const LEAD_SOURCES = [
  { id: 'wh', name: 'Webhook', icon: Zap },
  { id: 'meta', name: 'Meta Lead Ads', icon: Layout },
  { id: 'cal', name: 'Calendly', icon: Calendar },
  { id: 'gsheet', name: 'Google Sheets', icon: Database },
];

const COMMERCE = [
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart },
  { id: 'woo', name: 'WooCommerce', icon: ShoppingCart },
  { id: 'stripe', name: 'Stripe', icon: CreditCard },
  { id: 'razor', name: 'Razorpay', icon: CreditCard },
];

const CRM = [
  { id: 'hubspot', name: 'HubSpot', icon: Hash },
  { id: 'zoho', name: 'Zoho CRM', icon: Hash },
];

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
  { id: 'email', name: 'Email', icon: Mail },
];

export default async function IntegrationsPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("business_id", businessId);

  if (error) {
    return (
      <div className="p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
        <h2 className="text-heading-3 mt-4 font-bold">Failed to load integrations</h2>
      </div>
    );
  }

  // Graceful handling of connected state metrics.
  // Until event ingestion maps back to integration IDs, we display 0s to maintain schema.
  const CONNECTED = (integrations || []).map(integ => ({
    provider: integ.provider.charAt(0).toUpperCase() + integ.provider.slice(1).replace('_', ' '),
    status: integ.status,
    lastSync: integ.last_synced_at ? new Date(integ.last_synced_at).toLocaleDateString() : 'Awaiting sync',
    eventCount: '0'
  }));

  // Ensure webhook shows as an option if not explicitly created yet, since Catalyst always supports inbound webhooks
  if (!CONNECTED.find(c => c.provider.toLowerCase() === 'webhook')) {
    CONNECTED.unshift({
      provider: 'Webhook',
      status: 'active',
      lastSync: 'Live',
      eventCount: '0'
    });
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Integrations</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Connect your funnel, CRM, website, payments, and communication channels.
          </p>
        </div>
        <Button className="gap-2 h-11 px-6">
          <Plus className="w-5 h-5" />
          Add integration
        </Button>
      </div>

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-brand-text-tertiary uppercase tracking-widest pl-1">
          Connected Systems
        </h4>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {CONNECTED.map((item) => (
            <IntegrationCard 
              key={item.provider}
              {...item as any}
            />
          ))}
        </div>
      </div>

      <WebhookSetupPanel />

      <div className="space-y-12 pt-8 border-t border-brand-border/50">
        <div className="space-y-2">
          <h2 className="text-heading-3 font-bold">Find a connector</h2>
          <p className="text-body-sm text-brand-text-tertiary">Quickly sync data from your existing stack.</p>
        </div>

        <div className="space-y-12">
          <ConnectorCategoryBlock title="Lead Sources" connectors={LEAD_SOURCES} />
          <ConnectorCategoryBlock title="Commerce / Transactions" connectors={COMMERCE} />
          <ConnectorCategoryBlock title="CRM / Contact Systems" connectors={CRM} />
          <ConnectorCategoryBlock title="Communication Channels" connectors={CHANNELS} />
        </div>
      </div>
    </div>
  );
}
