-- 20240326_init_schema.sql
-- AiMavrik Catalyst V1: Multi-tenant Data Model

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 1. TABLES
-------------------------------------------------------------------------------

-- USERS (Extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BUSINESSES (Tenants)
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id),
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL, -- 'D2C', 'Service'
    industry TEXT,
    website TEXT,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    support_email TEXT,
    support_phone TEXT,
    tone_profile TEXT, -- e.g., 'Sharp/Professional'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- BUSINESS SETTINGS (Workspace configuration)
CREATE TABLE public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    communication_hours_json JSONB DEFAULT '{}'::jsonb,
    quiet_hours_json JSONB DEFAULT '{}'::jsonb,
    default_whatsapp_number TEXT,
    default_sender_email TEXT,
    brand_voice_json JSONB DEFAULT '{}'::jsonb,
    cta_preferences_json JSONB DEFAULT '{}'::jsonb,
    followup_rules_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TEAM MEMBERS (Multi-tenant linkage)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'operator', -- 'owner', 'admin', 'operator', 'viewer'
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(business_id, user_id)
);

-- INTEGRATIONS
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'webhook', 'shopify', 'hubspot', etc.
    status TEXT NOT NULL DEFAULT 'active',
    config_json JSONB DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- CONTACTS (Unified Lead/Customer Profile)
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT,
    contact_type TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'customer'
    stage TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'engaged', etc.
    tags_json JSONB DEFAULT '[]'::jsonb,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    last_event_at TIMESTAMPTZ,
    last_action_at TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- EVENTS (Incoming signals)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    payload_json JSONB DEFAULT '{}'::jsonb,
    dedupe_key TEXT,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processed', 'failed', 'ignored'
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PLAYBOOKS (Automation Definitions)
CREATE TABLE public.playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    playbook_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    config_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- ACTIONS (Discrete executions triggered by Playbooks)
CREATE TABLE public.actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    playbook_id UUID REFERENCES public.playbooks(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'send_whatsapp', 'send_email', etc.
    channel TEXT,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'sent', 'failed', 'cancelled', 'completed'
    payload_json JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MESSAGES (Lower-level communication history, 1:N with actions)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    action_id UUID REFERENCES public.actions(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- 'whatsapp', 'email'
    subject TEXT,
    body TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed'
    clicked BOOLEAN DEFAULT false,
    replied BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CONVERSIONS (Drives Results/Revenue)
CREATE TABLE public.conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    source_action_id UUID REFERENCES public.actions(id) ON DELETE SET NULL,
    conversion_type TEXT NOT NULL, -- 'booking', 'purchase', etc.
    amount NUMERIC(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'INR' NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AUDIT LOGS (Immutable record)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    action_id UUID REFERENCES public.actions(id) ON DELETE SET NULL,
    log_type TEXT NOT NULL,
    log_data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 2. INDEXES & CONSTRAINTS
-------------------------------------------------------------------------------

-- Contact Deduplication Indexes
CREATE UNIQUE INDEX idx_contacts_business_email ON public.contacts (business_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_contacts_business_phone ON public.contacts (business_id, phone) WHERE phone IS NOT NULL;

-- Performance Indexes
CREATE INDEX idx_contacts_business_id ON public.contacts(business_id);
CREATE INDEX idx_events_business_id ON public.events(business_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_actions_business_id ON public.actions(business_id);
CREATE INDEX idx_actions_status ON public.actions(status);
CREATE INDEX idx_messages_business_id ON public.messages(business_id);
CREATE INDEX idx_conversions_business_id ON public.conversions(business_id);
CREATE INDEX idx_audit_logs_business_id ON public.audit_logs(business_id);

-------------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-------------------------------------------------------------------------------

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_playbooks_updated_at BEFORE UPDATE ON public.playbooks FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
