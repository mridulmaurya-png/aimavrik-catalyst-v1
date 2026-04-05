"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Zap, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Settings2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { updateBusinessSetting, testResendConnection, testN8nConnection, validateWhatsAppConfig } from "@/app/actions/settings";

interface ConnectorSettingsProps {
  initialSettings: {
    support_email?: string;
    config_json?: any;
    brand_voice_json?: any;
  };
}

export function ConnectorSettingsPanel({ initialSettings }: ConnectorSettingsProps) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Validation States
  const [testing, setTesting] = React.useState<string | null>(null);
  const [resendResult, setResendResult] = React.useState<{status: string, message: string} | null>(null);
  const [waResult, setWaResult] = React.useState<{status: string, message: string} | null>(null);
  const [n8nResult, setN8nResult] = React.useState<{status: string, message: string} | null>(null);

  // Resend State
  const [resendEmail, setResendEmail] = React.useState(initialSettings.config_json?.resend_from_email || "");
  const [resendKey, setResendKey] = React.useState(initialSettings.config_json?.resend_api_key || "");
  const isResendSaved = !!(initialSettings.config_json?.resend_api_key && initialSettings.config_json?.resend_from_email);

  // WhatsApp State
  const [waProvider, setWaProvider] = React.useState(initialSettings.config_json?.whatsapp_provider || "generic");
  const [waSenderId, setWaSenderId] = React.useState(initialSettings.config_json?.whatsapp_sender_id || "");
  const [waKey, setWaKey] = React.useState(initialSettings.config_json?.whatsapp_api_key || "");
  const isWaSaved = !!(initialSettings.config_json?.whatsapp_api_key && initialSettings.config_json?.whatsapp_sender_id);

  // n8n State
  const [n8nUrl, setN8nUrl] = React.useState(initialSettings.config_json?.n8n_webhook_url || "");
  const [execMode, setExecMode] = React.useState(initialSettings.config_json?.execution_mode || "local");
  const isN8nSaved = !!initialSettings.config_json?.n8n_webhook_url;

  const handleSave = async (connector: string, data: any) => {
    setSaving(connector);
    try {
      await updateBusinessSetting("config_json", data);
      setSuccess(connector);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save connector settings.");
    } finally {
      setSaving(null);
    }
  };

  const handleTestResend = async () => {
    setTesting("resend");
    const result = await testResendConnection(resendKey || initialSettings.config_json?.resend_api_key, resendEmail);
    setResendResult(result);
    setTesting(null);
  };

  const handleTestWa = async () => {
    setTesting("wa");
    const result = await validateWhatsAppConfig(waProvider, waSenderId, waKey || initialSettings.config_json?.whatsapp_api_key);
    setWaResult(result);
    setTesting(null);
  };

  const handleTestN8n = async () => {
    setTesting("n8n");
    const result = await testN8nConnection(n8nUrl);
    setN8nResult(result);
    setTesting(null);
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "********";
    return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings2 className="w-5 h-5 text-brand-primary" />
        <h2 className="text-heading-3 font-bold">Connector Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RESEND EMAIL */}
        <Card variant="elevated" className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="text-body-lg font-bold">Resend Email</h4>
                <p className="text-[11px] text-brand-text-tertiary">Outbound email delivery service</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={resendResult?.status === 'Valid' ? "success" : resendResult?.status === 'Invalid' ? 'error' : "neutral"} className="px-2">
                {resendResult ? resendResult.status : isResendSaved ? "Config Saved" : "Not Configured"}
              </Badge>
              {resendResult && <p className="text-[9px] text-brand-text-tertiary text-right">{resendResult.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-text-secondary uppercase">From Email</label>
              <Input 
                placeholder="e.g. notifications@yourdomain.com"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                className="h-10 bg-brand-bg-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-text-secondary uppercase">API Key</label>
              <Input 
                type="password"
                placeholder={isResendSaved ? "re_••••••••••••" : "re_your_api_key"}
                value={resendKey}
                onChange={e => setResendKey(e.target.value)}
                className="h-10 bg-brand-bg-primary font-mono"
              />
              {isResendSaved && !resendKey && (
                <p className="text-[9px] text-brand-text-tertiary">Currently saved: {maskKey(initialSettings.config_json?.resend_api_key)}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="secondary"
              className="flex-1 h-10 gap-2" 
              onClick={handleTestResend}
              disabled={testing === "resend"}
            >
              {testing === "resend" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Test Connection
            </Button>
            <Button 
              className="flex-1 h-10 gap-2" 
              onClick={() => handleSave("resend", { 
                resend_from_email: resendEmail, 
                resend_api_key: resendKey || initialSettings.config_json?.resend_api_key
              })}
              disabled={saving === "resend"}
            >
              {saving === "resend" ? <RefreshCw className="w-4 h-4 animate-spin" /> : success === "resend" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {success === "resend" ? "Saved!" : "Save Config"}
            </Button>
          </div>
        </Card>

        {/* WHATSAPP */}
        <Card variant="elevated" className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="text-body-lg font-bold">WhatsApp Business</h4>
                <p className="text-[11px] text-brand-text-tertiary">Automated messaging provider</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={waResult?.status === 'Configured' ? "success" : waResult?.status === 'Incomplete' ? 'error' : "neutral"} className="px-2">
                {waResult ? waResult.status : isWaSaved ? "Config Saved" : "Not Configured"}
              </Badge>
              {waResult && <p className="text-[9px] text-brand-text-tertiary text-right">{waResult.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-text-secondary uppercase">Provider</label>
                <select 
                  className="w-full h-10 bg-brand-bg-primary border border-brand-border rounded-lg px-3 text-body-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary"
                  value={waProvider}
                  onChange={e => setWaProvider(e.target.value)}
                >
                  <option value="generic">Generic Provider</option>
                  <option value="meta">Meta Cloud API</option>
                  <option value="twilio">Twilio</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-text-secondary uppercase">Sender ID / Phone</label>
                <Input 
                  placeholder="e.g. 15550123456"
                  value={waSenderId}
                  onChange={e => setWaSenderId(e.target.value)}
                  className="h-10 bg-brand-bg-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-text-secondary uppercase">API Secret / Token</label>
              <Input 
                type="password"
                placeholder={isWaSaved ? "••••••••••••••••" : "Paste provider token"}
                value={waKey}
                onChange={e => setWaKey(e.target.value)}
                className="h-10 bg-brand-bg-primary font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
                variant="secondary"
                className="flex-1 h-10 gap-2" 
                onClick={handleTestWa}
                disabled={testing === "wa"}
              >
              {testing === "wa" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Validate Config
            </Button>
            <Button 
              className="flex-1 h-10 gap-2"
              onClick={() => handleSave("whatsapp", { 
                whatsapp_provider: waProvider,
                whatsapp_sender_id: waSenderId,
                whatsapp_api_key: waKey || initialSettings.config_json?.whatsapp_api_key
              })}
              disabled={saving === "whatsapp"}
            >
              {saving === "whatsapp" ? <RefreshCw className="w-4 h-4 animate-spin" /> : success === "whatsapp" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {success === "whatsapp" ? "Saved!" : "Save Config"}
            </Button>
          </div>
        </Card>

        {/* N8N ORCHESTRATION */}
        <Card variant="elevated" className="p-6 lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="text-body-lg font-bold">n8n Orchestration</h4>
                <p className="text-[11px] text-brand-text-tertiary">External workflow handoff settings</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={n8nResult?.status === 'Reachable' ? "success" : n8nResult?.status?.includes('Invalid') || n8nResult?.status?.includes('Not Reachable') ? 'error' : "info"} className="px-2">
                {n8nResult ? n8nResult.status : isN8nSaved ? "Configuration Active" : "Internal Mode Only"}
              </Badge>
              {n8nResult && <p className="text-[9px] text-brand-text-tertiary text-right">{n8nResult.message}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-text-secondary uppercase">Execution Mode</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setExecMode("local")}
                    className={`flex-1 h-10 rounded-lg border text-label-sm font-bold transition-all ${execMode === 'local' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-brand-bg-primary border-brand-border text-brand-text-tertiary'}`}
                  >
                    Internal Only
                  </button>
                  <button 
                    onClick={() => setExecMode("n8n")}
                    className={`flex-1 h-10 rounded-lg border text-label-sm font-bold transition-all ${execMode === 'n8n' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-brand-bg-primary border-brand-border text-brand-text-tertiary'}`}
                  >
                    n8n Handoff
                  </button>
                </div>
                <p className="text-[10px] text-brand-text-tertiary italic">
                  {execMode === 'local' 
                    ? "System executes actions using internal Resend/WhatsApp connectors." 
                    : "System forwards action payloads to your external n8n webhook."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-text-secondary uppercase">n8n Webhook URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://n8n.yourdomain.com/webhook/..."
                    value={n8nUrl}
                    onChange={e => setN8nUrl(e.target.value)}
                    className="h-10 bg-brand-bg-primary font-mono text-body-sm"
                    disabled={execMode === 'local'}
                  />
                  <Button 
                    variant="secondary"
                    className="h-10 px-3 shrink-0"
                    onClick={handleTestN8n}
                    disabled={!n8nUrl || testing === "n8n"}
                    title="Test Reachability"
                  >
                    {testing === "n8n" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-functional-success pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Payload isolation enabled</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              className="w-full h-11 gap-2 bg-brand-primary hover:bg-brand-highlight" 
              onClick={() => handleSave("n8n", { 
                execution_mode: execMode,
                n8n_webhook_url: n8nUrl 
              })}
              disabled={saving === "n8n"}
            >
              {saving === "n8n" ? <RefreshCw className="w-4 h-4 animate-spin" /> : success === "n8n" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {success === "n8n" ? "Settings Saved!" : "Save Orchestration Settings"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
