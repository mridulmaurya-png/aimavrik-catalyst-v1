-- ═══════════════════════════════════════════════════════════════
-- CATALYST V2 SAFE UPGRADE — COMBINED MIGRATION
-- All new fields are NULLABLE. No existing columns touched.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- PHASE 1: Language & Region on contacts + events
-- ═══════════════════════════════════════════════════

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS region TEXT;

-- events table may not have these
ALTER TABLE events ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS region TEXT;

ALTER TABLE client_integrations ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb;

-- ═══════════════════════════════════════════════════
-- PHASE 2: Automation language support
-- ═══════════════════════════════════════════════════

ALTER TABLE client_automations ADD COLUMN IF NOT EXISTS supported_languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_automations ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en';

-- ═══════════════════════════════════════════════════
-- PHASE 1: Feature Flags per workspace
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, flag_key)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'feature_flags'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON feature_flags;
END IF;

CREATE POLICY "service_role_full_access" ON feature_flags
FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ═══════════════════════════════════════════════════
-- PHASE 3: Insights table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low',      -- low | medium | high | critical
  message TEXT NOT NULL,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'open',       -- open | acknowledged | acted | dismissed
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acted_at TIMESTAMPTZ,
  acted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_insights_business ON insights(business_id);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(business_id, status);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'insights'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON insights;
END IF;

CREATE POLICY "service_role_full_access" ON insights
FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ═══════════════════════════════════════════════════
-- PHASE 6: Festival calendar
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS festival_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  festival_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message_type TEXT DEFAULT 'greeting',      -- greeting | offer | reminder
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_region_dates ON festival_calendar(region, start_date, end_date);

ALTER TABLE festival_calendar ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'festival_calendar'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON festival_calendar;
END IF;

CREATE POLICY "service_role_full_access" ON festival_calendar
FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ═══════════════════════════════════════════════════
-- PHASE 3: Voice Call Logs
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id TEXT,
  status TEXT NOT NULL, -- initiated, answered, failed
  duration INT DEFAULT 0,
  provider TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_logs_business ON voice_call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_lead ON voice_call_logs(lead_id);

ALTER TABLE voice_call_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'voice_call_logs'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON voice_call_logs;
END IF;

CREATE POLICY "service_role_full_access" ON voice_call_logs
FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ═══════════════════════════════════════════════════
-- REVENUE INTELLIGENCE LAYER (Phase 1, 2, 6, 7)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id TEXT,
  amount NUMERIC DEFAULT 0,
  source TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'revenue_events'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON revenue_events;
END IF;

CREATE POLICY "service_role_full_access" ON revenue_events
FOR ALL USING (true) WITH CHECK (true);
END $$;

CREATE TABLE IF NOT EXISTS revenue_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id TEXT,
  channel TEXT,
  automation_id UUID REFERENCES client_automations(id) ON DELETE SET NULL,
  attributed_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revenue_attribution ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'revenue_attribution'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON revenue_attribution;
END IF;

CREATE POLICY "service_role_full_access" ON revenue_attribution
FOR ALL USING (true) WITH CHECK (true);
END $$;

CREATE TABLE IF NOT EXISTS target_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  segment_type TEXT,
  rules JSONB DEFAULT '[]'::jsonb,
  audience_size INT DEFAULT 0,
  potential_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE target_segments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'target_segments'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON target_segments;
END IF;

CREATE POLICY "service_role_full_access" ON target_segments
FOR ALL USING (true) WITH CHECK (true);
END $$;

CREATE TABLE IF NOT EXISTS campaign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES target_segments(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  requested_by TEXT,
  ops_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaign_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'campaign_requests'
AND policyname = 'service_role_full_access'
) THEN
DROP POLICY "service_role_full_access" ON campaign_requests;
END IF;

CREATE POLICY "service_role_full_access" ON campaign_requests
FOR ALL USING (true) WITH CHECK (true);
END $$;
