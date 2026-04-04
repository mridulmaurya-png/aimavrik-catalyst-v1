"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(searchParams?.get("error") || "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Check for workspace
        const { data: membership, error: memberError } = await supabase
          .from("team_members")
          .select("business_id")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();

        if (memberError && memberError.code !== 'PGRST116') {
            console.error("Error fetching workspace:", memberError);
        }

        if (membership && membership.business_id) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-display-m font-bold tracking-tight">Welcome back</h1>
        <p className="text-body-md text-brand-text-secondary">Log in to Catalyst Command Center</p>
      </div>

      <div className="card-elevated p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-primary/50 blur-sm" />
        
        <form className="space-y-4" onSubmit={handleLogin}>
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
            <div className="flex items-center justify-between">
              <label className="text-label-sm font-bold text-brand-text-secondary">Password</label>
              <Link href="/reset-password" className="text-[11px] text-brand-primary hover:text-brand-highlight transition-colors font-medium">Forgot password?</Link>
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 bg-brand-bg-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-body-md font-bold">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-body-sm text-brand-text-tertiary">
          Don't have an account?{" "}
          <Link href="/signup" className="text-brand-text-primary font-bold hover:text-brand-primary transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[100vh] bg-brand-bg-primary text-brand-text-primary flex flex-col items-center justify-center p-6 lg:p-12">
      <Suspense fallback={<div className="text-brand-text-tertiary animate-pulse">Loading login...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
