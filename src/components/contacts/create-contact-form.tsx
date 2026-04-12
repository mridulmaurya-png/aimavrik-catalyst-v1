"use client";

import * as React from "react";
import { createLead } from "@/app/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, UserPlus } from "lucide-react";

export function CreateContactModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createLead(formData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-brand-bg-secondary w-full max-w-md rounded-xl shadow-2xl border border-brand-border/40 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-brand-border/20 bg-brand-bg-primary/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold text-lg">Add New Lead</h3>
          </div>
          <button onClick={onClose} className="text-brand-text-tertiary hover:text-brand-text-primary transition-colors hover:bg-brand-border/30 p-1.5 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form action={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-functional-error/10 border border-functional-error/20 text-functional-error text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-text-tertiary">Full Name</label>
              <Input name="full_name" placeholder="E.g. Alex Rivera" className="bg-brand-bg-primary h-11" required />
              <p className="text-[10px] text-brand-text-secondary">Needed to address them personally in messages.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-text-tertiary">Email Address</label>
              <Input name="email" type="email" placeholder="alex@example.com" className="bg-brand-bg-primary h-11" />
              <p className="text-[10px] text-brand-text-secondary">Used for email follow-ups & newsletters.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-text-tertiary">Phone Number</label>
              <Input name="phone" type="tel" placeholder="+1234567890" className="bg-brand-bg-primary h-11" />
              <p className="text-[10px] text-brand-text-secondary">Used for WhatsApp and Voice Call assignments.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border/20">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" className="gap-2 px-6" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Capture Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
