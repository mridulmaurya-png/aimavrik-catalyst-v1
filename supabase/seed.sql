-- Seed Data for AiMavrik Catalyst V1 Demo
-- Use this to initialize a clean "Live Founder Demo" tenant.

-- NOTE: You must have a user in auth.users first. 
-- Replace '00000000-0000-0000-0000-000000000000' with a real user ID from your project.

-- 1. Create Demo Business
INSERT INTO public.businesses (id, owner_user_id, business_name, business_type, industry, timezone)
VALUES (
    'd1111111-1111-1111-1111-111111111111', 
    'b2dab884-efd7-4166-bf05-f9aa11976cfb', 
    'Catalyst Demo AiMavrik', 
    'SaaS', 
    'Marketing Tech', 
    'Asia/Kolkata'
) ON CONFLICT (id) DO NOTHING;

-- 2. Link User to Business
INSERT INTO public.team_members (business_id, user_id, role)
VALUES (
    'd1111111-1111-1111-1111-111111111111', 
    'b2dab884-efd7-4166-bf05-f9aa11976cfb', 
    'owner'
) ON CONFLICT DO NOTHING;

-- 3. Initialize Settings
INSERT INTO public.business_settings (business_id, brand_voice_json)
VALUES (
    'd1111111-1111-1111-1111-111111111111', 
    '{"tone": "Professional", "style": "Action-oriented"}'
) ON CONFLICT DO NOTHING;

-- 4. Create Demo Contact
INSERT INTO public.contacts (id, business_id, full_name, email, phone, source, stage)
VALUES (
    'c2222222-2222-2222-2222-222222222222', 
    'd1111111-1111-1111-1111-111111111111', 
    'Demo Lead', 
    'hello@aimavrik.com', 
    '+91 9935038315', 
    'Inbound Webhook', 
    'new'
) ON CONFLICT (id) DO NOTHING;

-- 5. Activate a Playbook
INSERT INTO public.playbooks (id, business_id, playbook_type, is_active, config_json)
VALUES (
    '33333333-3333-3333-3333-333333333333', 
    'd1111111-1111-1111-1111-111111111111', 
    'New Lead Instant Follow-up', 
    true, 
    '{"initial_delay": 0}'
) ON CONFLICT (id) DO NOTHING;
