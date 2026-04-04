export interface GenerationContext {
  playbook_type: string;
  action_type: string;
  business_tone: string;
  contact_first_name: string;
  trigger_event: string;
}

export interface GeneratedMessage {
  body: string;
  subject?: string;
  is_fallback: boolean;
}

// Simulated simple static fallbacks to guarantee robust handling if LLM fails
const FALLBACK_TEMPLATES: Record<string, any> = {
  "Abandoned Cart Recovery": {
    whatsapp: (name: string) => `Hi ${name}, looks like you left something behind! Let us know if you need help checking out.`,
    email: {
      subject: "Complete your order",
      body: (name: string) => `Hi ${name},\n\nWe noticed you left some items in your cart. Returning is easy - just click the link below to finalize your purchase.\n\nThank you!`
    }
  },
  "New Lead Instant Follow-up": {
    whatsapp: (name: string) => `Hi ${name}, thanks for reaching out! A team member will review your request shortly.`,
    email: {
      subject: "Thanks for your interest",
      body: (name: string) => `Hi ${name},\n\nThank you for getting in touch. We have received your details and will be in contact shortly.\n\nBest regards,`
    }
  },
  "Post-Purchase Upsell": {
    whatsapp: (name: string) => `Hi ${name}, thanks again for your order! We thought you might also love these premium additions.`,
    email: {
      subject: "You might also like...",
      body: (name: string) => `Hi ${name},\n\nWe appreciate your recent purchase. Based on what you bought, our team curated a few similar recommendations you might enjoy.`
    }
  },
  "DEFAULT": {
    whatsapp: (name: string) => `Hi ${name}, just following up on your recent activity with us.`,
    email: {
      subject: "Following up",
      body: (name: string) => `Hi ${name},\n\nJust reaching out regarding your recent activity. Let us know if you need any assistance.`
    }
  }
};

export async function generateMessagePayload(
  channel: string,
  context: GenerationContext
): Promise<GeneratedMessage> {
  try {
    // Gemini API integration (Constraint 5)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey) {
      const prompt = `
        You are an AI assistant for AiMavrik Catalyst. 
        Generate a ${channel} message for a contact.
        Context:
        - Playbook: ${context.playbook_type}
        - Event: ${context.trigger_event}
        - Tone: ${context.business_tone}
        - Contact: ${context.contact_first_name}
        
        Strict rules: No hallucinations, no pricing unless specified, no placeholder brackets.
        Return JSON format: { "subject": "...", "body": "..." }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.candidates[0].content.parts[0].text);
        return {
          body: content.body,
          subject: channel === "email" ? content.subject : undefined,
          is_fallback: false
        };
      }
    }
    
    throw new Error("AI disabled or failed, falling back");

  } catch (err) {
    // 2. Playbook-Step-Specific Fallback if AI fails or is disabled (Constraint 2)
    const playbookFallback = FALLBACK_TEMPLATES[context.playbook_type] || FALLBACK_TEMPLATES["DEFAULT"];

    if (channel === "whatsapp") {
      return {
        body: playbookFallback.whatsapp(context.contact_first_name),
        is_fallback: true
      };
    } else {
      return {
        subject: playbookFallback.email.subject,
        body: playbookFallback.email.body(context.contact_first_name),
        is_fallback: true
      };
    }
  }
}
