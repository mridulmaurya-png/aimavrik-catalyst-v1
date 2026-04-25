import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="final-cta" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-primary/[0.06] blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-label-sm text-brand-primary mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Ready to grow?
        </div>

        <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary mb-6">
          Start Capturing and Converting{" "}
          <span className="gradient-text-primary">Leads Today</span>
        </h2>
        <p className="text-body-lg text-brand-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
          Stop losing customers to slow follow-up. Get a system that responds instantly, follows up automatically, and helps you close more deals.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            id="final-cta-activate"
            className="btn btn-primary group text-body-lg !h-14 !px-8"
          >
            Activate My System
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <p className="text-body-sm text-brand-text-tertiary mt-6">
          Free to start • No credit card required • Setup in minutes
        </p>
      </div>
    </section>
  );
}
