import type { Metadata } from "next";
import {
  LandingHeader,
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  ValueSection,
  FinalCTA,
  TrustStrip,
  LandingFooter,
} from "@/components/landing";

export const metadata: Metadata = {
  title: "AiMavrik Catalyst — Turn Every Lead Into Revenue",
  description:
    "Stop losing leads. AiMavrik captures, responds, and follows up with every lead automatically — so you close more deals without lifting a finger.",
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
        <TrustStrip />
        <SectionDivider />
        <ProblemSection />
        <SolutionSection />
        <SectionDivider />
        <HowItWorksSection />
        <SectionDivider />
        <ValueSection />
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
