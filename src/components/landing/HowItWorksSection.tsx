"use client";

const steps = [
  {
    num: "01",
    title: "A lead comes in from your ads or website",
    desc: "Someone fills a form, sends a message, or clicks your ad. The system captures it instantly.",
    emoji: "📩",
  },
  {
    num: "02",
    title: "They get an instant response",
    desc: "Within seconds, your lead receives a personalized reply. While they are still looking at their phone.",
    emoji: "⚡",
  },
  {
    num: "03",
    title: "Follow-ups happen automatically",
    desc: "If they don't reply, the system follows up. Again and again. Until they respond or you say stop.",
    emoji: "🔄",
  },
  {
    num: "04",
    title: "You close more deals",
    desc: "By the time you pick up the phone, your lead is warm, engaged, and ready to buy.",
    emoji: "🤝",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-primary tracking-widest mb-4">
            HOW IT WORKS
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary max-w-2xl mx-auto">
            4 steps. Zero effort on your part.
          </h2>
        </div>

        {/* Timeline layout */}
        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-brand-primary/30 via-brand-secondary/20 to-brand-highlight/30" />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="relative md:grid md:grid-cols-2 md:gap-12 md:py-8">
                  {/* Center dot */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-brand-bg-primary border-2 border-brand-primary/40 items-center justify-center">
                    <span className="text-lg">{step.emoji}</span>
                  </div>

                  {/* Content — alternates sides */}
                  <div className={`${isLeft ? "md:text-right md:pr-16" : "md:col-start-2 md:pl-16"}`}>
                    <div className={`relative flex ${isLeft ? "md:flex-row-reverse" : ""} items-start gap-5 p-7 rounded-2xl border border-brand-border/40 bg-brand-bg-secondary/20 hover:border-brand-primary/20 transition-all duration-300`}>
                      {/* Mobile emoji */}
                      <div className="md:hidden w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">{step.emoji}</span>
                      </div>

                      <div className={`space-y-2 flex-1 ${isLeft ? "md:text-right" : ""}`}>
                        <span className="text-label-sm text-brand-primary font-bold">
                          STEP {step.num}
                        </span>
                        <h3 className="text-heading-4 text-brand-text-primary">
                          {step.title}
                        </h3>
                        <p className="text-body-reg text-brand-text-secondary leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Empty spacer for the other side */}
                  {isLeft && <div className="hidden md:block" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
