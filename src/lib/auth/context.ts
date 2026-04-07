import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminEmail } from "./admin";

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
  
  // 1. Admin Bypass
  if (isAdminEmail(user.email)) {
    redirect("/ops/workspaces");
  }

  const supabase = await createClient();
  
  const { data: membership, error } = await supabase
    .from("team_members")
    .select("business_id, role, businesses(id, business_name, business_type, website, timezone, currency_code, status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membership || !membership.business_id) {
    return {
      user,
      businessId: null,
      role: null,
      business: null,
      currencyCode: 'INR',
      businessStatus: 'onboarding_not_started'
    };
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

export async function requireAdmin() {
  const user = await requireUser();
  
  if (!isAdminEmail(user.email)) {
    console.warn(`[AUTH] Unauthorized ops access attempt by ${user.email}`);
    redirect("/dashboard");
  }

  return user;
}
