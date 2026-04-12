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
  "voice",
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
  voice: ["Twilio", "Exotel", "Vapi"],
};

export const INTEGRATION_STATUSES = ["connected", "pending", "disconnected", "failed", "needs_attention"] as const;
export type IntegrationStatus = typeof INTEGRATION_STATUSES[number];

export function getIntegrationLabel(type: string): string {
  const map: Record<string, string> = {
    crm: "CRM", email: "Email", whatsapp: "WhatsApp", shopify: "Shopify",
    payment: "Payment", csv_import: "CSV Import", webhook: "Webhook", n8n: "n8n", custom: "Custom", voice: "AI Voice",
  };
  return map[type] || type;
}

export function getIntegrationStatusColor(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "connected": return "success";
    case "pending": return "warning";
    case "needs_attention": return "warning";
    case "disconnected": return "neutral";
    case "failed": return "error";
    default: return "neutral";
  }
}

// ═══════════════════════════════════════════════════
// AUTOMATION TYPES
// ═══════════════════════════════════════════════════

export const AUTOMATION_TYPES = [
  "lead_scoring",
  "lead_routing", 
  "lead_response",
  "follow_up",
  "abandoned_recovery",
  "missed_lead_followup",
  "reactivation",
  "re_engagement",
  "festive_campaign",
  "admin_alerts",
  "custom_playbook",
] as const;

export type AutomationType = typeof AUTOMATION_TYPES[number];

export const AUTOMATION_MODES = ["test", "live"] as const;
export type AutomationMode = typeof AUTOMATION_MODES[number];

export const AUTOMATION_STATUSES = ["draft", "review", "approved", "active", "paused", "failed", "archived"] as const;
export type AutomationStatus = typeof AUTOMATION_STATUSES[number];

export const EXECUTION_ENGINES = ["internal", "n8n", "webhook", "manual_hold"] as const;
export type ExecutionEngine = typeof EXECUTION_ENGINES[number];

export const OUTPUT_CHANNELS = ["email", "whatsapp", "voice", "chatbot", "crm", "internal_task"] as const;
export type OutputChannel = typeof OUTPUT_CHANNELS[number];

// Trigger events — the heart of the execution system
export const TRIGGER_EVENTS = [
  "lead_created",
  "lead_qualified",
  "lead_unresponsive",
  "followup_due",
  "appointment_booked",
  "payment_failed",
  "payment_received",
  "customer_replied",
  "form_submitted",
  "high_intent_detected",
  "manual_trigger",
  "lead_submitted",
  "no_response_24h",
  "custom_event",
  // V2 engagement events
  "language_mismatch_detected",
  "festive_trigger",
  "region_based_opportunity",
] as const;

export type TriggerEvent = typeof TRIGGER_EVENTS[number];

export function getTriggerEventLabel(event: string): string {
  const map: Record<string, string> = {
    lead_created: "Lead Created",
    lead_qualified: "Lead Qualified",
    lead_unresponsive: "Lead Unresponsive",
    followup_due: "Follow-Up Due",
    appointment_booked: "Appointment Booked",
    payment_failed: "Payment Failed",
    payment_received: "Payment Received",
    customer_replied: "Customer Replied",
    form_submitted: "Form Submitted",
    high_intent_detected: "High Intent Detected",
    manual_trigger: "Manual Trigger",
    lead_submitted: "Lead Submitted",
    no_response_24h: "No Response 24h",
    custom_event: "Custom Event",
    language_mismatch_detected: "Language Mismatch",
    festive_trigger: "Festive Trigger",
    region_based_opportunity: "Region Opportunity",
  };
  return map[event] || event;
}

export function getAutomationLabel(type: string): string {
  const map: Record<string, string> = {
    lead_scoring: "Lead Scoring",
    lead_routing: "Lead Routing",
    lead_response: "Lead Response",
    follow_up: "Follow-Up",
    abandoned_recovery: "Abandoned Recovery",
    missed_lead_followup: "Missed Lead Follow-Up",
    reactivation: "Reactivation",
    re_engagement: "Re-Engagement",
    festive_campaign: "Festive Campaign",
    admin_alerts: "Admin Alerts",
    custom_playbook: "Custom Playbook",
  };
  return map[type] || type;
}

export function getStatusColor(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "active": return "success";
    case "approved": return "info";
    case "review": return "warning";
    case "paused": return "warning";
    case "failed": return "error";
    case "archived": return "neutral";
    default: return "neutral";
  }
}

export function getRunStatusColor(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "completed": return "success";
    case "handed_off": return "info";
    case "running": return "info";
    case "queued": return "warning";
    case "blocked": return "warning";
    case "failed": return "error";
    default: return "neutral";
  }
}

// ═══════════════════════════════════════════════════
// HEALTH STATUS
// ═══════════════════════════════════════════════════

export const HEALTH_STATUSES = ["healthy", "degraded", "critical", "failed", "not_configured", "unknown"] as const;
export type HealthStatus = typeof HEALTH_STATUSES[number];

export function getHealthColor(health: string | null | undefined): "success" | "warning" | "error" | "neutral" {
  switch (health) {
    case "healthy": return "success";
    case "degraded": return "warning";
    case "critical": return "error";
    case "failed": return "error";
    case "not_configured": return "neutral";
    default: return "neutral";
  }
}

// ═══════════════════════════════════════════════════
// OPS ACTION TYPES (for audit logging)
// ═══════════════════════════════════════════════════

export const OPS_ACTION_TYPES = [
  "WORKSPACE_LIFECYCLE_CHANGED",
  "WORKSPACE_ACTIVATED",
  "WORKSPACE_PAUSED",
  "WORKSPACE_ARCHIVED",
  "INTEGRATION_ADDED",
  "INTEGRATION_UPDATED",
  "INTEGRATION_DELETED",
  "INTEGRATION_TESTED",
  "INTEGRATION_HEALTH_SET",
  "AUTOMATION_ADDED",
  "AUTOMATION_UPDATED",
  "AUTOMATION_STATUS_CHANGED",
  "AUTOMATION_DELETED",
  "AUTOMATION_TEST_EXECUTED",
  "NOTE_ADDED",
  "NOTE_DELETED",
  "EXECUTION_COMPLETED",
  "EXECUTION_BLOCKED",
  "EXECUTION_FAILED",
] as const;
