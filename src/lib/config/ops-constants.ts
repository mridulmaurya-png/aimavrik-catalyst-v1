/**
 * Ops Layer Constants — Production Operations Model
 * Single source of truth for managed-service lifecycle, integration types, automation types.
 */

// ═══════════════════════════════════════════════════
// WORKSPACE LIFECYCLE STATUS (Extended)
// ═══════════════════════════════════════════════════

export const WORKSPACE_LIFECYCLE = [
  "signup_received",
  "onboarding_not_started",
  "onboarding_submitted",
  "under_review",
  "setup_in_progress",
  "ready_for_activation",
  "active",
  "paused",
  "deactivated",
  "restricted",
] as const;

export type WorkspaceLifecycleStatus = typeof WORKSPACE_LIFECYCLE[number];

export function getLifecycleLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    signup_received: "Signup Received",
    onboarding_not_started: "Awaiting Onboarding",
    onboarding_submitted: "Onboarding Submitted",
    under_review: "Under Review",
    setup_in_progress: "Setup In Progress",
    ready_for_activation: "Ready for Activation",
    active: "Active",
    paused: "Paused",
    deactivated: "Deactivated",
    restricted: "Restricted",
  };
  return map[status || ""] || "Unknown";
}

export function getLifecycleColor(status: string | null | undefined): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "active": return "success";
    case "ready_for_activation": return "success";
    case "setup_in_progress": return "info";
    case "under_review": return "info";
    case "onboarding_submitted": return "warning";
    case "paused": return "warning";
    case "deactivated": return "error";
    case "restricted": return "error";
    default: return "neutral";
  }
}

// Lifecycle transitions: which statuses can transition to which
export const LIFECYCLE_TRANSITIONS: Record<string, WorkspaceLifecycleStatus[]> = {
  signup_received: ["under_review", "restricted"],
  onboarding_not_started: ["under_review", "restricted"],
  onboarding_submitted: ["under_review", "restricted"],
  under_review: ["setup_in_progress", "restricted"],
  setup_in_progress: ["ready_for_activation", "under_review", "restricted"],
  ready_for_activation: ["active", "setup_in_progress", "restricted"],
  active: ["paused", "restricted"],
  paused: ["active", "deactivated", "restricted"],
  deactivated: ["under_review"],
  restricted: ["under_review"],
};

// ═══════════════════════════════════════════════════
// INTEGRATION TYPES
// ═══════════════════════════════════════════════════

export const INTEGRATION_TYPES = [
  "crm",
  "email",
  "whatsapp",
  "shopify",
  "payment",
  "csv_import",
  "webhook",
  "n8n",
  "custom",
] as const;

export type IntegrationType = typeof INTEGRATION_TYPES[number];

export const INTEGRATION_PROVIDERS: Record<string, string[]> = {
  crm: ["HubSpot", "Salesforce", "Zoho CRM", "Pipedrive", "Other"],
  email: ["Resend", "SendGrid", "Mailgun", "AWS SES", "Other"],
  whatsapp: ["Meta Cloud API", "Twilio", "Gupshup", "Other"],
  shopify: ["Shopify"],
  payment: ["Razorpay", "Stripe", "PayU", "Other"],
  csv_import: ["Manual CSV", "Google Sheets"],
  webhook: ["Inbound Webhook", "Outbound Webhook"],
  n8n: ["n8n Cloud", "n8n Self-Hosted"],
  custom: ["Custom API"],
};

export const INTEGRATION_STATUSES = ["connected", "configured", "disconnected", "error"] as const;
export type IntegrationStatus = typeof INTEGRATION_STATUSES[number];

export function getIntegrationLabel(type: string): string {
  const map: Record<string, string> = {
    crm: "CRM", email: "Email", whatsapp: "WhatsApp", shopify: "Shopify",
    payment: "Payment", csv_import: "CSV Import", webhook: "Webhook", n8n: "n8n", custom: "Custom",
  };
  return map[type] || type;
}

// ═══════════════════════════════════════════════════
// AUTOMATION TYPES
// ═══════════════════════════════════════════════════

export const AUTOMATION_TYPES = [
  "lead_scoring",
  "lead_routing", 
  "abandoned_recovery",
  "missed_lead_followup",
  "reactivation",
  "admin_alerts",
  "custom_playbook",
] as const;

export type AutomationType = typeof AUTOMATION_TYPES[number];

export const AUTOMATION_MODES = ["test", "live"] as const;
export type AutomationMode = typeof AUTOMATION_MODES[number];

export function getAutomationLabel(type: string): string {
  const map: Record<string, string> = {
    lead_scoring: "Lead Scoring",
    lead_routing: "Lead Routing",
    abandoned_recovery: "Abandoned Recovery",
    missed_lead_followup: "Missed Lead Follow-Up",
    reactivation: "Reactivation",
    admin_alerts: "Admin Alerts",
    custom_playbook: "Custom Playbook",
  };
  return map[type] || type;
}

// ═══════════════════════════════════════════════════
// HEALTH STATUS
// ═══════════════════════════════════════════════════

export const HEALTH_STATUSES = ["healthy", "degraded", "critical", "unknown"] as const;
export type HealthStatus = typeof HEALTH_STATUSES[number];

export function getHealthColor(health: string | null | undefined): "success" | "warning" | "error" | "neutral" {
  switch (health) {
    case "healthy": return "success";
    case "degraded": return "warning";
    case "critical": return "error";
    default: return "neutral";
  }
}
