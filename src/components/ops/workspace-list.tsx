"use client";

import * as React from "react";
import { updateWorkspaceStatus } from "@/app/actions/ops";
import { updateOnboardingStatus } from "@/app/actions/onboarding";
import { WorkspaceStatus, formatStatus } from "@/lib/config/constants";
import { Check, Loader2, MoreVertical, ShieldAlert, Zap, AlertCircle, Info, Building2, Target, MessageCircle, Mic2, Bot, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  business_name: string;
  status: WorkspaceStatus;
  created_at: string;
  business_settings: Array<{ config_json: any }>;
  onboarding_submissions: Array<any>;
}

export function OpsWorkspaceList({ initialWorkspaces }: { initialWorkspaces: Workspace[] }) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (id: string, status: WorkspaceStatus) => {
    if (!confirm(`Confirm workspace should be changed to ${status}?`)) return;
    setLoadingId(id);
    try {
      await updateWorkspaceStatus(id, status);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStepUpdate = async (id: string, step: string) => {
    setLoadingId(id);
    try {
        await updateOnboardingStatus(id, step);
        router.refresh();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Active</Badge>;
      case "setup_in_progress": return <Badge variant="info">Setup</Badge>;
      case "under_review": return <Badge variant="info">In Review</Badge>;
      case "onboarding_submitted": return <Badge variant="warning">New Request</Badge>;
      case "restricted": return <Badge variant="error">Restricted</Badge>;
      default: return <Badge variant="neutral">Initial</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {initialWorkspaces.map((biz) => {
        const config = biz.business_settings?.[0]?.config_json || {};
        const submission = biz.onboarding_submissions?.[0];
        const isEmailConfigured = !!(config.resend_api_key && config.resend_from_email);
        const isWaConfigured = !!(config.whatsapp_api_key && config.whatsapp_sender_id);
        const isN8nConfigured = config.execution_mode === "n8n" && !!config.n8n_webhook_url;

        return (
          <Card key={biz.id} variant="elevated" className="overflow-hidden bg-brand-bg-secondary border-brand-border/40 shadow-glow flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 border-b border-brand-border/30 bg-brand-bg-primary/30">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-body-lg font-bold text-brand-text-primary truncate">{biz.business_name}</h3>
                  {getStatusBadge(biz.status)}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-brand-text-tertiary">
                   <span className="font-mono">{biz.id}</span>
                   <span>·</span>
                   <span>Created: {new Date(biz.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col gap-1.5 min-w-[100px]">
                  <span className="text-[9px] uppercase font-bold text-brand-text-tertiary tracking-widest">Connectors</span>
                  <div className="flex gap-2">
                    <div title="Resend Email" className={`w-2 h-2 rounded-full ${isEmailConfigured ? 'bg-green-500 shadow-glow-success' : 'bg-brand-border'}`} />
                    <div title="WhatsApp" className={`w-2 h-2 rounded-full ${isWaConfigured ? 'bg-green-500 shadow-glow-success' : 'bg-brand-border'}`} />
                    <div title="n8n" className={`w-2 h-2 rounded-full ${isN8nConfigured ? 'bg-blue-500 shadow-glow-info' : 'bg-brand-border'}`} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-bold text-brand-text-tertiary tracking-widest">Mode</span>
                  <Badge variant="neutral" className="text-[10px] bg-brand-bg-primary h-5 px-2">{config.execution_mode || "local"}</Badge>
                </div>
              </div>
            </div>

            {/* Submission / Requirements Review */}
            <div className="p-6 grid md:grid-cols-2 gap-8">
                {submission ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-primary">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[11px] font-bold uppercase tracking-widest">Onboarding Requirements</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6 p-4 bg-brand-bg-primary/50 border border-brand-border/30 rounded-xl">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-brand-text-tertiary uppercase tracking-wider font-bold">Business Type</Label>
                                <p className="text-body-sm font-bold text-brand-text-primary">{submission.business_type}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-brand-text-tertiary uppercase tracking-wider font-bold">Lead Volume</Label>
                                <p className="text-body-sm font-bold text-brand-text-primary">{submission.monthly_volume}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <Label className="text-[10px] text-brand-text-tertiary uppercase tracking-wider font-bold">Target Channels</Label>
                                <div className="flex gap-2 pt-1">{submission.channels?.map((c: string) => <Badge key={c} variant="neutral" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 text-[10px]">{c}</Badge>)}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-brand-text-tertiary uppercase tracking-wider font-bold">Primary Challenge</Label>
                            <p className="text-body-sm text-brand-text-secondary leading-relaxed bg-brand-bg-secondary p-3 rounded-lg border border-brand-border/20">{submission.conversion_challenge}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-border/30 rounded-xl h-48 text-center px-8 bg-brand-bg-primary/20">
                        <Info className="w-6 h-6 text-brand-text-tertiary mb-2 opacity-50" />
                        <p className="text-[11px] text-brand-text-tertiary font-bold uppercase tracking-widest leading-relaxed">Client has not yet submitted onboarding requirements</p>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-brand-text-primary">
                        <Zap className="w-4 h-4 text-brand-primary" />
                        <h4 className="text-[11px] font-bold uppercase tracking-widest">Ops Orchestration</h4>
                    </div>
                    
                    <div className="p-4 bg-brand-bg-primary border border-brand-border/30 rounded-xl space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-tertiary">Requested Activation Path</p>
                            <div className="flex gap-4">
                                <div className={`flex items-center gap-2 p-2 px-3 rounded-md border ${submission?.ai_voice_needed ? 'bg-brand-primary/5 border-brand-primary/30 text-brand-text-primary' : 'bg-brand-bg-secondary border-brand-border/20 text-brand-text-tertiary opacity-40'}`}>
                                    <Mic2 className="w-4 h-4" />
                                    <span className="text-[11px] font-bold uppercase">Voice</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 px-3 rounded-md border ${submission?.ai_chatbot_needed ? 'bg-brand-primary/5 border-brand-primary/30 text-brand-text-primary' : 'bg-brand-bg-secondary border-brand-border/20 text-brand-text-tertiary opacity-40'}`}>
                                    <Bot className="w-4 h-4" />
                                    <span className="text-[11px] font-bold uppercase">Chatbot</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-brand-border/30">
                            {biz.status === "onboarding_submitted" && (
                                <Button 
                                  variant="primary" 
                                  className="h-10 w-full gap-2 shadow-glow-primary" 
                                  onClick={() => handleStepUpdate(biz.id, "under_review")}
                                  disabled={loadingId === biz.id}
                                >
                                  {loadingId === biz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                  Start Review
                                </Button>
                            )}

                            {biz.status === "under_review" && (
                                <Button 
                                  variant="primary" 
                                  className="h-10 w-full gap-2 shadow-glow-primary bg-blue-600 hover:bg-blue-700" 
                                  onClick={() => handleStepUpdate(biz.id, "setup_in_progress")}
                                  disabled={loadingId === biz.id}
                                >
                                  {loadingId === biz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                                  Move to Configuration
                                </Button>
                            )}

                            {biz.status === "setup_in_progress" && (
                                <Button 
                                  variant="secondary" 
                                  className="h-10 w-full gap-2 border-brand-primary text-brand-primary hover:bg-brand-primary/5" 
                                  onClick={() => handleStepUpdate(biz.id, "active")}
                                  disabled={loadingId === biz.id}
                                >
                                  <Zap className="w-4 h-4 fill-brand-primary" />
                                  Verify & Activate Live
                                </Button>
                            )}

                            {biz.status === "active" && (
                                <Badge variant="success" className="h-10 w-full justify-center text-xs gap-2">
                                    <Check className="w-4 h-4" />
                                    Workspace Live & Monitored
                                </Badge>
                            )}

                            {biz.status !== "restricted" && (
                                <Button variant="ghost" className="text-[10px] uppercase font-bold text-functional-error hover:bg-functional-error/5" onClick={() => handleStatusChange(biz.id, "restricted")}>Restrict Workspace</Button>
                            )}
                            
                            {biz.status === "restricted" && (
                                <Button variant="primary" className="h-10 w-full" onClick={() => handleStatusChange(biz.id, "under_review")}>Re-Enable for Review</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => <label className={className}>{children}</label>;
const Settings = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
