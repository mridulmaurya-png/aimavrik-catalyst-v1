// Provider Adapters for Action Execution Layer
export interface DeliveryResult {
  success: boolean;
  provider_id?: string;
  error?: string;
  simulated: boolean;
}

export interface DeliveryPayload {
  to: string;
  body: string;
  subject?: string;
}

export async function sendWhatsApp(
  payload: DeliveryPayload, 
  config: any, 
  forceSimulate: boolean = true
): Promise<DeliveryResult> {
  // In V1, we simulate delivery locally by default to avoid blocking on credentials.
  const isSimulated = forceSimulate || !config?.whatsapp_token;

  if (isSimulated) {
    console.log(`[SIMULATED WHATSAPP] Delivery simulated | Body length: ${payload.body.length}`);
    return {
      success: true,
      provider_id: `sim_wa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      simulated: true
    };
  }

  // Real provider integration (e.g., Meta Cloud API / 360dialog) goes here
  try {
    // Example placeholder logic
    // const res = await fetch('https://graph.facebook.com/v17.0/.../messages', { ... });
    // if (!res.ok) throw new Error("Failed to send");
    return {
      success: true,
      provider_id: `live_wa_${Date.now()}`,
      simulated: false
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to deliver WhatsApp message",
      simulated: false
    };
  }
}

export async function sendEmail(
  payload: DeliveryPayload, 
  config: any, 
  forceSimulate: boolean = true
): Promise<DeliveryResult> {
  const isSimulated = forceSimulate || !config?.resend_api_key;

  if (isSimulated) {
    console.log(`[SIMULATED EMAIL] Delivery simulated`);
    return {
      success: true,
      provider_id: `sim_em_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      simulated: true
    };
  }

  // Resend API integration (Constraint 6)
  try {
    const apiKey = config?.resend_api_key || process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Missing Resend API Key");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: config?.default_sender_email || "no-reply@catalyst.aimavrik.com",
        to: [payload.to],
        subject: payload.subject || "Message from Catalyst",
        html: payload.body.replace(/\n/g, "<br>")
      })
    });

    if (!response.ok) {
       const errData = await response.json();
       throw new Error(`Resend Error: ${errData.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider_id: data.id,
      simulated: false
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to deliver Email",
      simulated: false
    };
  }
}
