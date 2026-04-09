import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="final-cta" className="py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary mb-6">
          Let us build your{" "}
          <span className="gradient-text-primary">AI operating layer.</span>
        </h2>
        <p className="text-body-lg text-brand-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
          Stop losing revenue in the gaps between your tools and your team. Talk
          to AiMavrik about a managed execution system built for your business.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:hello@aimavrik.com?subject=Demo%20Request%20—%20AiMavrik%20Catalyst"
            id="final-cta-demo"
            className="btn btn-primary group"
          >
            Book Demo
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link href="/login" id="final-cta-login" className="btn btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
