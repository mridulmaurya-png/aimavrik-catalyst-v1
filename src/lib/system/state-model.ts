import { createClient } from "@/lib/supabase/server";

export type UserState = "unauthenticated" | "authenticated_unverified" | "authenticated_verified";
export type WorkspaceState = "no_workspace" | "onboarding_in_progress" | "onboarding_complete";
export type ChannelState = "no_channel_connected" | "email_connected" | "whatsapp_demo_connected" | "webhook_connected" | "multiple_connected";
export type PlaybookState = "no_playbook" | "playbook_active";
export type DemoState = "not_demo_ready" | "demo_ready";

export interface SystemState {
  userState: UserState;
  workspaceState: WorkspaceState;
  channelState: ChannelState;
  playbookState: PlaybookState;
  demoState: DemoState;
  
  // Data Payload
  userId: string | null;
  businessId: string | null;
  onboardingStep: number;
  channels: string[];
  activePlaybookId: string | null;
}

/**
 * Single source of truth for resolving the deterministic state 
 * of a tenant within Catalyst V1.
 */
export async function getSystemState(): Promise<SystemState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      userState: "unauthenticated",
      workspaceState: "no_workspace",
      channelState: "no_channel_connected",
      playbookState: "no_playbook",
      demoState: "not_demo_ready",
      userId: null,
      businessId: null,
      onboardingStep: 0,
      channels: [],
      activePlaybookId: null
    };
  }

  // Supabase auth handles verification locally via user metadata or identities, 
  // but standard successful getUser() with confirmed_at means verified.
  const isVerified = !!user.email_confirmed_at;
  const userState: UserState = isVerified ? "authenticated_verified" : "authenticated_unverified";

  // Check Workspace Attachment
  const { data: membership } = await supabase
    .from("team_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.business_id) {
    return {
      userState,
      workspaceState: "no_workspace",
      channelState: "no_channel_connected",
      playbookState: "no_playbook",
      demoState: "not_demo_ready",
      userId: user.id,
      businessId: null,
      onboardingStep: 1, // Start of onboarding
      channels: [],
      activePlaybookId: null
    };
  }

  const businessId = membership.business_id;

  // Derive Onboarding Step & Channels
  let step = 2; // Workspace created

  const { data: settings } = await supabase
    .from("business_settings")
    .select("cta_preferences_json")
    .eq("business_id", businessId)
    .maybeSingle();

  const ctaPrefs = settings?.cta_preferences_json as any;
  const channelAssigned = ctaPrefs?.channel;

  const { data: integrations } = await supabase
    .from("integrations")
    .select("provider")
    .eq("business_id", businessId);
  
  const sources = integrations?.map(i => i.provider) || [];
  
  if (channelAssigned) step = 3;
  if (sources.length > 0) step = 4;

  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const hasPlaybook = !!playbooks;
  if (hasPlaybook) step = 5;

  const { data: auditLog } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("business_id", businessId)
    .eq("log_type", "ONBOARDING_COMPLETED")
    .limit(1)
    .maybeSingle();

  const isComplete = !!auditLog;
  if (isComplete) step = 6;

  const workspaceState: WorkspaceState = isComplete ? "onboarding_complete" : "onboarding_in_progress";

  let channelState: ChannelState = "no_channel_connected";
  let channels = [...sources];
  if (channelAssigned) channels.push(channelAssigned);
  
  // Hardening: Ensure channels contains no undefined/null values
  channels = channels.filter(c => typeof c === 'string' && c.length > 0);

  if (channels.includes('email') && channels.includes('whatsapp')) channelState = "multiple_connected";
  else if (channels.includes('email')) channelState = "email_connected";
  else if (channels.includes('whatsapp')) channelState = "whatsapp_demo_connected";
  else if (channels.length > 0) channelState = "webhook_connected";

  const playbookState: PlaybookState = hasPlaybook ? "playbook_active" : "no_playbook";
  const demoState: DemoState = workspaceState === "onboarding_complete" ? "demo_ready" : "not_demo_ready";

  return {
    userState,
    workspaceState,
    channelState,
    playbookState,
    demoState,
    userId: user.id,
    businessId,
    onboardingStep: step,
    channels,
    activePlaybookId: playbooks?.id || null
  };
}
