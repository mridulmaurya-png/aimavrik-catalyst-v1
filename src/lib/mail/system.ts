import { sendEmail } from "@/lib/execution/delivery";

/**
 * System-level mailer for onboarding and transactional notifications.
 * Uses the global RESEND_API_KEY when available, or simulates delivery.
 */
export async function sendSystemNotification(to: string, subject: string, body: string) {
  const config = {
    resend_api_key: process.env.RESEND_API_KEY,
    default_sender_email: "AiMavrik Catalyst <no-reply@catalyst.aimavrik.com>" // Fallback if not configured in Resend
  };

  // We set forceSimulate=false to attempt real delivery if key exists
  const result = await sendEmail({ to, subject, body }, config, !process.env.RESEND_API_KEY);
  
  if (!result.success) {
    console.error(`[SYSTEM MAIL] Failed to send to ${to}: ${result.error}`);
  }
  
  return result;
}

const EMAIL_FOOTER = "\n\n---\nThis is an automated AiMavrik Catalyst email. For help, contact hello@aimavrik.com.";

export const ONBOARDING_EMAILS = {
  SIGNUP_RECEIVED: (name: string) => ({
    subject: "Your AiMavrik workspace request has been received",
    body: `Hi ${name},\n\nWelcome to AiMavrik Catalyst.\n\nYour workspace signup has been received. To begin your managed revenue orchestration setup, please complete the onboarding requirements form in your dashboard. Our Ops team will then begin configuring your AI engines.\n\nBest,\nThe AiMavrik Team` + EMAIL_FOOTER
  }),
  ONBOARDING_SUBMITTED: (name: string) => ({
    subject: "We've received your revenue system requirements",
    body: `Hi ${name},\n\nThank you for submitting your onboarding requirements.\n\nAiMavrik Ops is now reviewing your lead sources and conversion challenges. We will notify you as soon as your initial setup transitions into active configuration.\n\nBest,\nThe AiMavrik Team` + EMAIL_FOOTER
  }),
  UNDER_REVIEW: (name: string) => ({
    subject: "Your AiMavrik onboarding is under review",
    body: `Hi ${name},\n\nYour revenue requirements are now being reviewed by AiMavrik Ops. We are analyzing your target channels and conversion goals to ensure high-fidelity orchestration.\n\nWe will move your workspace into "System Setup" shortly.\n\nBest,\nThe AiMavrik Team` + EMAIL_FOOTER
  }),
  SETUP_IN_PROGRESS: (name: string) => ({
    subject: "Your AiMavrik setup is now in progress",
    body: `Hi ${name},\n\nGood news — your request has been approved and our team is currently configuring your AI lead capture and follow-up engines.\n\nYou can track the progress live in your Catalyst dashboard.\n\nBest,\nThe AiMavrik Team` + EMAIL_FOOTER
  }),
  WORKSPACE_ACTIVE: (name: string) => ({
    subject: "Your AiMavrik workspace is now active",
    body: `Hi ${name},\n\nYour AiMavrik Catalyst workspace is now fully active.\n\nYou can now trigger revenue automation, manage contacts, and monitor real-time orchestration.\n\nLog in now: ${process.env.NEXT_PUBLIC_APP_URL || 'https://catalyst.aimavrik.com'}\n\nBest,\nThe AiMavrik Team` + EMAIL_FOOTER
  })
};
