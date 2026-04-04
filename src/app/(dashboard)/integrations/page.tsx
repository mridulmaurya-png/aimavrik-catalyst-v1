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

import { getSystemState } from "@/lib/system/state-model";

export default async function IntegrationsPage() {
  const { businessId } = await requireWorkspace();
  const systemState = await getSystemState();

  const CONNECTED = systemState.channels.map(chan => {
    let provider = chan;
    let statusLabel = 'active';
    let lastSync = 'Awaiting Payload';

    if (chan === 'webhook') {
      provider = 'Custom Webhook';
      lastSync = 'Listening';
    } else if (chan === 'whatsapp') {
      provider = 'WhatsApp (Demo Mode)';
      statusLabel = 'simulating';
    } else if (chan === 'email') {
      provider = 'Email Engine';
      lastSync = 'System Sender Active';
    } else {
      provider = chan.charAt(0).toUpperCase() + chan.slice(1).replace('_', ' ');
    }

    return {
      provider,
      status: statusLabel,
      lastSync,
      eventCount: '0'
    }
  });

  if (CONNECTED.length === 0) {
    // Failsafe for fully clean states
    CONNECTED.push({
      provider: 'System',
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
        <Button disabled className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed" title="Direct integration adding enabled in production release">
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
