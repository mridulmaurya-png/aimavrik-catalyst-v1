import { XCircle } from "lucide-react";

const problems = [
  "Leads are not contacted fast enough",
  "Follow-ups get missed",
  "Conversations go cold",
  "Manual operations slow everything down",
  "Tools exist but are not connected",
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <p className="text-label-sm text-brand-primary tracking-widest mb-4">
          THE PROBLEM
        </p>
        <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary mb-12">
          Most businesses lose revenue in the gaps.
        </h2>

        <div className="space-y-4">
          {problems.map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-4 px-5 rounded-xl border border-brand-border/40 bg-brand-bg-secondary/30"
            >
              <XCircle className="w-5 h-5 text-functional-error/60 shrink-0" />
              <span className="text-body-lg text-brand-text-secondary">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
