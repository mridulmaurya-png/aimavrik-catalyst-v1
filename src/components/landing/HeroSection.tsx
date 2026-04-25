"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-brand-primary/[0.06] blur-[140px]" />
        <div className="absolute top-[-100px] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-secondary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[15%] w-[300px] h-[300px] rounded-full bg-brand-highlight/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-44 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ── Left: Copy ── */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-border bg-brand-bg-elevated/60 text-label-sm text-brand-text-secondary animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
              Trusted by growing businesses
            </div>

            <h1 className="text-display-l lg:text-display-xl leading-[1.05] text-brand-text-primary animate-fade-in-up">
              Turn Every Lead Into{" "}
              <span className="gradient-text-primary">
                Revenue Automatically
              </span>
            </h1>

            <p className="text-body-lg text-brand-text-secondary max-w-xl leading-relaxed animate-fade-in-up delay-100">
              No missed follow-ups. No manual chasing. Your leads get an instant response and automatic follow-up — so you close more deals without lifting a finger.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 animate-fade-in-up delay-200">
              <Link
                href="/signup"
                id="hero-cta-get-started"
                className="btn btn-primary group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                id="hero-cta-see-how"
                className="btn btn-secondary group"
              >
                <Play className="w-4 h-4" />
                See How It Works
              </a>
            </div>

            {/* Social proof micro-stat */}
            <div className="flex items-center gap-6 pt-4 animate-fade-in-up delay-300">
              <div className="flex flex-col">
                <span className="text-heading-3 text-brand-text-primary font-bold">10x</span>
                <span className="text-label-sm text-brand-text-tertiary">Faster Response</span>
              </div>
              <div className="w-px h-10 bg-brand-border/40" />
              <div className="flex flex-col">
                <span className="text-heading-3 text-brand-text-primary font-bold">24/7</span>
                <span className="text-label-sm text-brand-text-tertiary">Lead Handling</span>
              </div>
              <div className="w-px h-10 bg-brand-border/40" />
              <div className="flex flex-col">
                <span className="text-heading-3 text-brand-text-primary font-bold">3x</span>
                <span className="text-label-sm text-brand-text-tertiary">More Conversions</span>
              </div>
            </div>
          </div>

          {/* ── Right: Revenue Flow Visualization ── */}
          <div className="hidden lg:block">
            <RevenueFlowDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Revenue Flow Diagram — shows the business outcome, not tech ─── */
function RevenueFlowDiagram() {
  const stages = [
    { label: "Lead Comes In", emoji: "📩", glow: "from-blue-500/20 to-blue-400/5" },
    { label: "Instant Response", emoji: "⚡", glow: "from-violet-500/20 to-violet-400/5" },
    { label: "Auto Follow-Up", emoji: "🔄", glow: "from-cyan-500/20 to-cyan-400/5" },
    { label: "Deal Closed", emoji: "💰", glow: "from-emerald-500/20 to-emerald-400/5" },
  ];

  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-brand-primary/[0.04] blur-[60px]" />

      <div className="relative space-y-5">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="group relative flex items-center gap-5 p-5 rounded-2xl border border-brand-border/40 bg-brand-bg-secondary/30 backdrop-blur-sm transition-all duration-500 hover:border-brand-primary/30 hover:bg-brand-bg-elevated/50 animate-fade-in-right"
            style={{ animationDelay: `${i * 150 + 200}ms` }}
          >
            {/* Step number */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-bg-primary border border-brand-border flex items-center justify-center">
              <span className="text-[10px] font-bold text-brand-primary">{i + 1}</span>
            </div>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stage.glow} border border-brand-border/30 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
              <span className="text-2xl">{stage.emoji}</span>
            </div>

            {/* Label */}
            <div>
              <span className="text-heading-4 text-brand-text-primary block">{stage.label}</span>
              <span className="text-body-sm text-brand-text-tertiary">
                {i === 0 && "From ads, website, or referral"}
                {i === 1 && "Within seconds, not hours"}
                {i === 2 && "Until they reply or convert"}
                {i === 3 && "More revenue, zero effort"}
              </span>
            </div>

            {/* Connector line to next */}
            {i < stages.length - 1 && (
              <div className="absolute bottom-0 left-[38px] translate-y-full w-px h-5 bg-gradient-to-b from-brand-border/40 to-transparent" />
            )}
          </div>
        ))}
      </div>

      {/* Revenue result badge */}
      <div className="mt-6 flex justify-center animate-fade-in-up" style={{ animationDelay: "900ms" }}>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-functional-success/30 bg-functional-success/10">
          <span className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
          <span className="text-body-sm font-medium text-functional-success">Revenue on autopilot</span>
        </div>
      </div>
    </div>
  );
}
