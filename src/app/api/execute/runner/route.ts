import { NextResponse } from "next/server";
import { runExecutionCycle } from "@/lib/execution/runner";

// Endpoint: POST /api/execute/runner
// Triggered securely by chron job or internal services to wake up the runner
export async function POST(req: Request) {
  try {
    // 1. Basic security for runner trigger
    const authHeader = req.headers.get("authorization");
    
    // Standardized security for internal execution trigger
    // INTERNAL_EXECUTION_SECRET must be set in production
    const secret = process.env.INTERNAL_EXECUTION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized Execution Trigger"
      }, { status: 401 });
    }

    // Parse specific limits if provided, defaulting to conservative batching
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 20;

    // 2. Trigger Runner Loop
    // This executes action pick-up, atomic claims, validations, AI processing, 
    // delivery abstraction, message persistence, and audit logging.
    const result = await runExecutionCycle(limit);

    // 3. Provide execution summary
    return NextResponse.json({
      success: true,
      status: "execution_complete",
      details: result
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: "Execution Pipeline Error",
      message: err.message || "An unhandled error occurred in the execution runner."
    }, { status: 500 });
  }
}
