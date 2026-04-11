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
CREATE POLICY "service_role_full_access" ON feature_flags FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "service_role_full_access" ON insights FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "service_role_full_access" ON festival_calendar FOR ALL USING (true) WITH CHECK (true);
