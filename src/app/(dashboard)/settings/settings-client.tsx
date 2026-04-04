"use client";

import * as React from "react"
import { SettingsTabNav, SettingsFormGroup } from "@/components/settings/settings-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, ShieldCheck, Mail, MapPin, Phone, RefreshCw } from "lucide-react";
import { updateBusinessSetting } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/client";

export default function SettingsClient({ initialBusiness, initialSettings }: { initialBusiness: any, initialSettings: any }) {
  const [activeTab, setActiveTab] = React.useState('profile')
  const [saving, setSaving] = React.useState(false)
  const [savedParams, setSavedParams] = React.useState<Record<string, boolean>>({})

  // Form State
  const [businessName, setBusinessName] = React.useState(initialBusiness.business_name || '')
  const [website, setWebsite] = React.useState(initialBusiness.website || '')
  const [timezone, setTimezone] = React.useState(initialBusiness.timezone || '')
  const [businessType, setBusinessType] = React.useState(initialBusiness.business_type || '')
  
  const [supportEmail, setSupportEmail] = React.useState(initialSettings.support_email || '')
  const [supportPhone, setSupportPhone] = React.useState(initialSettings.support_phone || '')
  
  // JSON State
  const [tone, setTone] = React.useState(initialSettings.brand_voice_json?.tone || 'Helpful & Minimal')
  const [restrictedWords, setRestrictedWords] = React.useState(
    (initialSettings.brand_voice_json?.restrictedWords || []).join(', ')
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'profile') {
        const supabase = createClient()
        // Basic business table updates (skipped for server action brevity, doing direct if safe)
        // Wait, best is via Server actions. I'll just update settings for now as requested.
        await updateBusinessSetting('support_email', supportEmail)
        await updateBusinessSetting('support_phone', supportPhone)
        
        // Let's do a direct update for `businesses` table just for thoroughness here since row access fits RLS
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("businesses").update({
            business_name: businessName,
            website,
            timezone,
            business_type: businessType
          }).eq("id", initialSettings.business_id)
        }
      } else if (activeTab === 'voice') {
        const words = restrictedWords.split(',').map((w: string) => w.trim()).filter((w: string) => w)
        await updateBusinessSetting('brand_voice_json', {
          tone,
          restrictedWords: words
        })
      }
      
      setSavedParams({ ...savedParams, [activeTab]: true })
      setTimeout(() => setSavedParams(prev => ({ ...prev, [activeTab]: false })), 2000)
    } catch (e) {
      console.error(e)
      alert("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Settings</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Configure business details, communication rules, and system behavior.
          </p>
        </div>
        <Button className="h-11 px-6 gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savedParams[activeTab] ? "Saved!" : "Save all changes"}
        </Button>
      </div>

      <SettingsTabNav active={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
          <SettingsFormGroup title="Business Profile" subtitle="Basic identity information used across all outreach.">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Business Name</label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} className="bg-brand-bg-primary h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Website URL</label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} className="bg-brand-bg-primary h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Timezone</label>
                <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="bg-brand-bg-primary h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Business Category</label>
                <Input value={businessType} onChange={e => setBusinessType(e.target.value)} className="bg-brand-bg-primary h-11" />
              </div>
            </div>
          </SettingsFormGroup>

          <SettingsFormGroup title="Main Contact Details" subtitle="Recovery and escalation contact points.">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary" />
                  <Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="bg-brand-bg-primary pl-10 h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Support Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary" />
                  <Input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className="bg-brand-bg-primary pl-10 h-11" />
                </div>
              </div>
            </div>
          </SettingsFormGroup>
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
          <SettingsFormGroup title="Brand Voice & Personality" subtitle="Define how the AI represents your business.">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Messaging Tone</label>
                <div className="flex gap-2">
                  {['Helpful & Minimal', 'Bold & Direct', 'Friendly & Warm'].map(t => (
                    <Badge 
                      key={t}
                      variant={tone === t ? "success" : "neutral"} 
                      className="px-4 py-1.5 cursor-pointer hover:bg-white/[0.05]"
                      onClick={() => setTone(t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-brand-text-tertiary pt-1">Used to influence word choice in AI message generation.</p>
              </div>

              <div className="space-y-2">
                <label className="text-label-sm font-bold text-brand-text-secondary">Restricted Words</label>
                <textarea 
                  value={restrictedWords}
                  onChange={e => setRestrictedWords(e.target.value)}
                  className="w-full bg-brand-bg-primary border border-brand-border rounded-lg p-3 text-body-sm min-h-[100px] focus:outline-none focus:border-brand-primary/50"
                  placeholder="e.g. magic, revolution, seamless, unlock..."
                />
              </div>
            </div>
          </SettingsFormGroup>
        </div>
      )}

      {activeTab !== 'profile' && activeTab !== 'voice' && (
        <div className="p-12 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-brand-text-tertiary mx-auto opacity-20" />
          <p className="text-body-sm text-brand-text-tertiary uppercase tracking-widest font-bold">Additional configurations in review</p>
        </div>
      )}
    </div>
  );
}
