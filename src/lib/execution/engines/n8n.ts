/**
 * n8n Execution Engine
 * 
 * Safe handoff layer for n8n workflow execution.
 * Supports workspace-specific webhook URLs, auth tokens,
 * POST payload handoff, response capture, and timeout handling.
 * 
 * Each client can have different n8n webhook and workflow mappings.
 */

import type { EngineResult } from "../types";

export interface N8nExecutionConfig {
  url: string;
  payload: Record<string, any>;
  authToken?: string;
  timeoutMs?: number;
}

export async function executeN8n(config: N8nExecutionConfig): Promise<EngineResult> {
  const { url, payload, authToken, timeoutMs = 30000 } = config;
  const startMs = Date.now();

  if (!url) {
    return {
      success: false,
      error: "No n8n webhook URL configured.",
      duration_ms: 0,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Source": "aimavrik-catalyst",
      "X-Engine": "n8n",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Phase 2: Enforce N8N Contract Standardization (Now requiring trace_id)
    const reqFields = ['workspace_id', 'event', 'lead', 'context', 'channel', 'integration', 'trace_id'];
    for (const f of reqFields) {
      if (!payload[f]) {
        console.error(`[n8n] Contract validation failed: Missing required field '${f}'`, payload);
        return {
          success: false,
          error: `Contract validation failed: Payload is malformed. Missing '${f}'.`,
          duration_ms: 0,
        };
      }
    }

    if (!payload.lead.id || (!payload.lead.email && !payload.lead.phone)) {
      console.error("[n8n] Contract validation failed: Lead is missing ID, Email, or Phone.", payload);
      return {
        success: false,
        error: "Contract validation failed: Lead mapping is invalid.",
        duration_ms: 0,
      };
    }

    console.log(`[n8n] Executing workflow for event '${payload.event}' on channel '${payload.channel}'`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "POST",
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
        error: `n8n webhook returned HTTP ${response.status}: ${errorBody.substring(0, 500)}`,
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
      handoff_reference: `n8n_${Date.now()}_${response.status}`,
      response_code: response.status,
      response_body: responseBody,
      duration_ms: durationMs,
    };

  } catch (error: any) {
    const durationMs = Date.now() - startMs;

    if (error.name === "AbortError") {
      return {
        success: false,
        error: `n8n webhook timed out after ${timeoutMs}ms.`,
        duration_ms: durationMs,
      };
    }

    return {
      success: false,
      error: `n8n handoff error: ${error.message}`,
      duration_ms: durationMs,
    };
  }
}
