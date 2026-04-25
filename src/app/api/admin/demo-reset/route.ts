import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resetDemoTenant } from "@/lib/admin/demo-helper";
import { guardAdminRoute } from "@/lib/api/guard";

// Endpoint: POST /api/admin/demo-reset
// Hidden utility for founder demos to reset the board cleanly.
export async function POST(req: Request) {
  try {
    // Security: Validate Bearer token + origin restriction
    const authError = guardAdminRoute(req);
    if (authError) return authError;

    const body = await req.json().catch(() => ({}));
    const businessId = body.business_id;

    if (!businessId) {
       return NextResponse.json({ success: false, error: "business_id required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await resetDemoTenant(supabase, businessId);

    return NextResponse.json({ success: true, status: "reset_complete" }, { status: 200 });
  } catch (err: any) {
    console.error("[Admin:DemoReset] Error:", err.message);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
