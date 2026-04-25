import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { guardInternalRoute } from "@/lib/api/guard";

export async function POST(req: Request) {
  try {
    // Security: Validate x-api-key + origin restriction
    const authError = guardInternalRoute(req);
    if (authError) return authError;

    // Parse the payload
    const body = await req.json();
    const {
      automation_run_id,
      status,
      channel,
      external_id,
      error,
      metadata,
    } = body;

    const trace_id = body.trace_id || body.payload?.trace_id || automation_run_id;

    // Sanitized log — status and trace only
    console.log("[Execution Callback]", { trace_id, status, channel });

    // Validate requirements
    if (!automation_run_id || typeof automation_run_id !== "string") {
      return NextResponse.json(
        { success: false, error: "automation_run_id is required" },
        { status: 400 }
      );
    }

    // Status enum safety
    if (status !== "success" && status !== "failed") {
      return NextResponse.json(
        { success: false, error: 'status must be "success" or "failed"' },
        { status: 400 }
      );
    }

    // Ensure metadata safe storage
    let safeMetadata = {};
    if (metadata !== null && metadata !== undefined && typeof metadata === 'object' && !Array.isArray(metadata)) {
      safeMetadata = metadata;
    }

    // Initialize Supabase admin client (Service Role - bypasses RLS)
    const supabase = await createAdminClient();

    // Idempotency protection — verify existing record status
    const { data: existingRecord, error: fetchError } = await supabase
      .from("automation_runs")
      .select("status")
      .eq("id", automation_run_id)
      .single();

    if (fetchError) {
      // PGRST116: zero rows returned
      // 22P02: invalid input syntax for type uuid
      if (fetchError.code === "PGRST116" || fetchError.code === "22P02") { 
        return NextResponse.json(
          { success: false, error: "automation_run_id not found or invalid" },
          { status: 404 }
        );
      }
      
      console.error("[Execution Callback] DB fetch error:", fetchError.code);
      return NextResponse.json(
        { success: false, error: "Failed to verify existing record" },
        { status: 500 }
      );
    }

    if (existingRecord.status === "success" || existingRecord.status === "failed") {
      console.log(`[Execution Callback] Duplicate ignored: ${trace_id}`);
      return NextResponse.json({ success: true, duplicated: true });
    }

    // Prepare update payload
    const updateData: Record<string, any> = {
      status,
      completed_at: new Date().toISOString(),
      metadata: safeMetadata,
    };

    if (external_id !== undefined) updateData.external_id = external_id;
    if (error !== undefined) updateData.error = error;

    // Update the database
    const { error: dbError } = await supabase
      .from("automation_runs")
      .update(updateData)
      .eq("id", automation_run_id);

    if (dbError) {
      console.error("[Execution Callback] DB update error:", dbError.code);
      return NextResponse.json(
        { success: false, error: "Failed to update database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Execution Callback] Internal error:", err.message);
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
