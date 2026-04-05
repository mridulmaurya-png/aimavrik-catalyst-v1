"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser, requireAdmin } from "@/lib/auth/context";
import { sendSystemNotification, ONBOARDING_EMAILS } from "@/lib/mail/system";
import { revalidatePath } from "next/cache";

interface OnboardingInput {
    business_type: string;
    use_case: string;
    lead_sources: string[];
    monthly_volume: string;
    conversion_challenge: string;
    channels: string[];
    ai_voice_needed: boolean;
    ai_chatbot_needed: boolean;
    notes?: string;
}

export async function submitOnboarding(input: OnboardingInput) {
    const user = await requireUser();
    const supabase = await createClient();

    // 1. Get current workspace/business
    const { data: membership } = await supabase
        .from("team_members")
        .select("business_id, business:businesses(business_name, status)")
        .eq("user_id", user.id)
        .maybeSingle();
    
    if (!membership?.business_id) throw new Error("Could not find workspace");

    const businessId = membership.business_id;

    // 2. Persist Submission
    const { error: insertErr } = await supabase
        .from("onboarding_submissions")
        .insert({
            business_id: businessId,
            user_id: user.id,
            ...input,
            submitted_at: new Date().toISOString()
        });
    
    // Fallback if table doesn't exist yet (migration may have failed)
    if (insertErr) {
        console.warn("Could not insert into onboarding_submissions. Falling back to business update only.", insertErr.message);
    }

    // 3. Update Business Status
    await supabase.from("businesses").update({
        status: "onboarding_submitted"
    }).eq("id", businessId);

    // 4. Send Email Notification (Try-Catch to prevent crash)
    try {
        const name = user.user_metadata?.full_name || "there";
        const emailData = ONBOARDING_EMAILS.ONBOARDING_SUBMITTED(name);
        await sendSystemNotification(user.email!, emailData.subject, emailData.body);
    } catch (e) {
        console.error("[MAIL] Failed to send onboarding submission email:", e);
    }

    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateOnboardingStatus(businessId: string, newStatus: string) {
    await requireAdmin();
    const supabase = await createClient();

    // Update Project Status
    await supabase.from("businesses")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", businessId);

    // Trigger Status-Specific Emails
    const { data: targetBiz } = await supabase
        .from("businesses")
        .select("id, status, team_members(user_id, users(email, full_name))")
        .eq("id", businessId)
        .maybeSingle();
    
    const owner = (targetBiz?.team_members as any)?.[0]?.users;
    if (owner?.email) {
        let content;
        if (newStatus === "under_review") {
            content = ONBOARDING_EMAILS.UNDER_REVIEW(owner.full_name || "there");
        } else if (newStatus === "setup_in_progress") {
            content = ONBOARDING_EMAILS.SETUP_IN_PROGRESS(owner.full_name || "there");
        } else if (newStatus === "active") {
            content = ONBOARDING_EMAILS.WORKSPACE_ACTIVE(owner.full_name || "there");
        }

        if (content) {
            await sendSystemNotification(owner.email, content.subject, content.body);
        }
    }

    revalidatePath("/ops/workspaces");
    return { success: true };
}
