"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, MailCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    
    // Use window.location.origin for the most reliable redirect base, 
    // falling back to env var only if window is undefined (which shouldn't happen in this client handler).
    const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/callback?next=/auth/update-password`,
      });

      if (resetError) {
        console.error("Reset error:", resetError);
        setError(resetError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Back to home – top-left exit path */}
        <a
          href="https://app.aimavrik.com"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs text-brand-text-tertiary hover:text-brand-text-secondary hover:underline transition-colors z-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </a>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="card-elevated p-8 space-y-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-functional-success/10 border border-functional-success/30 flex items-center justify-center mb-4">
               <MailCheck className="w-8 h-8 text-functional-success" />
            </div>
            <h2 className="text-heading-3 font-bold">Check your email</h2>
            <p className="text-body-md text-brand-text-secondary">
              If an account matches <span className="text-brand-text-primary font-bold">{email}</span>, we have sent a password reset link.
            </p>
            <div className="pt-6 w-full">
              <Link href="/login">
                <Button variant="secondary" className="w-full h-12 text-body-md font-bold">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary homepage link */}
        <a
          href="https://app.aimavrik.com"
          className="mt-6 text-xs text-brand-text-tertiary hover:text-brand-text-secondary hover:underline transition-colors"
        >
          Go to homepage
        </a>
      </div>
    )
  }

  return (
    <div className="relative min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
      {/* Back to home – top-left exit path */}
      <a
        href="https://app.aimavrik.com"
        className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs text-brand-text-tertiary hover:text-brand-text-secondary hover:underline transition-colors z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </a>

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-display-m font-bold tracking-tight">Reset password</h1>
          <p className="text-body-md text-brand-text-secondary">Enter your email to receive recovery instructions.</p>
        </div>

        <div className="card-elevated p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-primary/50 blur-sm" />
          
          <form className="space-y-4" onSubmit={handleReset}>
            {error && (
              <div className="p-3 rounded-lg bg-functional-error/10 border border-functional-error/20 text-functional-error text-body-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Email address</label>
              <Input 
                type="email" 
                placeholder="you@company.com" 
                className="h-12 bg-brand-bg-primary"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-body-md font-bold">
              {loading ? "Sending instructions..." : "Send reset link"}
            </Button>
          </form>

          <p className="text-center text-body-sm text-brand-text-tertiary">
            Remembered your password?{" "}
            <Link href="/login" className="text-brand-text-primary font-bold hover:text-brand-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Secondary homepage link below form */}
      <a
        href="https://app.aimavrik.com"
        className="mt-6 text-xs text-brand-text-tertiary hover:text-brand-text-secondary hover:underline transition-colors"
      >
        Go to homepage
      </a>
    </div>
  );
}
