/**
 * Scheduled Follow-up Processor — POST /api/events/process-scheduled
 * 
 * Cron endpoint that picks up due follow-ups and fires them 
 * through the managed execution router.
 * 
 * Protected by INTERNAL_EXECUTION_SECRET.
 * Call this from Vercel Cron, external scheduler, or manually from Ops.
 */

import { NextResponse } from "next/server";
import { processScheduledFollowUps } from "@/lib/execution/scheduler";

export async function POST(req: Request) {
  try {
    // ─── Auth: internal secret only ───
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_EXECUTION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Invalid execution secret." },
        { status: 401 }
      );
    }

    // Optional: limit from request body
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 20;

    const result = await processScheduledFollowUps(limit);

    return NextResponse.json({
      success: true,
      status: "cron_complete",
      ...result,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "CRON_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron
export async function GET(req: Request) {
  // Vercel Cron uses GET with CRON_SECRET header
  const cronSecret = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_EXECUTION_SECRET;

  if (!secret || cronSecret !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const result = await processScheduledFollowUps(20);

  return NextResponse.json({
    success: true,
    status: "cron_complete",
    ...result,
  }, { status: 200 });
}
