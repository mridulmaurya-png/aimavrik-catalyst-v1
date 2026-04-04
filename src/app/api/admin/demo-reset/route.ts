import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resetDemoTenant } from "@/lib/admin/demo-helper";

// Endpoint: POST /api/admin/demo-reset
// Hidden utility for founder demos to reset the board cleanly.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_EXECUTION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (authHeader !== `Bearer ${secret}`) {
       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = body.business_id;

    if (!businessId) {
       return NextResponse.json({ success: false, error: "business_id required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await resetDemoTenant(supabase, businessId);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
