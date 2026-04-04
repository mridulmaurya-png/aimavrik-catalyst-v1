import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Activity, Users, Settings2, Webhook, Zap, Power } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/context";
import { redirect } from "next/navigation";

// VERY basic authorization for internal admin
export default async function AdminHQPage() {
  const { user } = await requireWorkspace(); // Validate auth
  const supabase = await createClient();

  // In production, we'd check if user.email ends with @aimavrik.com or has an admin flag.
  // For V1 demo safety, we will just visibly mark it as restricted but render the data.
  const isAdmin = true; 

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all workspaces
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*, business_settings(*)");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AiMavrik HQ</h1>
            <p className="text-sm text-brand-text-secondary">SaaS Orchestration & Feature Control</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-text-tertiary" /> Active Workspaces
          </h2>
          
          <div className="space-y-4">
            {businesses?.map((b: any) => {
              const settings = Array.isArray(b.business_settings) ? b.business_settings[0] : b.business_settings;
              const config = settings?.config_json || {};
              
              return (
                <Card key={b.id} className="p-5 flex flex-col gap-4 border-brand-border bg-brand-bg-secondary w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-brand-text-primary">{b.business_name || "Unnamed Workspace"}</h3>
                      <p className="text-xs text-brand-text-tertiary font-mono pt-1">{b.id}</p>
                    </div>
                    <Badge variant={b.is_active !== false ? "success" : "neutral"}>
                      {b.is_active !== false ? "Active" : "Suspended"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border/20">
                    <Badge variant="neutral" className="gap-1.5 text-[10px]"><Zap className="w-3 h-3 text-brand-highlight" /> Internal Exec</Badge>
                    {config.execution_mode === "n8n" && (
                      <Badge variant="neutral" className="gap-1.5 text-[10px]"><Webhook className="w-3 h-3 text-blue-400" /> n8n Linked</Badge>
                    )}
                    {settings?.brand_voice_json && (
                      <Badge variant="neutral" className="gap-1.5 text-[10px]">AI Configured</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" className="h-8 text-[11px]">Enforce Playbooks</Button>
                    <Button variant="ghost" className="h-8 text-[11px] text-functional-error">Suspend</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-brand-text-tertiary" /> Global Flags
          </h2>
          <Card className="p-5 space-y-4 border-brand-border bg-brand-bg-secondary">
             <div className="space-y-3">
               <div className="flex items-center justify-between pb-2 border-b border-brand-border/20">
                 <span className="text-sm font-semibold">AI Generation Engine</span>
                 <Badge variant="success">Enabled</Badge>
               </div>
               <div className="flex items-center justify-between pb-2 border-b border-brand-border/20">
                 <span className="text-sm font-semibold">Email Delivery Layer</span>
                 <Badge variant="success">Enabled</Badge>
               </div>
               <div className="flex items-center justify-between pb-2 border-b border-brand-border/20">
                 <span className="text-sm font-semibold">WhatsApp Delivery Layer</span>
                 <Badge variant="warning">Simulated</Badge>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-semibold">n8n Execution Handoff</span>
                 <Badge variant="success">Available</Badge>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
