import { NextResponse } from "next/server";
import { processIncomingEvent } from "@/lib/engine/orchestrator";
import { guardAdminRoute } from "@/lib/api/guard";

// Endpoint: POST /api/admin/simulate-event
// Protected internal sandbox trigger to mock incoming events bypassing standard webhook guards
export async function POST(req: Request) {
  try {
    // Security: Validate Bearer token + origin restriction
    const authError = guardAdminRoute(req);
    if (authError) return authError;

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
      status: "ok"
    }, { status: 200 });

  } catch (err: any) {
    console.error("[Admin:SimulateEvent] Error:", err.message);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
