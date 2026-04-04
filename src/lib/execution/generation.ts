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

const FALLBACK_TEMPLATES: Record<string, any> = {
  "Instant Lead Follow-Up": {
    whatsapp: (name: string) => `Hi ${name}, thanks for reaching out! We've received your details and will be in contact shortly.`,
    email: {
      subject: "Thanks for your interest",
      body: (name: string) => `Hi ${name},\n\nThank you for getting in touch. We have received your details and our team will review them immediately.\n\nBest regards,`
    }
  },
  "No Response Recovery": {
    whatsapp: (name: string) => `Hi ${name}, wanted to float this to the top of your inbox. Are you still interested?`,
    email: {
      subject: "Checking in",
      body: (name: string) => `Hi ${name},\n\nI wanted to quickly follow up to see if you had any questions on our previous message. Let us know if you're still exploring options.\n\nBest,`
    }
  },
  "Stale Lead Reactivation": {
    whatsapp: (name: string) => `Hi ${name}, it's been a while! Are you still looking for a solution? We have some new updates you might like.`,
    email: {
      subject: "Still exploring?",
      body: (name: string) => `Hi ${name},\n\nIt's been a while since we last connected. I wanted to see if solving this is still a priority for you right now?\n\nBest,`
    }
  },
  "Cross-Sell Sequence": {
    whatsapp: (name: string) => `Hi ${name}, thanks for being a great customer. Based on your setup, we thought you might benefit from our premium add-ons.`,
    email: {
      subject: "Enhance your setup",
      body: (name: string) => `Hi ${name},\n\nThanks for your recent purchase. Many of our customers also leverage our add-ons to get even better results. Let us know if you'd like a quick overview.`
    }
  },
  "Dormant Customer Reactivation": {
    whatsapp: (name: string) => `Hi ${name}, we miss you! Come back and see what's new.`,
    email: {
      subject: "We miss you",
      body: (name: string) => `Hi ${name},\n\nIt's been a while since your last activity. We've added a lot of new features recently and would love to welcome you back.`
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
