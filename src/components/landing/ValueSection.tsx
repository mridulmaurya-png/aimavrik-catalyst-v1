import { TrendingUp, Clock, DollarSign, UserCheck } from "lucide-react";

const outcomes = [
  {
    icon: TrendingUp,
    stat: "3x",
    label: "More Conversions",
    detail: "Leads that get an instant response are 3x more likely to become paying customers.",
    color: "text-brand-primary",
    borderColor: "border-brand-primary/20",
    bgColor: "bg-brand-primary/10",
  },
  {
    icon: Clock,
    stat: "< 60s",
    label: "Response Time",
    detail: "Your leads hear back within a minute. Not hours. Not days. While they still care.",
    color: "text-brand-secondary",
    borderColor: "border-brand-secondary/20",
    bgColor: "bg-brand-secondary/10",
  },
  {
    icon: DollarSign,
    stat: "+40%",
    label: "Revenue Recovered",
    detail: "Stop paying for leads that go nowhere. Turn every ad dollar into an actual conversation.",
    color: "text-brand-highlight",
    borderColor: "border-brand-highlight/20",
    bgColor: "bg-brand-highlight/10",
  },
  {
    icon: UserCheck,
    stat: "0",
    label: "Manual Work",
    detail: "No spreadsheets. No reminders. No hiring someone to chase leads. It just runs.",
    color: "text-functional-success",
    borderColor: "border-functional-success/20",
    bgColor: "bg-functional-success/10",
  },
];

export function ValueSection() {
  return (
    <section id="value" className="py-24 lg:py-32 bg-brand-bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-brand-highlight tracking-widest mb-4">
            RESULTS
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary max-w-3xl mx-auto mb-6">
            What changes when every lead gets handled.
          </h2>
          <p className="text-body-lg text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            These are not features. These are the business outcomes you get when leads stop falling through the cracks.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {outcomes.map((item, i) => (
            <div
              key={i}
              className={`group relative p-7 rounded-2xl border ${item.borderColor} bg-brand-bg-primary/50 hover:bg-brand-bg-elevated/50 transition-all duration-300 text-center`}
            >
              {/* Top accent */}
              <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent ${item.color.replace("text-", "via-")}/30 to-transparent`} />

              <div className={`w-14 h-14 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>

              <div className={`text-display-l font-bold ${item.color} mb-1`}>
                {item.stat}
              </div>
              <h3 className="text-heading-4 text-brand-text-primary mb-3">
                {item.label}
              </h3>
              <p className="text-body-sm text-brand-text-secondary leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
