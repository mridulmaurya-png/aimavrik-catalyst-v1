import type { Metadata } from "next";
import {
  LandingHeader,
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  UseCasesSection,
  WhySection,
  FinalCTA,
  LandingFooter,
} from "@/components/landing";

export const metadata: Metadata = {
  title: "AiMavrik Catalyst — Managed AI Execution System",
  description:
    "AiMavrik Catalyst automates lead response, follow-ups, customer journeys, and operations through a managed AI execution system built for real business outcomes.",
};

/**
 * Root page — Landing experience for logged-out visitors.
 *
 * Auth routing is handled entirely by middleware.ts:
 *   - No session  → renders this landing page
 *   - Admin user  → redirected to /ops/workspaces
 *   - Client user → redirected to /dashboard
 */
export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <SectionDivider />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <UseCasesSection />
        <SectionDivider />
        <WhySection />
        <SectionDivider />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}

function SectionDivider() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-brand-border/50 to-transparent" />
    </div>
  );
}
