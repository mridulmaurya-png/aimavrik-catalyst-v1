import { CheckCircle2 } from "lucide-react";

const points = [
  {
    label: "Not another dashboard",
    detail:
      "We don't give you a tool to figure out. We build the system and run it.",
  },
  {
    label: "Not DIY automation",
    detail: "You don't need to learn Zapier, n8n, or any workflow builder.",
  },
  {
    label: "Built for execution",
    detail:
      "Every workflow is designed to produce a measurable business outcome.",
  },
  {
    label: "Managed by experts",
    detail:
      "Your system is monitored, maintained, and improved by the AiMavrik team.",
  },
  {
    label: "Outcome focused",
    detail:
      "We measure leads contacted, appointments booked, and revenue recovered.",
  },
];

export function WhySection() {
  return (
    <section id="why-aimavrik" className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <p className="text-label-sm text-brand-primary tracking-widest mb-4">
          WHY US
        </p>
        <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary mb-12">
          Why AiMavrik Catalyst
        </h2>

        <div className="space-y-0">
          {points.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-5 py-6 border-b border-brand-border/30 last:border-b-0"
            >
              <CheckCircle2 className="w-5 h-5 text-brand-highlight shrink-0 mt-0.5" />
              <div>
                <p className="text-body-lg text-brand-text-primary font-semibold">
                  {point.label}
                </p>
                <p className="text-body-reg text-brand-text-secondary mt-1 leading-relaxed">
                  {point.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
