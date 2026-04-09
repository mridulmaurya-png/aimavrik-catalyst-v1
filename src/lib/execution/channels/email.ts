/**
 * Email Channel Abstraction
 * Clean interface for email delivery targeting.
 */

import type { ChannelSendPayload, ChannelIntegrationConfig, ChannelResult } from "../types";

export async function send(
  payload: ChannelSendPayload,
  config: ChannelIntegrationConfig
): Promise<ChannelResult> {
  const isSimulated = !config.api_key && !config.config_json?.resend_api_key;

  if (isSimulated) {
    console.log(`[CHANNEL:EMAIL:SIMULATED] To: ${payload.to} | Subject: ${payload.subject}`);
    return {
      success: true,
      provider_id: `sim_email_${Date.now()}`,
      simulated: true,
      channel: "email",
    };
  }

  try {
    const apiKey = config.api_key || config.config_json?.resend_api_key;
    const fromAddress = config.from_address || config.config_json?.resend_from_email || "no-reply@catalyst.aimavrik.com";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [payload.to],
        subject: payload.subject || "Message from Catalyst",
        html: payload.body.replace(/\n/g, "<br>"),
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Resend Error: ${errData.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider_id: data.id,
      simulated: false,
      channel: "email",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to deliver email",
      simulated: false,
      channel: "email",
    };
  }
}
