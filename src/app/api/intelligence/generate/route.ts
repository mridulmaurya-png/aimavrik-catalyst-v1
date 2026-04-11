/**
 * Intelligence Processing Cron — POST /api/intelligence/generate
 * 
 * Runs insight generation, insight→event bridge, and festive calendar
 * checks for all active workspaces. Protected by INTERNAL_EXECUTION_SECRET.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateInsights } from "@/lib/intelligence/insight-engine";
import { processInsightEvents } from "@/lib/intelligence/insight-bridge";
import { checkFestiveCalendar } from "@/lib/intelligence/festive-engine";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_EXECUTION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetBusinessId = body.business_id; // Optional: process single workspace

    const supabase = getServiceClient();

    // Get active workspaces
    let workspaces: any[] = [];
    if (targetBusinessId) {
      workspaces = [{ id: targetBusinessId }];
    } else {
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .in("status", ["active", "ready_for_activation"]);
      workspaces = data || [];
    }

    const results: Record<string, any> = {};

    for (const ws of workspaces) {
      try {
        const insights = await generateInsights(ws.id);
        const bridge = await processInsightEvents(ws.id);
        const festive = await checkFestiveCalendar(ws.id);

        results[ws.id] = {
          insights_generated: insights.generated,
          events_created: bridge.eventsCreated,
          festivals_found: festive.festivalsFound,
          events_triggered: festive.eventsTriggered,
        };
      } catch (err: any) {
        results[ws.id] = { error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      workspaces_processed: workspaces.length,
      results,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "INTELLIGENCE_CRON_ERROR", message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Vercel Cron support
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET || process.env.INTERNAL_EXECUTION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();
    const { data: workspaces } = await supabase
      .from("businesses")
      .select("id")
      .in("status", ["active", "ready_for_activation"]);

    let totalInsights = 0;
    let totalEvents = 0;

    for (const ws of (workspaces || [])) {
      try {
        const insights = await generateInsights(ws.id);
        const bridge = await processInsightEvents(ws.id);
        await checkFestiveCalendar(ws.id);
        totalInsights += insights.generated;
        totalEvents += bridge.eventsCreated;
      } catch {
        // Log but don't fail other workspaces
      }
    }

    return NextResponse.json({
      success: true,
      workspaces: (workspaces || []).length,
      insights_generated: totalInsights,
      events_created: totalEvents,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "INTELLIGENCE_CRON_ERROR", message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
