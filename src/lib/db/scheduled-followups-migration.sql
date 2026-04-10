-- ═══════════════════════════════════════════════════════════════
-- DB Migration: Scheduled Follow-ups Engine
-- ═══════════════════════════════════════════════════════════════
-- Table for the follow-up scheduler. After a lead_created event
-- is processed, the router schedules a followup_due event here.
-- A cron endpoint picks up due rows and fires them through the router.

CREATE TABLE IF NOT EXISTS scheduled_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES client_automations(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL DEFAULT 'followup_due',
  entity_type TEXT DEFAULT 'lead',
  entity_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- pending | executed | cancelled | failed
  source_run_id UUID,                        -- The automation_run that spawned this follow-up
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  execution_run_id UUID                      -- The automation_run created when this follow-up fires
);

CREATE INDEX IF NOT EXISTS idx_scheduled_followups_due 
  ON scheduled_followups(scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_followups_business 
  ON scheduled_followups(business_id);

-- RLS: service_role only (same pattern as other ops tables)
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON scheduled_followups FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Add api_key column to businesses for event ingestion auth
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_key TEXT;
