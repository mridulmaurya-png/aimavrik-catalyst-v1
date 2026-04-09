-- 20240409_execution_backbone.sql
-- AiMavrik Catalyst: Production Execution Backbone
-- Adds automation_runs, hardens client_automations & client_integrations

-------------------------------------------------------------------------------
-- 1. AUTOMATION RUNS (Execution Logs)
-- Core observability table for every automation execution
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    automation_id UUID REFERENCES public.client_automations(id) ON DELETE SET NULL,
    trigger_event TEXT NOT NULL,
    execution_engine TEXT NOT NULL DEFAULT 'internal',
    output_channel TEXT NOT NULL DEFAULT 'internal',
    mode TEXT NOT NULL DEFAULT 'test',
    status TEXT NOT NULL DEFAULT 'queued',
    blocked_reason TEXT,
    request_payload JSONB DEFAULT '{}'::jsonb,
    response_payload JSONB DEFAULT '{}'::jsonb,
    handoff_reference TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for automation_runs
CREATE INDEX IF NOT EXISTS idx_automation_runs_business ON public.automation_runs(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON public.automation_runs(created_at DESC);

-- RLS
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS. Tenant members can view their own runs.
CREATE POLICY "Members can view automation runs"
    ON public.automation_runs FOR SELECT
    USING (public.is_member(business_id));

CREATE POLICY "Service role full access on automation_runs"
    ON public.automation_runs FOR ALL
    USING (auth.role() = 'service_role');

-------------------------------------------------------------------------------
-- 2. HARDEN client_automations — Add execution fields if missing
-------------------------------------------------------------------------------

-- Execution trigger model fields
ALTER TABLE public.client_automations 
    ADD COLUMN IF NOT EXISTS trigger_event TEXT,
    ADD COLUMN IF NOT EXISTS trigger_conditions_json JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS output_channel TEXT DEFAULT 'internal',
    ADD COLUMN IF NOT EXISTS execution_engine TEXT DEFAULT 'internal',
    ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'test',
    ADD COLUMN IF NOT EXISTS required_integration_id UUID REFERENCES public.client_integrations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS required_integration_type TEXT,
    ADD COLUMN IF NOT EXISTS fallback_action TEXT DEFAULT 'block',
    ADD COLUMN IF NOT EXISTS webhook_url TEXT,
    ADD COLUMN IF NOT EXISTS workflow_id TEXT,
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_run_status TEXT,
    ADD COLUMN IF NOT EXISTS last_result TEXT,
    ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'unknown';

-------------------------------------------------------------------------------
-- 3. HARDEN client_integrations — Add execution health model fields
-------------------------------------------------------------------------------

ALTER TABLE public.client_integrations
    ADD COLUMN IF NOT EXISTS integration_type TEXT,
    ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'internal',
    ADD COLUMN IF NOT EXISTS webhook_url TEXT,
    ADD COLUMN IF NOT EXISTS api_base_url TEXT,
    ADD COLUMN IF NOT EXISTS connection_reference TEXT,
    ADD COLUMN IF NOT EXISTS external_account_id TEXT,
    ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_test_result TEXT,
    ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS configured_by TEXT;

-------------------------------------------------------------------------------
-- 4. OPS AUDIT LOG — Enhanced for execution backbone
-- We use the existing audit_logs table but ensure it supports ops actions.
-- No schema change needed — log_type + log_data_json covers everything.
-------------------------------------------------------------------------------

-- Ensure onboarding_submissions exists (may already exist from prior migrations)
CREATE TABLE IF NOT EXISTS public.onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_type TEXT,
    use_case TEXT,
    monthly_volume TEXT,
    channels TEXT[],
    lead_sources TEXT[],
    ai_voice_needed BOOLEAN DEFAULT false,
    ai_chatbot_needed BOOLEAN DEFAULT false,
    conversion_challenge TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure workspace_status_history exists
CREATE TABLE IF NOT EXISTS public.workspace_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure ops_notes exists
CREATE TABLE IF NOT EXISTS public.ops_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure client_automations exists with core columns
CREATE TABLE IF NOT EXISTS public.client_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    automation_name TEXT NOT NULL,
    automation_type TEXT NOT NULL,
    trigger_description TEXT,
    status TEXT DEFAULT 'draft',
    is_active BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure client_integrations exists with core columns
CREATE TABLE IF NOT EXISTS public.client_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'configured',
    config_json JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add status column to businesses if missing
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'signup_received',
    ADD COLUMN IF NOT EXISTS owner_email TEXT,
    ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'INR';

-- Updated_at trigger for automation_runs not needed (immutable logs)

-------------------------------------------------------------------------------
-- 5. STATUS CONSTRAINTS (CHECK constraints for data integrity)
-------------------------------------------------------------------------------

-- These are safe to add — they only validate future inserts/updates
DO $$
BEGIN
    -- automation_runs.status check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_automation_runs_status'
    ) THEN
        ALTER TABLE public.automation_runs 
            ADD CONSTRAINT chk_automation_runs_status 
            CHECK (status IN ('queued', 'running', 'handed_off', 'completed', 'blocked', 'failed'));
    END IF;

    -- automation_runs.mode check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_automation_runs_mode'
    ) THEN
        ALTER TABLE public.automation_runs 
            ADD CONSTRAINT chk_automation_runs_mode 
            CHECK (mode IN ('test', 'live'));
    END IF;
END $$;
