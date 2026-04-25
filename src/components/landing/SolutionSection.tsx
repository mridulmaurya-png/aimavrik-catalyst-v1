import {
  Zap,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";

const solutions = [
  {
    icon: Target,
    title: "Captures Every Lead",
    desc: "No lead slips through the cracks. Every enquiry from any source is captured and tracked automatically.",
    accent: "text-brand-primary",
    bg: "bg-brand-primary/10 border-brand-primary/20",
  },
  {
    icon: Zap,
    title: "Responds Instantly",
    desc: "Your leads get a response within seconds — not hours. While they are still interested and ready to talk.",
    accent: "text-brand-secondary",
    bg: "bg-brand-secondary/10 border-brand-secondary/20",
  },
  {
    icon: RotateCcw,
    title: "Follows Up Automatically",
    desc: "No more forgetting to follow up. The system keeps the conversation going until they respond or convert.",
    accent: "text-brand-highlight",
    bg: "bg-brand-highlight/10 border-brand-highlight/20",
  },
  {
    icon: TrendingUp,
    title: "Converts More Deals",
    desc: "Faster response + consistent follow-up = more customers. Simple math, done automatically.",
    accent: "text-functional-success",
    bg: "bg-functional-success/10 border-functional-success/20",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 lg:py-32 bg-brand-bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-primary tracking-widest mb-4">
            THE FIX
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary max-w-3xl mx-auto">
            One system that handles your leads from first click to closed deal.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {solutions.map((item, i) => (
            <div
              key={i}
              className="group card-elevated p-8 space-y-5 hover:border-brand-primary/25 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className={`w-6 h-6 ${item.accent}`} />
              </div>
              <h3 className="text-heading-3 text-brand-text-primary">
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
