import { NextResponse } from "next/server";
import { runExecutionCycle } from "@/lib/execution/runner";
import { guardAdminRoute } from "@/lib/api/guard";

// Endpoint: POST /api/execute/runner
// Triggered securely by chron job or internal services to wake up the runner
export async function POST(req: Request) {
  try {
    // Security: Validate Bearer token + origin restriction
    const authError = guardAdminRoute(req);
    if (authError) return authError;

    // Parse specific limits if provided, defaulting to conservative batching
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 20;

    // Trigger Runner Loop
    const result = await runExecutionCycle(limit);

    // Provide execution summary — sanitized (counts only)
    return NextResponse.json({
      success: true,
      status: "execution_complete",
      actions_processed: result.actions_processed,
    }, { status: 200 });

  } catch (err: any) {
    console.error("[Execute:Runner] Error:", err.message);
    return NextResponse.json({ 
      success: false, 
      error: "Execution pipeline error"
    }, { status: 500 });
  }
}
