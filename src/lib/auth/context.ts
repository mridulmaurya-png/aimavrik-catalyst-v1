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
    .select("business_id, role, businesses(id, business_name, business_type, website, timezone, currency_code)")
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
    currencyCode: biz?.currency_code || 'INR'
  };
}
