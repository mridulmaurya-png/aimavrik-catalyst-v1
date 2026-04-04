import { NextResponse } from "next/server";
import { processIncomingEvent } from "@/lib/engine/orchestrator";

// Endpoint: POST /api/admin/simulate-event
// Protected internal sandbox trigger to mock incoming events bypassing standard webhook guards
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_EXECUTION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized Sandbox Access" }, { status: 401 });
    }

    const payload = await req.json();
    const businessId = payload.business_id;
    const source = payload.source || "sandbox-simulator";

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Missing business_id in simulation payload" }, { status: 400 });
    }

    // Force unique dedup string for tests unless explicitly testing duplicate logic
    if (payload._force_unique) {
      payload.id = `sim_${Date.now()}_${Math.random()}`;
    }

    const result = await processIncomingEvent(businessId, payload, source);

    return NextResponse.json({
      success: true,
      simulation: "complete",
      details: result
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
