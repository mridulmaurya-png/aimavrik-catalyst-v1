"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    
    // Auto-confirm for simple testing, or production setting required
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-display-m font-bold tracking-tight">Create an account</h1>
          <p className="text-body-md text-brand-text-secondary">Start automating your revenue execution</p>
        </div>

        <div className="card-elevated p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-primary/50 blur-sm" />
          
          <form className="space-y-4" onSubmit={handleSignup}>
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
            <div className="space-y-2">
              <label className="text-label-sm font-bold text-brand-text-secondary">Password</label>
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
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="text-center text-body-sm text-brand-text-tertiary">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-text-primary font-bold hover:text-brand-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
