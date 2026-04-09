import {
  Users,
  Send,
  RotateCcw,
  Bell,
  Headphones,
  Clock,
} from "lucide-react";

const cases = [
  {
    icon: Users,
    title: "Lead Capture & Qualification",
    desc: "Capture leads from any source and qualify them automatically before routing to sales.",
  },
  {
    icon: Send,
    title: "Follow-up Automation",
    desc: "Multi-touch sequences that run until there is a clear outcome.",
  },
  {
    icon: RotateCcw,
    title: "Missed Lead Recovery",
    desc: "Re-engage cold leads and missed calls with automated recovery workflows.",
  },
  {
    icon: Bell,
    title: "Appointment Reminders",
    desc: "Reduce no-shows with automated reminders across WhatsApp, SMS, and email.",
  },
  {
    icon: Headphones,
    title: "Customer Support Automation",
    desc: "Deflect repetitive queries with AI-powered support that escalates when needed.",
  },
  {
    icon: Clock,
    title: "Lifecycle Messaging",
    desc: "Onboarding, renewal, and retention messages triggered by lifecycle events.",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 lg:py-32 bg-brand-bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-primary tracking-widest mb-4">
            USE CASES
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary">
            What you can automate
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-4 p-6 rounded-xl border border-brand-border/30 bg-brand-bg-primary/50 hover:border-brand-primary/20 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 border border-brand-secondary/15 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-brand-secondary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-heading-4 text-brand-text-primary">
                  {item.title}
                </h3>
                <p className="text-body-sm text-brand-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
