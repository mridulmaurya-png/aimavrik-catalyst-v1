import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export interface NormalizedEvent {
  event_type: string;
  source: string;
  contact: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    external_id?: string;
  };
  timestamp: string;
  raw_payload: any;
  metadata: any;
  dedupe_key: string;
}

export function normalizePayload(payload: any, source: string): NormalizedEvent {
  // Graceful extraction strategy (fallback logic for generic webhooks)
  const event_type = payload.event_type || payload.type || payload.action || "lead_submitted";
  
  const email = payload.email || payload.contact?.email || payload.customer?.email;
  const phone = payload.phone || payload.contact?.phone || payload.customer?.phone;
  let full_name = payload.full_name || payload.name;
  
  if (!full_name && (payload.first_name || payload.last_name)) {
    full_name = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
  }

  // Generate deterministic dedupe key if not provided by source platform
  const externalId = payload.id || payload.event_id || payload.order_id;
  
  let dedupe_key = externalId;
  if (!dedupe_key) {
    // Generate an MD5 hash of crucial fields to prevent immediate double-fires
    const hashContent = `${source}:${event_type}:${email || phone}:${new Date().toISOString().split('T')[0]}`;
    dedupe_key = crypto.createHash('md5').update(hashContent).digest('hex');
  } else {
    dedupe_key = `${source}:${externalId}`;
  }

  return {
    event_type,
    source,
    contact: {
      email,
      phone,
      full_name: full_name || "Unknown Target",
      external_id: externalId
    },
    timestamp: payload.timestamp || payload.created_at || new Date().toISOString(),
    raw_payload: payload,
    metadata: payload.metadata || {},
    dedupe_key
  };
}
