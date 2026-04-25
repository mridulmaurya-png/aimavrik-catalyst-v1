import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { guardAdminRoute } from "@/lib/api/guard";

// Endpoint: GET /api/admin/actions
// Returns recent execution traces for debugging. Protected route.
export async function GET(req: Request) {
  try {
    // Security: Validate Bearer token + origin restriction
    const authError = guardAdminRoute(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("actions").select("*, playbook:playbooks(playbook_type)").order("created_at", { ascending: false }).limit(limit);
    if (businessId) query = query.eq("business_id", businessId);

    const { data: actions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, count: actions?.length || 0 }, { status: 200 });
  } catch (err: any) {
    console.error("[Admin:Actions] Error:", err.message);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
