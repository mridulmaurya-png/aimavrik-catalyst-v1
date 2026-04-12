import { WebhookSetupPanel } from "@/components/integrations/webhook-setup";
import { CSVUploadPanel } from "@/components/integrations/csv-upload-panel";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { ConnectorCategoryBlock } from "@/components/integrations/connector-category";
import { ConnectorSettingsPanel } from "@/components/integrations/connector-settings";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
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
  Plus,
  PhoneCall
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
  { id: 'voice', name: 'AI Voice Calls', icon: PhoneCall },
];

export default async function IntegrationsPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  // Fetch integrations directly — no getSystemState dependency
  const { data: integrations } = await supabase
    .from("client_integrations")
    .select("id, provider, status, created_at, integration_type")
    .eq("business_id", businessId);

  // Fetch business settings for connector config
  const { data: bizSettings } = await supabase
    .from("business_settings")
    .select("support_email, config_json, brand_voice_json")
    .eq("business_id", businessId)
    .maybeSingle();

  // Fetch event counts per source
  const { data: eventCounts } = await supabase
    .from("events")
    .select("source")
    .eq("business_id", businessId);

  const countBySource: Record<string, number> = {};
  (eventCounts || []).forEach(e => {
    const src = e.source?.toLowerCase() || 'unknown';
    countBySource[src] = (countBySource[src] || 0) + 1;
  });

  // Build connected systems from real integrations data
  const CONNECTED = (integrations || []).map(int => {
    const typeOrProvider = int.integration_type || int.provider || "unknown";
    const provider = int.provider || typeOrProvider;
    const normalizedProvider = typeOrProvider.toLowerCase();

    let displayName = provider.charAt(0).toUpperCase() + provider.slice(1).replace(/_/g, ' ');
    let statusLabel = int.status || 'active';
    let lastSync = 'Connected';

    if (normalizedProvider === 'webhook' || normalizedProvider === 'custom_webhook') {
      displayName = 'Custom Webhook';
      lastSync = 'Listening';
    } else if (normalizedProvider === 'csv_upload') {
      displayName = 'CSV / Excel Import';
      lastSync = 'Manual';
    } else if (normalizedProvider === 'email') {
      displayName = 'Email Engine';
      lastSync = 'System Active';
    } else if (normalizedProvider === 'whatsapp') {
      displayName = 'WhatsApp';
      statusLabel = 'simulating';
    } else if (normalizedProvider === 'voice') {
      displayName = 'AI Voice';
      lastSync = 'Standby';
    }

    const realEventCount = countBySource[normalizedProvider] || 0;

    return {
      provider: displayName,
      status: statusLabel,
      lastSync,
      eventCount: realEventCount.toString()
    };
  });

  // Deduplicate
  const UNIQUE_CONNECTED = Array.from(new Map(CONNECTED.map(item => [item.provider, item])).values());

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Integrations</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Connect your funnel, CRM, website, payments, and communication channels.
          </p>
        </div>
        <Button disabled className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed" title="Direct integration adding coming soon">
          <Plus className="w-5 h-5" />
          Add integration
        </Button>
      </div>

      {UNIQUE_CONNECTED.length > 0 ? (
        <div className="space-y-6">
          <h4 className="text-[11px] font-bold text-brand-text-tertiary uppercase tracking-widest pl-1">
            Connected Systems
          </h4>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {UNIQUE_CONNECTED.map((item) => (
              <IntegrationCard 
                key={item.provider}
                {...item as any}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 border border-dashed border-brand-border rounded-xl text-center space-y-2">
          <p className="text-brand-text-tertiary text-body-sm">No integrations connected yet.</p>
          <p className="text-[11px] text-brand-text-tertiary">Import contacts via CSV or configure a webhook below.</p>
        </div>
      )}

      {/* Connector Settings UI */}
      <div className="pt-8 border-t border-brand-border/50">
        <ConnectorSettingsPanel initialSettings={bizSettings as any || {}} />
      </div>

      <WebhookSetupPanel businessId={businessId} />

      <CSVUploadPanel />

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
