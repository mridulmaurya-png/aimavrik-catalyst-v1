const steps = [
  {
    num: "01",
    title: "You share your business workflow",
    desc: "Tell us how your business acquires, converts, and serves customers today.",
  },
  {
    num: "02",
    title: "AiMavrik designs your system",
    desc: "We map your processes into automated, monitored workflows.",
  },
  {
    num: "03",
    title: "We connect integrations",
    desc: "Your CRM, channels, and tools are integrated — no migration required.",
  },
  {
    num: "04",
    title: "Your workflows run automatically",
    desc: "Automations go live with ongoing oversight, tuning, and support.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-primary tracking-widest mb-4">
            PROCESS
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary">
            How AiMavrik Catalyst works
          </h2>
        </div>

        <div className="relative grid md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex gap-6 p-7 rounded-2xl border border-brand-border/40 bg-brand-bg-secondary/20"
            >
              <span className="text-display-l font-bold text-brand-primary/12 leading-none select-none shrink-0">
                {step.num}
              </span>
              <div className="space-y-2 pt-1">
                <h3 className="text-heading-4 text-brand-text-primary">
                  {step.title}
                </h3>
                <p className="text-body-reg text-brand-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
