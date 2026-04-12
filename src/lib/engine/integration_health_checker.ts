import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function checkIntegrationHealth() {
  const { data: integrations, error } = await supabase
    .from("client_integrations")
    .select("*");

  if (error || !integrations) {
    console.error("Failed to fetch integrations for health check.", error);
    return;
  }

  for (const integ of integrations) {
    let health: "healthy" | "degraded" | "failed" | "not_configured" = "not_configured";
    let status = integ.status;
    let message = "";

    const creds = integ.credentials || {};

    if (integ.integration_type === "whatsapp") {
      if (!creds.api_key || !creds.phone_number_id) {
        health = "not_configured";
        status = "not_configured";
        message = "Missing WhatsApp credentials";
      } else {
        health = "healthy";
        status = "active";
      }
    } else if (integ.integration_type === "email") {
      if (!creds.api_key || !creds.from_email) {
        health = "not_configured";
        status = "not_configured";
        message = "Missing Email credentials";
      } else {
        health = "healthy";
        status = "active";
      }
    } else if (integ.integration_type === "voice") {
      if (!creds.api_key || !creds.caller_id || !creds.agent_id) {
        health = "not_configured";
        status = "not_configured";
        message = "Missing Voice credentials";
      } else {
        health = "healthy";
        status = "active";
      }
    } else if (integ.integration_type === "n8n") {
       if (!integ.webhook_url && !integ.api_base_url) {
         health = "not_configured";
         status = "not_configured";
         message = "Missing n8n endpoint";
       } else {
         health = "healthy";
         status = "active";
       }
    } else {
      health = "healthy";
      status = integ.status === 'pending' ? 'pending' : 'active';
    }

    if (integ.status === 'disconnected') {
      status = 'disconnected';
      health = 'degraded';
    }

    // Update state
    await supabase.from("client_integrations").update({
      health,
      status,
      last_tested_at: new Date().toISOString(),
      last_test_result: message || "Automated check completed"
    }).eq("id", integ.id);

    // Auto alert (insight) on failure or config missing
    if ((health as string) === "failed" || health === "not_configured") {
      // Check if insight already exists and is open
      const { data: existing } = await supabase
        .from("insights")
        .select("id")
        .eq("business_id", integ.business_id)
        .eq("type", "integration_failure")
        .eq("status", "open")
        .like("message", `%${integ.provider}%`)
        .maybeSingle();

      if (!existing) {
        await supabase.from("insights").insert({
          business_id: integ.business_id,
          type: "integration_failure",
          priority: "high",
          message: `Integration ${integ.provider} requires attention: ${message}`,
          status: 'open'
        });
      }
    }
  }
}
