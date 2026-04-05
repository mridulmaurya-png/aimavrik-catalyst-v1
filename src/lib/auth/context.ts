import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }
  
  return user;
}

export async function requireWorkspace() {
  const user = await requireUser();
  const supabase = await createClient();
  
  const { data: membership, error } = await supabase
    .from("team_members")
    .select("business_id, role, businesses(id, business_name, business_type, website, timezone, currency_code, status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membership || !membership.business_id) {
    redirect("/onboarding");
  }

  const biz = Array.isArray(membership.businesses) ? membership.businesses[0] : membership.businesses;

  return {
    user,
    businessId: membership.business_id,
    role: membership.role,
    business: biz,
    currencyCode: (biz as any)?.currency_code || 'INR',
    businessStatus: (biz as any)?.status || 'signup_received'
  };
}

/**
 * Strict internal access gate for AiMavrik Ops.
 * Uses ADMIN_EMAILS environment variable for authorization.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  
  const isInternal = user.email && adminEmails.includes(user.email.toLowerCase());
  
  if (!isInternal) {
    console.warn(`[AUTH] Unauthorized ops access attempt by ${user.email}`);
    redirect("/dashboard");
  }

  return user;
}
