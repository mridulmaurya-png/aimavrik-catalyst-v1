-- ═══════════════════════════════════════════════════════════════
-- DB Migration: Execution Linkage + Activation Layer
-- ═══════════════════════════════════════════════════════════════

-- 1. Extend client_integrations for real execution connectivity
ALTER TABLE client_integrations 
ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'internal', -- internal | n8n | external_api
ADD COLUMN IF NOT EXISTS connection_reference TEXT,            -- Slug or ID for connection mapping
ADD COLUMN IF NOT EXISTS webhook_url TEXT,                      -- For callback or ingestion
ADD COLUMN IF NOT EXISTS api_base_url TEXT,                     -- Base URL if external API
ADD COLUMN IF NOT EXISTS external_account_id TEXT,              -- Reference in external system
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_test_result TEXT,
ADD COLUMN IF NOT EXISTS configured_by TEXT;                    -- Admin email

-- 2. Extend client_automations for managed execution mapping
ALTER TABLE client_automations
ADD COLUMN IF NOT EXISTS trigger_event TEXT,                    -- lead_submitted, no_response, etc.
ADD COLUMN IF NOT EXISTS execution_engine TEXT DEFAULT 'internal', -- n8n | internal | external_webhook
ADD COLUMN IF NOT EXISTS webhook_url TEXT,                      -- Target workflow endpoint
ADD COLUMN IF NOT EXISTS workflow_id TEXT,                      -- Internal or n8n workflow ID
ADD COLUMN IF NOT EXISTS output_channel TEXT DEFAULT 'internal', -- email | whatsapp | voice | chatbot | internal
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',           -- draft | review | approved | active | paused | blocked
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS fallback_action TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. Cleanup: Ensure initial status mapping for existing automations
UPDATE client_automations SET status = 'active' WHERE is_active = true AND status = 'draft';
UPDATE client_automations SET status = 'paused' WHERE is_active = false AND status = 'draft';

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_client_automations_status ON client_automations(status);
CREATE INDEX IF NOT EXISTS idx_client_automations_trigger ON client_automations(trigger_event);
