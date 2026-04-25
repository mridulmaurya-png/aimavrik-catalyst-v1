import { MessageSquare, Mail, Phone, Clock } from "lucide-react";

const trustItems = [
  { icon: MessageSquare, label: "Works with WhatsApp" },
  { icon: Mail, label: "Works with Email" },
  { icon: Phone, label: "Works with Calls" },
  { icon: Clock, label: "Handles leads 24/7" },
];

export function TrustStrip() {
  return (
    <section className="py-10 border-y border-brand-border/20 bg-brand-bg-secondary/10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <item.icon className="w-5 h-5 text-brand-text-tertiary" />
              <span className="text-body-sm text-brand-text-tertiary font-medium whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
