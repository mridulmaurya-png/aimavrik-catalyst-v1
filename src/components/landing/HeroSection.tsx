import Link from "next/link";
import {
  ArrowRight,
  Users,
  Bot,
  Send,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-brand-primary/[0.05] blur-[120px]" />
        <div className="absolute top-[-100px] right-[10%] w-[300px] h-[300px] rounded-full bg-brand-secondary/[0.03] blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ── Left: Copy ── */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-border bg-brand-bg-elevated/60 text-label-sm text-brand-text-secondary">
              <span className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
              Managed AI Execution System
            </div>

            <h1 className="text-display-l lg:text-display-xl leading-[1.08] text-brand-text-primary">
              Your business doesn&rsquo;t need more tools.{" "}
              <span className="gradient-text-primary">
                It needs an AI system that actually runs.
              </span>
            </h1>

            <p className="text-body-lg text-brand-text-secondary max-w-xl leading-relaxed">
              AiMavrik Catalyst automates lead response, follow-ups, customer
              journeys, and operations through a managed AI execution system.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="mailto:hello@aimavrik.com?subject=Demo%20Request%20—%20AiMavrik%20Catalyst"
                id="hero-cta-demo"
                className="btn btn-primary group"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                href="/login"
                id="hero-cta-login"
                className="btn btn-secondary"
              >
                Login
              </Link>
            </div>
          </div>

          {/* ── Right: Abstract system diagram ── */}
          <div className="hidden lg:block">
            <WorkflowDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Abstract workflow diagram (no fake screenshots) ─── */
function WorkflowDiagram() {
  const nodes = [
    { label: "Lead Captured", icon: Users, col: 0, row: 0 },
    { label: "AI Qualifies", icon: Bot, col: 1, row: 0 },
    { label: "Auto Follow-up", icon: Send, col: 0, row: 1 },
    { label: "WhatsApp / Email", icon: MessageSquare, col: 1, row: 1 },
    { label: "Converted", icon: CheckCircle2, col: 0.5, row: 2 },
  ];

  return (
    <div className="relative w-full max-w-[480px] mx-auto aspect-[4/3.5]">
      {/* ── SVG connection lines ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 88"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6D5DFB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00D1FF" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* Row 0 horizontal */}
        <line x1="32" y1="14" x2="58" y2="14" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
        {/* Col 0 vertical */}
        <line x1="20" y1="24" x2="20" y2="38" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
        {/* Col 1 vertical */}
        <line x1="70" y1="24" x2="70" y2="38" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
        {/* Row 1 horizontal */}
        <line x1="32" y1="48" x2="58" y2="48" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
        {/* Converge to bottom center */}
        <line x1="20" y1="58" x2="42" y2="73" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
        <line x1="70" y1="58" x2="48" y2="73" stroke="url(#lg)" strokeWidth="0.6" strokeDasharray="3 2" />
      </svg>

      {/* ── Nodes ── */}
      {nodes.map((node, i) => {
        const left = node.col === 0.5 ? "50%" : node.col === 0 ? "20%" : "70%";
        const top = node.row === 0 ? "8%" : node.row === 1 ? "42%" : "76%";
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center gap-2.5 -translate-x-1/2"
            style={{ left, top }}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-bg-elevated border border-brand-border flex items-center justify-center shadow-card">
              <node.icon className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-[11px] font-medium text-brand-text-secondary whitespace-nowrap">
              {node.label}
            </span>
          </div>
        );
      })}

      {/* Central ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-brand-primary/[0.03] blur-[50px]" />
    </div>
  );
}
