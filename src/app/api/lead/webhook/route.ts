/**
 * Direct Inbound Webhook — POST /api/lead/webhook
 * 
 * Fallback endpoint for receiving lead replies directly from channel providers
 * (Gupshup, Twilio, Meta) WITHOUT routing through n8n.
 * 
 * Security layers:
 *   1. Rate limit: 20 req/min per IP
 *   2. Provider signature verification (if secret configured)
 *   3. Fallback to x-api-key validation (if no provider secret)
 *   4. Payload validation (phone + message required)
 *   5. Minimal logging (provider, status, trace_id only)
 * 
 * Configure this URL as a secondary/backup webhook in your provider dashboard.
 */

import { NextResponse } from "next/server";
import { guardWebhookRoute, getClientIp } from "@/lib/api/guard";

export const runtime = "nodejs";

// ─── Provider detection ───
// Detects which provider sent the payload based on structure or headers.
function detectProvider(req: Request, body: any): string {
  // Gupshup: has `app` field or Gupshup-specific payload structure
  if (body.app || body.payload?.sender?.phone) return "gupshup";

  // Twilio: has `From` + `Body` fields
  if (body.From && body.Body) return "twilio";

  // Meta: has `entry[].changes[].value.messages` structure
  if (body.entry?.[0]?.changes?.[0]?.value?.messages) return "meta";

  // Explicit provider field
  if (body.provider && typeof body.provider === "string") return body.provider;

  return "generic";
}

// ─── Provider payload normalization ───

interface NormalizedReply {
  phone: string;
  message: string;
  channel: string;
  provider: string;
  business_id?: string;
}

function normalizeProviderPayload(body: any, provider: string): NormalizedReply | null {
  switch (provider) {
    case "gupshup": {
      const sender = body.payload?.sender?.phone || body.mobile || body.sender;
      const text = body.payload?.payload?.text || body.payload?.text || body.text || body.message;
      if (sender && text) {
        return { phone: sender, message: text, channel: "whatsapp", provider, business_id: body.business_id || body.workspace_id };
      }
      return null;
    }

    case "twilio": {
      if (body.From && body.Body) {
        return {
          phone: body.From.replace("whatsapp:", ""),
          message: body.Body,
          channel: body.From.startsWith("whatsapp:") ? "whatsapp" : "sms",
          provider,
          business_id: body.business_id || body.workspace_id,
        };
      }
      return null;
    }

    case "meta": {
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
      if (msg) {
        return {
          phone: msg.from || contact?.wa_id || "",
          message: msg.text?.body || msg.button?.text || "",
          channel: "whatsapp",
          provider,
          business_id: body.business_id || body.workspace_id,
        };
      }
      return null;
    }

    default: {
      // Generic: requires explicit phone + message fields
      if (body.phone && body.message) {
        return {
          phone: body.phone,
          message: body.message,
          channel: body.channel || "whatsapp",
          provider,
          business_id: body.business_id || body.workspace_id,
        };
      }
      return null;
    }
  }
}

export async function POST(req: Request) {
  const trace_id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  try {
    // Read raw body for signature verification (must happen before json parse)
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      console.log("[Lead:Webhook]", { trace_id, status: "rejected", reason: "invalid_json" });
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD", message: "Invalid JSON." },
        { status: 400 }
      );
    }

    // ─── Step 1: Detect provider ───
    const provider = detectProvider(req, body);

    // ─── Step 2: Security — rate limit + signature + API key ───
    const guardError = await guardWebhookRoute(req, rawBody, provider, 20);
    if (guardError) {
      console.log("[Lead:Webhook]", { trace_id, provider, status: "blocked" });
      return guardError;
    }

    // ─── Step 3: Normalize payload ───
    const normalized = normalizeProviderPayload(body, provider);

    if (!normalized) {
      console.log("[Lead:Webhook]", { trace_id, provider, status: "unrecognized_format" });
      return NextResponse.json(
        { success: false, error: "UNRECOGNIZED_FORMAT", message: "Could not parse the incoming payload." },
        { status: 400 }
      );
    }

    // ─── Step 4: Payload validation ───
    if (!normalized.phone || normalized.phone.trim().length < 7) {
      console.log("[Lead:Webhook]", { trace_id, provider, status: "rejected", reason: "missing_phone" });
      return NextResponse.json(
        { success: false, error: "MISSING_PHONE", message: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!normalized.message || normalized.message.trim().length === 0) {
      console.log("[Lead:Webhook]", { trace_id, provider, status: "rejected", reason: "empty_message" });
      return NextResponse.json(
        { success: false, error: "EMPTY_MESSAGE", message: "Message body is required." },
        { status: 400 }
      );
    }

    // ─── Step 5: Forward to canonical response endpoint ───
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const internalKey = process.env.INTERNAL_API_KEY || "";

    const response = await fetch(`${appUrl}/api/lead/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": internalKey,
      },
      body: JSON.stringify({
        phone: normalized.phone,
        message: normalized.message,
        channel: normalized.channel,
        business_id: normalized.business_id,
      }),
    });

    const result = await response.json();

    // Minimal log — no PII
    console.log("[Lead:Webhook]", {
      trace_id,
      provider,
      status: result.success ? "forwarded" : "forward_failed",
      response_status: response.status,
    });

    return NextResponse.json({
      ...result,
      _webhook_meta: {
        trace_id,
        provider,
        received_via: "direct_webhook",
      },
    }, { status: response.status });

  } catch (err: any) {
    console.log("[Lead:Webhook]", { trace_id, status: "error" });

    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Internal processing error." },
      { status: 500 }
    );
  }
}
