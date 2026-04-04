-- 20240326_rls_policies.sql
-- AiMavrik Catalyst V1: Multi-tenant Security Layer

-------------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-------------------------------------------------------------------------------

-- Check if user is member of a business
CREATE OR REPLACE FUNCTION public.is_member(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.business_id = $1
        AND team_members.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------------------------------
-- 3. POLICIES
-------------------------------------------------------------------------------

-- USERS
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- BUSINESSES
CREATE POLICY "Members can view their business"
    ON public.businesses FOR SELECT
    USING (public.is_member(id));

CREATE POLICY "Owners can update their business"
    ON public.businesses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.business_id = businesses.id
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'owner'
        )
    );

-- BUSINESS SETTINGS
CREATE POLICY "Members can view settings"
    ON public.business_settings FOR SELECT
    USING (public.is_member(business_id));

CREATE POLICY "Admin/Owners can update settings"
    ON public.business_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.business_id = business_settings.business_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

-- TEAM MEMBERS
CREATE POLICY "Members can view fellow team members"
    ON public.team_members FOR SELECT
    USING (public.is_member(business_id));

-- CONTACTS
CREATE POLICY "Members can view contacts"
    ON public.contacts FOR SELECT
    USING (public.is_member(business_id));

CREATE POLICY "Members can insert contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (public.is_member(business_id));

CREATE POLICY "Members can update contacts"
    ON public.contacts FOR UPDATE
    USING (public.is_member(business_id));

-- EVENTS
CREATE POLICY "Members can view events"
    ON public.events FOR SELECT
    USING (public.is_member(business_id));

-- PLAYBOOKS
CREATE POLICY "Members can view playbooks"
    ON public.playbooks FOR SELECT
    USING (public.is_member(business_id));

-- ACTIONS
CREATE POLICY "Members can view actions"
    ON public.actions FOR SELECT
    USING (public.is_member(business_id));

-- MESSAGES
CREATE POLICY "Members can view messages"
    ON public.messages FOR SELECT
    USING (public.is_member(business_id));

-- CONVERSIONS
CREATE POLICY "Members can view conversions"
    ON public.conversions FOR SELECT
    USING (public.is_member(business_id));

-- AUDIT LOGS (INSERT ONLY)
CREATE POLICY "Members can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_member(business_id));

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_member(business_id));

-- Ensure no updates/deletes on audit logs
-- (Omitted update/delete policies implicitly deny)

-------------------------------------------------------------------------------
-- 4. AUTH TRIGGERS
-------------------------------------------------------------------------------

-- Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
