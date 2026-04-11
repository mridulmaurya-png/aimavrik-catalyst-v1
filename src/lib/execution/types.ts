/**
 * Execution Backbone — Core Type Definitions
 * Single source of truth for all execution-related types.
 */

// ═══════════════════════════════════════════════════
// AUTOMATION LIFECYCLE
// ═══════════════════════════════════════════════════

export type AutomationLifecycleStatus = 
  | 'draft' 
  | 'review' 
  | 'approved' 
  | 'active' 
  | 'paused' 
  | 'failed' 
  | 'archived';

export const EXECUTABLE_STATUSES: AutomationLifecycleStatus[] = ['approved', 'active'];
export const NON_EXECUTABLE_STATUSES: AutomationLifecycleStatus[] = ['draft', 'review', 'paused', 'failed', 'archived'];

// ═══════════════════════════════════════════════════
// INTEGRATION HEALTH MODEL
// ═══════════════════════════════════════════════════

export type IntegrationHealthStatus = 
  | 'connected' 
  | 'pending' 
  | 'disconnected' 
  | 'failed' 
  | 'needs_attention';

export const HEALTHY_INTEGRATION_STATUSES: string[] = ['connected'];

// ═══════════════════════════════════════════════════
// EXECUTION ENGINES
// ═══════════════════════════════════════════════════

export type ExecutionEngine = 'internal' | 'n8n' | 'webhook' | 'manual_hold';

// ═══════════════════════════════════════════════════
// OUTPUT CHANNELS
// ═══════════════════════════════════════════════════

export type OutputChannel = 'email' | 'whatsapp' | 'chatbot' | 'voice' | 'crm' | 'internal_task';

// ═══════════════════════════════════════════════════
// EXECUTION MODE
// ═══════════════════════════════════════════════════

export type ExecutionMode = 'test' | 'live';

// ═══════════════════════════════════════════════════
// TRIGGER EVENTS
// ═══════════════════════════════════════════════════

export const TRIGGER_EVENTS = [
  'lead_created',
  'lead_qualified',
  'lead_unresponsive',
  'followup_due',
  'appointment_booked',
  'payment_failed',
  'payment_received',
  'customer_replied',
  'form_submitted',
  'high_intent_detected',
  'manual_trigger',
  'lead_submitted',
  'no_response_24h',
  'custom_event',
  // V2 engagement events
  'language_mismatch_detected',
  'festive_trigger',
  'region_based_opportunity',
] as const;

export type TriggerEvent = typeof TRIGGER_EVENTS[number];

// ═══════════════════════════════════════════════════
// EXECUTION RUN STATUSES
// ═══════════════════════════════════════════════════

export type RunStatus = 'queued' | 'running' | 'handed_off' | 'completed' | 'blocked' | 'failed';

// ═══════════════════════════════════════════════════
// BLOCK REASON CODES
// ═══════════════════════════════════════════════════

export type BlockReasonCode = 
  | 'WORKSPACE_INACTIVE'
  | 'AUTOMATION_NOT_EXECUTABLE'
  | 'INTEGRATION_UNHEALTHY'
  | 'INTEGRATION_MISSING'
  | 'ENGINE_NOT_CONFIGURED'
  | 'TRIGGER_MISMATCH'
  | 'NO_MATCHING_AUTOMATION'
  | 'EXECUTION_ERROR'
  | 'MANUAL_HOLD';

// ═══════════════════════════════════════════════════
// WORKSPACE EXECUTION GATING
// ═══════════════════════════════════════════════════

export const EXECUTION_ALLOWED_STATUSES = ['active', 'ready_for_activation'] as const;
export const EXECUTION_BLOCKED_STATUSES = [
  'signup_received', 
  'onboarding_not_started',
  'onboarding_submitted',
  'under_review', 
  'setup_in_progress',
  'paused', 
  'deactivated', 
  'restricted'
] as const;

// ═══════════════════════════════════════════════════
// ROUTER INPUT/OUTPUT TYPES
// ═══════════════════════════════════════════════════

export interface ExecutionRequest {
  business_id: string;
  event_type: TriggerEvent | string;
  entity_id?: string;
  payload?: Record<string, any>;
  trigger_context?: Record<string, any>;
  mode?: ExecutionMode;
}

export interface ExecutionResult {
  run_id: string;
  automation_id: string | null;
  status: RunStatus;
  engine: ExecutionEngine;
  channel: OutputChannel | string;
  blocked_reason?: string;
  blocked_code?: BlockReasonCode;
  handoff_reference?: string;
  response_payload?: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

// ═══════════════════════════════════════════════════
// ENGINE INTERFACES
// ═══════════════════════════════════════════════════

export interface EngineHandoffPayload {
  run_id: string;
  workspace_id: string;
  automation_id: string;
  automation_name: string;
  trigger_event: string;
  output_channel: string;
  mode: ExecutionMode;
  payload: Record<string, any>;
  timestamp: string;
}

export interface EngineResult {
  success: boolean;
  handoff_reference?: string;
  response_code?: number;
  response_body?: any;
  error?: string;
  duration_ms?: number;
}

// ═══════════════════════════════════════════════════
// CHANNEL INTERFACES
// ═══════════════════════════════════════════════════

export interface ChannelSendPayload {
  to?: string;
  subject?: string;
  body: string;
  template_id?: string;
  metadata?: Record<string, any>;
}

export interface ChannelIntegrationConfig {
  provider: string;
  api_key?: string;
  api_base_url?: string;
  webhook_url?: string;
  sender_id?: string;
  from_address?: string;
  auth_token?: string;
  config_json?: Record<string, any>;
}

export interface ChannelResult {
  success: boolean;
  provider_id?: string;
  error?: string;
  simulated: boolean;
  channel: string;
}

// ═══════════════════════════════════════════════════
// AUTOMATION ROW TYPE (DB shape)
// ═══════════════════════════════════════════════════

export interface AutomationRow {
  id: string;
  business_id: string;
  automation_name: string;
  automation_type: string;
  trigger_description?: string;
  trigger_event?: string;
  trigger_conditions_json?: Record<string, any>;
  output_channel: string;
  execution_engine: string;
  mode: string;
  required_integration_id?: string;
  required_integration_type?: string;
  fallback_action?: string;
  webhook_url?: string;
  workflow_id?: string;
  status: string;
  is_active: boolean;
  approved_by?: string;
  approved_at?: string;
  activated_at?: string;
  last_run_at?: string;
  last_run_status?: string;
  last_result?: string;
  run_count: number;
  health?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════
// INTEGRATION ROW TYPE (DB shape)
// ═══════════════════════════════════════════════════

export interface IntegrationRow {
  id: string;
  business_id: string;
  provider: string;
  integration_type?: string;
  status: string;
  health?: string;
  execution_mode?: string;
  webhook_url?: string;
  api_base_url?: string;
  connection_reference?: string;
  external_account_id?: string;
  last_tested_at?: string;
  last_test_result?: string;
  connected_at?: string;
  configured_by?: string;
  config_json?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}
