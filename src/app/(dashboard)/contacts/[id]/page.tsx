import { ContactProfileCard } from "@/components/contacts/contact-profile";
import { ActivityTimeline } from "@/components/contacts/activity-timeline";
import { AIContactBrief } from "@/components/contacts/ai-brief";
import { AssignedPlaybooks, QuickActions } from "@/components/contacts/playbook-status";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MoreHorizontal, Zap, Pause, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

// Fallback logic for relations not implemented in this phase
const TIMELINE_EVENTS = [
  { id: '1', type: 'Cart recovery triggered', description: 'System decision: High-intent lead. Initiating Abandoned Cart Playbook.', timestamp: '2m ago', icon: 'ai', status: 'success' },
  { id: '2', type: 'WhatsApp sent', description: 'Subject: "Still thinking about those items, Alex?"', timestamp: '5m ago', icon: 'whatsapp', metadata: 'Attempt 1 of 3: SMS Fallback enabled', status: 'delivered' },
  { id: '3', type: 'Lead received', description: 'Incoming signal from Shopify Webhook (Cart #9402).', timestamp: '12m ago', icon: 'lead' },
];

const PLAYBOOKS = [
  { name: "Abandoned Cart Recovery", step: "Step 2: 24h SMS Reminder", nextAction: "Wait 24h", status: "active" },
];

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error || !contact) {
    return (
      <div className="space-y-8 pb-12">
        <Link href="/dashboard/contacts" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Contacts
        </Link>
        <div className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
          <h2 className="text-heading-3 mt-4 font-bold">Contact not found</h2>
          <p className="text-body-sm text-brand-text-secondary mt-2">This contact record does not exist or you lack permission.</p>
        </div>
      </div>
    );
  }

  const mappedContact = {
    name: contact.full_name,
    email: contact.email || "-",
    phone: contact.phone || "-",
    source: contact.source || "Manual",
    stage: contact.stage.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    type: contact.contact_type.toUpperCase(),
    revenue: `$${contact.total_revenue?.toLocaleString() || '0'}`,
    firstSeen: new Date(contact.first_seen_at).toLocaleDateString(),
    lastActive: new Date(contact.last_active_at).toLocaleDateString(),
    tags: contact.tags_json || ["New"]
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard/contacts" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Contacts
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-heading-1 font-bold tracking-tight">Contact Overview</h1>
            <p className="text-brand-text-secondary text-body-sm">
              Activity, follow-up, conversion signals, and system actions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-11 bg-white/[0.02] border border-brand-border gap-2">
            <Pause className="w-4 h-4" />
            Pause automation
          </Button>
          <Button className="h-11 px-6 gap-2">
            <Zap className="w-4 h-4" />
            Trigger manual follow-up
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: Profile info */}
        <div className="lg:col-span-1">
          <ContactProfileCard contact={mappedContact as any} />
        </div>

        {/* CENTER COLUMN: Timeline */}
        <div className="lg:col-span-2 h-[800px]">
          <ActivityTimeline events={TIMELINE_EVENTS as any} />
        </div>

        {/* RIGHT COLUMN: Insights and Actions */}
        <div className="lg:col-span-1 space-y-8">
          <AIContactBrief 
            summary={contact.notes || `${contact.full_name} is a ${contact.contact_type} currently in the ${mappedContact.stage} stage.`}
            intent={contact.stage === 'engaged' ? "High implicit intent based on activity" : "Unknown"}
            nextAction={contact.stage === 'new' ? "Awaiting initial playbook engagement routing." : "Monitoring for conversion."}
          />
          
          <AssignedPlaybooks playbooks={PLAYBOOKS as any} />
          
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
