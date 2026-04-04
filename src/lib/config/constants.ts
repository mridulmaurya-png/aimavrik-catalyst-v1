/**
 * Currency configuration for Catalyst V1.
 * One workspace = one primary currency.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

export const DEFAULT_CURRENCY: CurrencyConfig = SUPPORTED_CURRENCIES[0]; // INR

export function getCurrencyConfig(code: string | null | undefined): CurrencyConfig {
  if (!code) return DEFAULT_CURRENCY;
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
}

export function formatCurrency(value: number | null | undefined, currencyCode: string | null | undefined): string {
  const config = getCurrencyConfig(currencyCode);
  const numValue = value ?? 0;
  return `${config.symbol}${numValue.toLocaleString()}`;
}

/**
 * Lifecycle stages for contacts.
 */
export const LIFECYCLE_STAGES = [
  "new",
  "engaged", 
  "qualified",
  "proposal",
  "negotiation",
  "converted",
  "churned",
  "reactivation",
] as const;

export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export const CONTACT_SEGMENTS = [
  "hot_lead",
  "warm_lead",
  "cold_lead",
  "high_value",
  "at_risk",
  "vip",
  "general",
] as const;

export type ContactSegment = typeof CONTACT_SEGMENTS[number];

export const PLAYBOOK_CATEGORIES = [
  { id: "lead_conversion", name: "Lead Conversion", description: "Convert new leads into customers" },
  { id: "pipeline_recovery", name: "Pipeline Recovery", description: "Re-engage stalled pipeline deals" },
  { id: "remarketing", name: "Remarketing", description: "Reactivate inactive contacts" },
  { id: "customer_revenue", name: "Customer Revenue", description: "Upsell and cross-sell to existing customers" },
] as const;

export type PlaybookCategory = typeof PLAYBOOK_CATEGORIES[number]["id"];

export function formatStage(stage: string | null | undefined): string {
  if (!stage) return "New";
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatSegment(segment: string | null | undefined): string {
  if (!segment) return "General";
  return segment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
