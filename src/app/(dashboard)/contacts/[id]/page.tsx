import { ContactProfileCard } from "@/components/contacts/contact-profile";
import { ActivityTimeline } from "@/components/contacts/activity-timeline";
import { AIContactBrief } from "@/components/contacts/ai-brief";
import { AssignedPlaybooks, QuickActions } from "@/components/contacts/playbook-status";
import { InterventionButton } from "@/components/contacts/intervention-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ShieldAlert, Flag, UserCheck } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatStage, formatSegment } from "@/lib/config/constants";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId, currencyCode } = await requireWorkspace();
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
        <Link href="/contacts" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
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

  // Fetch real events for this contact
  const { data: events } = await supabase
    .from("events")
    .select("id, event_type, source, status, created_at, payload_json")
    .eq("business_id", businessId)
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch actions for this contact
  const { data: actions } = await supabase
    .from("actions")
    .select("id, action_type, channel, status, created_at, playbook_id")
    .eq("business_id", businessId)
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch messages for this contact
  const { data: messages } = await supabase
    .from("messages")
    .select("id, channel, subject, delivery_status, created_at")
    .eq("business_id", businessId)
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch lead responses (inbound replies)
  const { data: responses } = await supabase
    .from("lead_responses")
    .select("id, message, channel, sentiment, created_at")
    .eq("business_id", businessId)
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(15);

  // Fetch assigned playbooks
  const { data: contactPlaybooks } = await supabase
    .from("actions")
    .select("playbook_id, playbooks(playbook_type, is_active)")
    .eq("business_id", businessId)
    .eq("contact_id", id)
    .limit(5);

  // Build real timeline from events + actions + messages + responses
  const timelineItems = buildTimeline(events || [], actions || [], messages || [], responses || []);

  // Build playbook assignments from real actions
  const assignedPlaybooks = buildPlaybookAssignments(contactPlaybooks || []);

  // Extract metadata fields
  const meta = contact.metadata_json || {};
  const segment = meta.segment || "general";
  const opportunityValue = meta.opportunity_value || contact.total_revenue || 0;
  const leadScore = meta.lead_score || null;

  const mappedContact = {
    name: contact.full_name || "Unknown Contact",
    email: contact.email || "—",
    phone: contact.phone || "—",
    source: (contact.source || "manual").replace(/_/g, " "),
    stage: formatStage(contact.stage),
    segment: formatSegment(segment),
    type: (contact.contact_type || "lead").toUpperCase(),
    revenue: formatCurrency(opportunityValue, currencyCode),
    firstSeen: contact.first_seen_at ? new Date(contact.first_seen_at).toLocaleDateString() : "—",
    lastActive: contact.last_active_at ? new Date(contact.last_active_at).toLocaleDateString() : "—",
    lastResponse: contact.last_response_at ? new Date(contact.last_response_at).toLocaleDateString() : null,
    responseCount: contact.response_count || 0,
    leadScore,
    tags: contact.tags_json || [],
  };

  // Dynamic AI brief
  const briefSummary = contact.notes || `${mappedContact.name} is a ${contact.contact_type || 'lead'} currently in the ${mappedContact.stage} stage. Source: ${mappedContact.source}.`;
  const briefIntent = leadScore && leadScore > 70 ? "High intent based on engagement score"
    : contact.stage === 'engaged' || contact.stage === 'qualified' ? "Moderate intent — showing engagement signals"
    : "Awaiting engagement signals";
  const briefNextAction = (actions && actions.length > 0) 
    ? `Last action: ${actions[0].action_type?.replace(/_/g, ' ')} via ${actions[0].channel}` 
    : contact.stage === 'new' ? "Awaiting initial playbook engagement." : "Monitoring for conversion signals.";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/contacts" className="flex items-center gap-1.5 text-brand-text-tertiary hover:text-brand-primary transition-colors text-label-sm font-semibold uppercase tracking-wider">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Contacts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-heading-1 font-bold tracking-tight">{mappedContact.name}</h1>
            <Badge variant={contact.stage === 'converted' ? 'success' : contact.stage === 'engaged' ? 'info' : 'neutral'} className="capitalize">
              {mappedContact.stage}
            </Badge>
          </div>
          <p className="text-brand-text-secondary text-body-sm">
            {mappedContact.email !== "—" ? mappedContact.email : mappedContact.phone} · {mappedContact.source} · {mappedContact.segment}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InterventionButton contactId={contact.id} isFlagged={!!meta.needs_intervention} />
          <Button variant="ghost" disabled title="Owner assignment — available in production" className="h-11 bg-white/[0.02] border border-brand-border gap-2 opacity-60 cursor-not-allowed">
            <UserCheck className="w-4 h-4" />
            Assign owner
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
          <ActivityTimeline events={timelineItems as any} />
        </div>

        {/* RIGHT COLUMN: Insights and Actions */}
        <div className="lg:col-span-1 space-y-8">
          <AIContactBrief
            summary={briefSummary}
            intent={briefIntent}
            nextAction={briefNextAction}
          />

          <AssignedPlaybooks playbooks={assignedPlaybooks as any} />

          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function buildTimeline(events: any[], actions: any[], messages: any[], responses: any[] = []) {
  const items: any[] = [];

  // Events
  events.forEach(e => {
    items.push({
      id: e.id,
      type: (e.event_type || "event").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: `${e.source || 'System'} event processed. Status: ${e.status || 'unknown'}.`,
      timestamp: formatTimeAgo(e.created_at),
      icon: e.source === 'csv_upload' ? 'lead' : e.event_type?.includes('playbook') ? 'ai' : 'lead',
      status: e.status === 'processed' ? 'success' : e.status,
      sortDate: new Date(e.created_at).getTime()
    });
  });

  // Actions
  actions.forEach(a => {
    items.push({
      id: a.id,
      type: `Action: ${(a.action_type || "queued").replace(/_/g, " ")}`,
      description: `Channel: ${a.channel || 'system'}. Status: ${a.status}.`,
      timestamp: formatTimeAgo(a.created_at),
      icon: a.channel === 'whatsapp' ? 'whatsapp' : a.channel === 'email' ? 'email' : 'ai',
      status: a.status === 'completed' ? 'success' : a.status === 'failed' ? 'failed' : undefined,
      sortDate: new Date(a.created_at).getTime()
    });
  });

  // Messages
  messages.forEach(m => {
    items.push({
      id: m.id,
      type: `Message: ${m.subject || m.channel || 'Outbound'}`,
      description: `Delivery: ${m.delivery_status || 'pending'}.`,
      timestamp: formatTimeAgo(m.created_at),
      icon: m.channel === 'whatsapp' ? 'whatsapp' : 'email',
      status: m.delivery_status === 'delivered' ? 'delivered' : m.delivery_status === 'failed' ? 'failed' : undefined,
      sortDate: new Date(m.created_at).getTime()
    });
  });

  // Lead Responses (inbound replies)
  responses.forEach(r => {
    const sentimentLabel = r.sentiment === 'interested' ? '🟢 Interested'
      : r.sentiment === 'not_interested' ? '🔴 Not Interested'
      : '🟡 Engaged';
    items.push({
      id: r.id,
      type: `Reply via ${(r.channel || 'unknown').charAt(0).toUpperCase() + (r.channel || 'unknown').slice(1)}`,
      description: `"${r.message.length > 80 ? r.message.substring(0, 80) + '…' : r.message}" — ${sentimentLabel}`,
      timestamp: formatTimeAgo(r.created_at),
      icon: r.channel === 'whatsapp' ? 'whatsapp' : r.channel === 'email' ? 'email' : 'lead',
      status: r.sentiment === 'interested' ? 'success' : r.sentiment === 'not_interested' ? 'failed' : undefined,
      sortDate: new Date(r.created_at).getTime()
    });
  });

  // Sort by date descending
  items.sort((a, b) => b.sortDate - a.sortDate);

  // If no timeline items, show a single "Contact created" item
  if (items.length === 0) {
    items.push({
      id: 'genesis',
      type: 'Contact Created',
      description: 'This contact was added to the system. Awaiting events and playbook activity.',
      timestamp: 'On record',
      icon: 'lead',
      status: 'success'
    });
  }

  return items;
}

function buildPlaybookAssignments(contactPlaybooks: any[]) {
  const seen = new Set<string>();
  const results: any[] = [];

  contactPlaybooks.forEach(cp => {
    const pb = Array.isArray(cp.playbooks) ? cp.playbooks[0] : cp.playbooks;
    if (!pb || !pb.playbook_type || seen.has(pb.playbook_type)) return;
    seen.add(pb.playbook_type);
    results.push({
      name: pb.playbook_type,
      step: "Tracking",
      nextAction: pb.is_active ? "Active — monitoring" : "Paused",
      status: pb.is_active ? "active" : "paused"
    });
  });

  if (results.length === 0) {
    results.push({
      name: "No playbooks assigned",
      step: "—",
      nextAction: "Activate a playbook to begin automation",
      status: "paused"
    });
  }

  return results;
}
