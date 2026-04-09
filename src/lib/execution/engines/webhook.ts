/**
 * Generic Webhook Execution Engine
 * 
 * Handles outbound webhook calls for:
 * - CRM webhooks
 * - Internal services
 * - Third-party APIs
 * - Custom client systems
 * 
 * Supports URL, headers, auth token, payload POST,
 * timeout, and structured response logging.
 */

import type { EngineResult } from "../types";

export interface WebhookExecutionConfig {
  url: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  authToken?: string;
  method?: "POST" | "PUT" | "PATCH";
  timeoutMs?: number;
}

export async function executeWebhook(config: WebhookExecutionConfig): Promise<EngineResult> {
  const { 
    url, 
    payload, 
    headers: customHeaders = {}, 
    authToken, 
    method = "POST",
    timeoutMs = 30000 
  } = config;
  const startMs = Date.now();

  if (!url) {
    return {
      success: false,
      error: "No webhook URL configured.",
      duration_ms: 0,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Source": "aimavrik-catalyst",
      "X-Engine": "webhook",
      ...customHeaders,
    };

    if (authToken) {
      // Don't override if custom Authorization header is set
      if (!headers["Authorization"] && !headers["authorization"]) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMs = Date.now() - startMs;

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        errorBody = response.statusText;
      }

      return {
        success: false,
        response_code: response.status,
        response_body: errorBody,
        error: `Webhook returned HTTP ${response.status}: ${errorBody.substring(0, 500)}`,
        duration_ms: durationMs,
      };
    }

    // Capture response
    let responseBody: any = null;
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch {
      responseBody = { raw: "Response body not parseable" };
    }

    return {
      success: true,
      handoff_reference: `webhook_${Date.now()}_${response.status}`,
      response_code: response.status,
      response_body: responseBody,
      duration_ms: durationMs,
    };

  } catch (error: any) {
    const durationMs = Date.now() - startMs;

    if (error.name === "AbortError") {
      return {
        success: false,
        error: `Webhook timed out after ${timeoutMs}ms.`,
        duration_ms: durationMs,
      };
    }

    return {
      success: false,
      error: `Webhook handoff error: ${error.message}`,
      duration_ms: durationMs,
    };
  }
}
