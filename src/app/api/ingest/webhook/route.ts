import { NextResponse } from "next/server";
import { processIncomingEvent } from "@/lib/engine/orchestrator";

// Endpoint: POST /api/ingest/webhook
// This handles public event ingestion securely mapped to a resolved business.
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 1. Business Resolution
    // In production securely resolve: e.g., via Authorization header (secret map), 
    // or payload.tenant_id, or dynamic slug.
    const businessId = payload.business_id || payload.tenant_id || payload.account_id;
    const source = payload.source || "webhook";

    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing Business Resolution",
        message: "Payload must contain a valid business_id or tenant_id."
      }, { status: 400 });
    }

    // 2. Trigger Event Orchestration 
    // This executes normalization, deduplication, contact upsert, and rule evaluation.
    // It returns rapidly with metrics on what actions were created downstream.
    const result = await processIncomingEvent(businessId, payload, source);

    if (result.status === "duplicate") {
      return NextResponse.json({
        success: true,
        status: "duplicate",
        message: "Duplicate event detected and safely dropped.",
        details: result
      }, { status: 200 }); // Return 200 so webhooks don't retry endlessly
    }

    if (result.status === "error") {
       return NextResponse.json({
        success: false,
        error: "Processing Error",
        message: result.message
      }, { status: 500 });
    }

    // 3. Provide deterministic response shape for machine tracking
    return NextResponse.json({
      success: true,
      status: "processed",
      details: {
        event_id: result.event_id,
        contact_id: result.contact_id,
        matched_playbooks: result.matched_playbooks,
        actions_created: result.actions_created
      }
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: "Invalid Payload",
      message: err.message || "Failed to parse JSON body"
    }, { status: 400 });
  }
}
