-- 20240426_lead_responses.sql
-- CRM Sync: Lead Response Tracking

-- LEAD RESPONSES — stores every inbound reply from leads
CREATE TABLE public.lead_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms', 'voice'
    sentiment TEXT, -- 'interested', 'not_interested', 'engaged', null
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add last_response_at to contacts table for quick access
ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;

-- Performance indexes
CREATE INDEX idx_lead_responses_business_id ON public.lead_responses(business_id);
CREATE INDEX idx_lead_responses_lead_id ON public.lead_responses(lead_id);
CREATE INDEX idx_lead_responses_created_at ON public.lead_responses(created_at DESC);
CREATE INDEX idx_contacts_last_response_at ON public.contacts(last_response_at DESC) WHERE last_response_at IS NOT NULL;

-- RLS Policies
ALTER TABLE public.lead_responses ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for API routes)
CREATE POLICY "Service role full access on lead_responses"
    ON public.lead_responses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read responses for their workspace
CREATE POLICY "Users can read own workspace responses"
    ON public.lead_responses
    FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT tm.business_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
        )
    );
