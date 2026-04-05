"use client";

import * as React from "react";
import { submitOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("text-xs font-bold uppercase tracking-widest text-brand-text-tertiary", className)}>
        {children}
    </label>
);

import { cn } from "@/lib/utils";
import { 
  Check, 
  Loader2, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Mic2, 
  Bot, 
  Zap,
  Globe,
  Building2,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    business_type: "",
    use_case: "",
    lead_sources: [] as string[],
    monthly_volume: "",
    conversion_challenge: "",
    channels: [] as string[],
    ai_voice_needed: false,
    ai_chatbot_needed: false,
    notes: ""
  });

  const toggleChannel = (ch: string) => {
    setFormData(prev => ({
        ...prev,
        channels: prev.channels.includes(ch) ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitOnboarding(formData);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto overflow-hidden bg-brand-bg-secondary border-brand-border/40 shadow-glow animate-in zoom-in-95 duration-500">
      <div className="bg-brand-primary/5 p-8 border-b border-brand-primary/10 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand-primary" />
        </div>
        <div className="space-y-1">
            <h2 className="text-heading-3 font-bold text-brand-text-primary">Revenue Onboarding</h2>
            <p className="text-body-sm text-brand-text-tertiary">Let's configure your managed AiMavrik architecture.</p>
        </div>
      </div>

      <div className="p-8 space-y-8 min-h-[400px]">
        {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                    <Label className="text-xs uppercase font-bold text-brand-text-tertiary">1. Business Profile</Label>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                           <Label className="text-xs text-brand-text-secondary">Industry / Type of Business</Label>
                           <Input 
                             placeholder="e.g. Real Estate, Solar Energy, Law Firm..." 
                             className="bg-brand-bg-primary h-11 text-body-sm" 
                             value={formData.business_type} 
                             onChange={e => setFormData({...formData, business_type: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs text-brand-text-secondary">Primary Conversion Challenge</Label>
                           <Input 
                             placeholder="e.g. Fast lead response, Booking appointments..." 
                             className="bg-brand-bg-primary h-11 text-body-sm" 
                             value={formData.conversion_challenge} 
                             onChange={e => setFormData({...formData, conversion_challenge: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs text-brand-text-secondary">Monthly Lead Volume (Estimated)</Label>
                           <Input 
                             placeholder="e.g. 50-100 leads per month" 
                             className="bg-brand-bg-primary h-11 text-body-sm" 
                             value={formData.monthly_volume} 
                             onChange={e => setFormData({...formData, monthly_volume: e.target.value})}
                           />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button variant="primary" className="h-10 px-8 gap-2" onClick={() => setStep(2)}>
                        Requirements
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                    <Label className="text-xs uppercase font-bold text-brand-text-tertiary">2. Architecture Needs</Label>
                    
                    <div className="space-y-3">
                        <Label className="text-xs text-brand-text-secondary">Preferred Delivery Channels</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => toggleChannel('email')}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${formData.channels.includes('email') ? 'bg-brand-primary/10 border-brand-primary text-brand-text-primary' : 'bg-brand-bg-primary border-brand-border hover:border-brand-text-tertiary'}`}
                            >
                                <Mail className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Email</span>
                            </button>
                            <button 
                              onClick={() => toggleChannel('whatsapp')}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${formData.channels.includes('whatsapp') ? 'bg-brand-primary/10 border-brand-primary text-brand-text-primary' : 'bg-brand-bg-primary border-brand-border hover:border-brand-text-tertiary'}`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs text-brand-text-secondary">AI Enhancement Toggles</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center justify-between p-4 bg-brand-bg-primary rounded-xl border border-brand-border/40 cursor-pointer hover:border-brand-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <Mic2 className={`w-4 h-4 ${formData.ai_voice_needed ? 'text-brand-primary' : 'text-brand-text-tertiary'}`} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">AI Voice Agents</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded-md accent-brand-primary" 
                                    checked={formData.ai_voice_needed}
                                    onChange={e => setFormData({...formData, ai_voice_needed: e.target.checked})}
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 bg-brand-bg-primary rounded-xl border border-brand-border/40 cursor-pointer hover:border-brand-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <Bot className={`w-4 h-4 ${formData.ai_chatbot_needed ? 'text-brand-primary' : 'text-brand-text-tertiary'}`} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">Smart Chatbot</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded-md accent-brand-primary" 
                                    checked={formData.ai_chatbot_needed}
                                    onChange={e => setFormData({...formData, ai_chatbot_needed: e.target.checked})}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-brand-text-secondary">Integration Notes (n8n, CRM, Webhooks)</Label>
                        <Textarea 
                          placeholder="Describe your current tech stack or specific integration needs..." 
                          className="bg-brand-bg-primary min-h-[100px] text-body-sm" 
                          value={formData.notes}
                          onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                    <Button variant="ghost" className="h-10 px-6 font-bold text-brand-text-tertiary text-xs" onClick={() => setStep(1)}>
                        Go Back
                    </Button>
                    <Button variant="primary" className="h-10 px-8 gap-2" onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Submit Requirements
                    </Button>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 bg-brand-bg-primary/50 flex justify-center gap-2 border-t border-brand-border/20">
         <div className={`w-1.5 h-1.5 rounded-full ${step === 1 ? 'bg-brand-primary shadow-glow' : 'bg-brand-border'}`} />
         <div className={`w-1.5 h-1.5 rounded-full ${step === 2 ? 'bg-brand-primary shadow-glow' : 'bg-brand-border'}`} />
      </div>
    </Card>
  );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
    );
}
