"use client";

import * as React from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        // Session established
        setCheckingSession(false);
        return;
      }
      
      if (event === "INITIAL_SESSION" && !session) {
        // No session on initial load, check if we're expecting a token
        const searchParams = new URLSearchParams(window.location.search);
        const hasCode = searchParams.has("code");
        const hash = window.location.hash;
        const hasHash = hash.includes("access_token") || hash.includes("type=recovery");

        if (!hasCode && !hasHash) {
          router.replace("/login?error=" + encodeURIComponent("Invalid or expired recovery session. Please request a new link."));
        } else {
          // Stay in checking state while SDK processes the code/hash
          setCheckingSession(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error("Update error:", updateError);
        // If it's a "token expired" or "invalid session" error, give a clear message
        if (updateError.message.includes("expired") || updateError.message.includes("invalid")) {
          setError("Your recovery link has expired or is no longer valid. Please request a new one.");
        } else {
          setError(updateError.message);
        }
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

  if (checkingSession) {
    return (
      <div className="min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
           <div className="w-12 h-12 rounded-xl bg-brand-primary/20 animate-spin" />
           <p className="text-body-sm text-brand-text-secondary font-medium">Verifying recovery session...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="card-elevated p-8 space-y-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-functional-success/10 border border-functional-success/30 flex items-center justify-center mb-4">
               <CheckCircle2 className="w-8 h-8 text-functional-success" />
            </div>
            <h2 className="text-heading-3 font-bold">Password updated</h2>
            <p className="text-body-md text-brand-text-secondary">
              Your password has been successfully reset. You can now access your account.
            </p>
            <div className="pt-6 w-full">
              <Link href="/dashboard">
                <Button variant="primary" className="w-full h-12 text-body-md font-bold">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-display-m font-bold tracking-tight">Set new password</h1>
          <p className="text-body-md text-brand-text-secondary">Please enter your new desired password.</p>
        </div>

        <div className="card-elevated p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-primary/50 blur-sm" />
          
          <form className="space-y-4" onSubmit={handleUpdate}>
            {error && (
              <div className="p-3 rounded-lg bg-functional-error/10 border border-functional-error/20 text-functional-error text-body-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">New Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-brand-bg-primary"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-body-md font-bold">
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
