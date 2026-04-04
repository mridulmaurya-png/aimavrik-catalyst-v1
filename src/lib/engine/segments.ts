/**
 * Segments Engine — V1
 * Computes audience segments dynamically from contact data.
 * No new DB table required — segments are rule-based views over the contacts table.
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface SegmentDefinition {
  id: string;
  name: string;
  type: "dynamic";
  category: "recovery" | "remarketing" | "revenue" | "lifecycle";
  description: string;
  icon: string;
  count: number;
}

export const SEGMENT_DEFINITIONS = [
  { id: "no_response", name: "No Response", category: "recovery" as const, description: "Leads who received outreach but haven't responded", icon: "alert" },
  { id: "stale_leads", name: "Stale Leads", category: "recovery" as const, description: "Leads inactive for 7+ days with no engagement", icon: "clock" },
  { id: "hot_leads", name: "Hot Leads", category: "lifecycle" as const, description: "Recently engaged contacts showing buying signals", icon: "flame" },
  { id: "high_value", name: "High Value", category: "revenue" as const, description: "Contacts with opportunity value above threshold", icon: "diamond" },
  { id: "dormant", name: "Dormant Contacts", category: "remarketing" as const, description: "Contacts inactive for 30+ days", icon: "moon" },
  { id: "cross_sell", name: "Cross-Sell Eligible", category: "revenue" as const, description: "Converted customers eligible for additional products", icon: "layers" },
  { id: "upsell", name: "Upsell Eligible", category: "revenue" as const, description: "Active customers ready for premium upgrades", icon: "trending-up" },
  { id: "reactivation", name: "Reactivation Pool", category: "remarketing" as const, description: "Churned or inactive contacts for win-back campaigns", icon: "refresh" },
];

/**
 * Computes segment counts from real contact data
 */
export async function computeSegments(
  supabase: SupabaseClient,
  businessId: string
): Promise<SegmentDefinition[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all contacts for this business (efficient for V1 volumes)
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, stage, contact_type, last_active_at, first_seen_at, total_revenue, metadata_json")
    .eq("business_id", businessId);

  if (!contacts || contacts.length === 0) {
    return SEGMENT_DEFINITIONS.map(s => ({ ...s, type: "dynamic" as const, count: 0 }));
  }

  const counts: Record<string, number> = {};

  contacts.forEach(c => {
    const lastActive = c.last_active_at ? new Date(c.last_active_at) : null;
    const meta = c.metadata_json || {};

    // No Response: stage is 'engaged' but last active > 3 days ago
    if (c.stage === 'engaged' && lastActive && lastActive < new Date(threeDaysAgo)) {
      counts["no_response"] = (counts["no_response"] || 0) + 1;
    }

    // Stale Leads: stage is 'new' and last active > 7 days ago
    if ((c.stage === 'new' || c.stage === 'engaged') && lastActive && lastActive < new Date(sevenDaysAgo)) {
      counts["stale_leads"] = (counts["stale_leads"] || 0) + 1;
    }

    // Hot Leads: recently active (within 3 days) and stage is 'engaged' or 'qualified'
    if ((c.stage === 'engaged' || c.stage === 'qualified') && lastActive && lastActive >= new Date(threeDaysAgo)) {
      counts["hot_leads"] = (counts["hot_leads"] || 0) + 1;
    }

    // High Value: has opportunity_value or total_revenue > 0
    const oppValue = meta.opportunity_value || c.total_revenue || 0;
    if (oppValue > 0) {
      counts["high_value"] = (counts["high_value"] || 0) + 1;
    }

    // Dormant: last active > 30 days ago
    if (lastActive && lastActive < new Date(thirtyDaysAgo)) {
      counts["dormant"] = (counts["dormant"] || 0) + 1;
    }

    // Cross-Sell Eligible: converted customers
    if (c.stage === 'converted' && c.contact_type === 'customer') {
      counts["cross_sell"] = (counts["cross_sell"] || 0) + 1;
    }

    // Upsell Eligible: converted or engaged customers with revenue
    if ((c.stage === 'converted' || c.contact_type === 'customer') && (c.total_revenue || 0) > 0) {
      counts["upsell"] = (counts["upsell"] || 0) + 1;
    }

    // Reactivation Pool: churned or reactivation stage
    if (c.stage === 'churned' || c.stage === 'reactivation') {
      counts["reactivation"] = (counts["reactivation"] || 0) + 1;
    }
  });

  return SEGMENT_DEFINITIONS.map(s => ({
    ...s,
    type: "dynamic" as const,
    count: counts[s.id] || 0,
  }));
}

/**
 * Builds revenue opportunity insights from segment data
 */
export function buildRevenueOpportunities(segments: SegmentDefinition[], totalContacts: number) {
  const opportunities: { title: string; count: number; description: string; cta: string; href: string; priority: "high" | "medium" | "low" }[] = [];
  
  const stale = segments.find(s => s.id === "stale_leads");
  const noResponse = segments.find(s => s.id === "no_response");
  const dormant = segments.find(s => s.id === "dormant");
  const hot = segments.find(s => s.id === "hot_leads");
  const crossSell = segments.find(s => s.id === "cross_sell");
  const upsell = segments.find(s => s.id === "upsell");
  const reactivation = segments.find(s => s.id === "reactivation");
  const highValue = segments.find(s => s.id === "high_value");

  if (stale && stale.count > 0) {
    opportunities.push({
      title: "Stale Lead Recovery",
      count: stale.count,
      description: `${stale.count} lead${stale.count !== 1 ? 's' : ''} inactive for 7+ days ready for reactivation.`,
      cta: "Launch reactivation",
      href: "/playbooks",
      priority: "high"
    });
  }

  if (noResponse && noResponse.count > 0) {
    opportunities.push({
      title: "No-Response Follow-Up",
      count: noResponse.count,
      description: `${noResponse.count} contact${noResponse.count !== 1 ? 's' : ''} pending retry after initial outreach.`,
      cta: "Activate recovery",
      href: "/playbooks",
      priority: "high"
    });
  }

  if (hot && hot.count > 0) {
    opportunities.push({
      title: "Hot Lead Conversion",
      count: hot.count,
      description: `${hot.count} engaged contact${hot.count !== 1 ? 's' : ''} showing buying signals.`,
      cta: "Fast-track conversion",
      href: "/contacts",
      priority: "high"
    });
  }

  if (crossSell && crossSell.count > 0) {
    opportunities.push({
      title: "Cross-Sell Opportunity",
      count: crossSell.count,
      description: `${crossSell.count} customer${crossSell.count !== 1 ? 's' : ''} eligible for complementary offerings.`,
      cta: "Build campaign",
      href: "/campaigns",
      priority: "medium"
    });
  }

  if (upsell && upsell.count > 0) {
    opportunities.push({
      title: "Upsell Opportunity",
      count: upsell.count,
      description: `${upsell.count} customer${upsell.count !== 1 ? 's' : ''} ready for premium upgrades.`,
      cta: "Launch sequence",
      href: "/campaigns",
      priority: "medium"
    });
  }

  if (dormant && dormant.count > 0) {
    opportunities.push({
      title: "Dormant Reactivation",
      count: dormant.count,
      description: `${dormant.count} contact${dormant.count !== 1 ? 's' : ''} dormant for 30+ days available for win-back.`,
      cta: "Re-engage contacts",
      href: "/segments",
      priority: "medium"
    });
  }

  if (reactivation && reactivation.count > 0) {
    opportunities.push({
      title: "Win-Back Pool",
      count: reactivation.count,
      description: `${reactivation.count} churned contact${reactivation.count !== 1 ? 's' : ''} in the reactivation pipeline.`,
      cta: "Launch win-back",
      href: "/playbooks",
      priority: "low"
    });
  }

  // If no opportunities, provide guidance
  if (opportunities.length === 0 && totalContacts === 0) {
    opportunities.push({
      title: "Import Your First Leads",
      count: 0,
      description: "Add contacts via CSV import or webhook to unlock revenue opportunities.",
      cta: "Add leads",
      href: "/integrations",
      priority: "high"
    });
  }

  return opportunities;
}

/**
 * Builds AI-style suggested actions from segment data
 */
export function buildSuggestedActions(segments: SegmentDefinition[], activePlaybooks: number) {
  const actions: { text: string; confidence: "high" | "medium"; href: string; cta: string }[] = [];

  const stale = segments.find(s => s.id === "stale_leads");
  const hot = segments.find(s => s.id === "hot_leads");
  const highValue = segments.find(s => s.id === "high_value");
  const noResponse = segments.find(s => s.id === "no_response");

  if (stale && stale.count > 0) {
    actions.push({
      text: `Launch reactivation for ${stale.count} stale lead${stale.count !== 1 ? 's' : ''}.`,
      confidence: "high",
      href: "/playbooks",
      cta: "Activate"
    });
  }

  if (hot && hot.count > 0) {
    actions.push({
      text: `Flag ${hot.count} hot lead${hot.count !== 1 ? 's' : ''} for priority follow-up.`,
      confidence: "high",
      href: "/contacts",
      cta: "Review"
    });
  }

  if (highValue && highValue.count > 0) {
    actions.push({
      text: `${highValue.count} high-value contact${highValue.count !== 1 ? 's' : ''} may need manual intervention.`,
      confidence: "medium",
      href: "/contacts",
      cta: "Review"
    });
  }

  if (noResponse && noResponse.count > 0) {
    actions.push({
      text: `Shift ${noResponse.count} no-response lead${noResponse.count !== 1 ? 's' : ''} to WhatsApp channel.`,
      confidence: "medium",
      href: "/playbooks",
      cta: "Adjust"
    });
  }

  if (activePlaybooks === 0) {
    actions.push({
      text: "Activate at least one playbook to begin automated revenue processing.",
      confidence: "high",
      href: "/playbooks",
      cta: "Activate"
    });
  }

  return actions;
}
