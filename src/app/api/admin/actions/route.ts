import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint: GET /api/admin/actions
// Returns recent execution traces for debugging. Protected route.
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_EXECUTION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (authHeader !== `Bearer ${secret}`) {
       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("actions").select("*, playbook:playbooks(playbook_type)").order("created_at", { ascending: false }).limit(limit);
    if (businessId) query = query.eq("business_id", businessId);

    const { data: actions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, actions }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
