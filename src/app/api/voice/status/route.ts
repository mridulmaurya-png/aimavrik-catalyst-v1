import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateOrigin } from "@/lib/api/guard";

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: Request) {
  try {
    // Security: Origin/IP restriction
    const originError = validateOrigin(req);
    if (originError) return originError;

    const body = await req.json();
    const supabase = getServiceClient();

    const statusObj = body.CallStatus || body.status || 'unknown';
    const status = typeof statusObj === 'string' ? statusObj.toLowerCase() : 'unknown';
    
    let duration = 0;
    if (body.Duration || body.duration) {
      duration = parseInt((body.Duration || body.duration).toString());
    }
    
    const lead_id = body.lead_id || body.contact_id || body.To;
    const business_id = body.business_id || body.workspace_id;
    const provider = body.provider || 'webhook';

    if (!business_id) {
        return NextResponse.json({ success: false, error: "Missing business_id in callback payload." }, { status: 400 });
    }

    let normalizedStatus = "initiated";
    if (["completed", "answered"].includes(status)) {
        normalizedStatus = "answered";
    } else if (["failed", "busy", "no-answer", "canceled"].includes(status)) {
        normalizedStatus = "failed";
    }

    await supabase.from("voice_call_logs").insert({
        business_id,
        lead_id: lead_id || null,
        status: normalizedStatus,
        duration,
        provider,
        metadata: { status: normalizedStatus, duration, provider }
    });

    if (normalizedStatus === "failed" || status === "no-answer" || status === "busy") {
        const insightType = (status === "no-answer" || status === "busy") ? "call_not_answered" : "call_failed";
        
        await supabase.from("insights").insert({
            business_id,
            type: insightType,
            priority: "medium",
            message: `Voice call resulted in ${status}.`,
            lead_id: lead_id || null,
            status: "open"
        });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Voice:Status] Error:", err.message);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
