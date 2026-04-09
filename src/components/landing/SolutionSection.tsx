import {
  Zap,
  RotateCcw,
  MessageSquare,
  Bot,
  Settings,
  Shield,
} from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    desc: "New leads are contacted within seconds — not hours.",
  },
  {
    icon: RotateCcw,
    title: "Automated Follow-ups",
    desc: "Multi-step sequences that run until the lead converts or opts out.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp & Email Workflows",
    desc: "Reach leads through the channels they actually use.",
  },
  {
    icon: Bot,
    title: "AI Chatbot & Voice Automation",
    desc: "Conversational agents that qualify and respond around the clock.",
  },
  {
    icon: Settings,
    title: "Internal Operations Control",
    desc: "Automate hand-offs, assignments, and notifications across your team.",
  },
  {
    icon: Shield,
    title: "Managed by AiMavrik",
    desc: "We build, monitor, and maintain your execution layer. You focus on growth.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 lg:py-32 bg-brand-bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-primary tracking-widest mb-4">
            THE SOLUTION
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary">
            AiMavrik Catalyst fixes the execution layer.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((item, i) => (
            <div
              key={i}
              className="group card-elevated p-7 space-y-4 hover:border-brand-primary/25 transition-colors duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <h3 className="text-heading-4 text-brand-text-primary">
                {item.title}
              </h3>
              <p className="text-body-reg text-brand-text-secondary leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
