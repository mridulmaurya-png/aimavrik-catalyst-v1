/**
 * DB Migration: Ops Production Tables
 * 
 * Run this against Supabase SQL Editor to create the ops tables.
 * Tables: client_integrations, client_automations, ops_notes, workspace_status_history
 * 
 * These tables use service_role or admin-level access only.
 * No RLS policies needed — ops tables are accessed via server actions with requireAdmin().
 */

-- ═══════════════════════════════════════════════════════════════
-- 1. CLIENT INTEGRATIONS — Per-client integration registry
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS client_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,           -- crm, email, whatsapp, shopify, payment, csv_import, webhook, n8n, custom
  provider TEXT,                            -- HubSpot, Resend, Meta Cloud API, etc.
  status TEXT NOT NULL DEFAULT 'disconnected', -- connected, configured, disconnected, error
  health TEXT DEFAULT 'unknown',             -- healthy, degraded, critical, unknown
  config_json JSONB DEFAULT '{}'::jsonb,    -- Provider-specific config (non-sensitive)
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_integrations_business ON client_integrations(business_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. CLIENT AUTOMATIONS — Per-client automation registry
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS client_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  automation_name TEXT NOT NULL,
  automation_type TEXT NOT NULL,           -- lead_scoring, lead_routing, abandoned_recovery, etc.
  trigger_description TEXT,                -- Human-readable trigger description
  is_active BOOLEAN DEFAULT false,
  mode TEXT DEFAULT 'test',                -- test, live
  approved_by TEXT,                        -- Admin email who approved
  approved_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_result TEXT,                        -- success, failed, skipped, etc.
  health TEXT DEFAULT 'unknown',            -- healthy, degraded, critical, unknown
  config_json JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_automations_business ON client_automations(business_id);

-- ═══════════════════════════════════════════════════════════════
-- 3. OPS NOTES — Internal operator notes per workspace
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ops_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_notes_business ON ops_notes(business_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. WORKSPACE STATUS HISTORY — Audit trail of lifecycle changes
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspace_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,                -- Admin email
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_workspace_status_history_business ON workspace_status_history(business_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. Add owner_email to businesses if not exists
-- ═══════════════════════════════════════════════════════════════
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE businesses ADD COLUMN owner_email TEXT;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 6. Disable RLS on ops tables (server-only access via service role)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE client_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON client_integrations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE client_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON client_automations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ops_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON ops_notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workspace_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON workspace_status_history FOR ALL USING (true) WITH CHECK (true);
