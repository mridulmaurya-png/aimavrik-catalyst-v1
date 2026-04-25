"use client";

import { XCircle, Clock, DollarSign, UserX } from "lucide-react";

const problems = [
  {
    icon: Clock,
    pain: "Slow Response Time",
    detail: "By the time you reply, they have already gone to your competitor.",
  },
  {
    icon: UserX,
    pain: "Missed Follow-Ups",
    detail: "80% of deals need 5+ follow-ups. Most businesses stop after one.",
  },
  {
    icon: DollarSign,
    pain: "Lost Revenue Every Day",
    detail: "Every lead that goes cold is money you already spent to acquire — wasted.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-label-sm text-functional-error/80 tracking-widest mb-4">
            THE PROBLEM
          </p>
          <h2 className="text-heading-1 lg:text-display-l text-brand-text-primary mb-6 max-w-3xl mx-auto">
            You are losing revenue every day because leads are not handled instantly.
          </h2>
          <p className="text-body-lg text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            Your ads are working. Leads are coming in. But without instant response and consistent follow-up, most of them never become customers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((item, i) => (
            <div
              key={i}
              className="group relative p-7 rounded-2xl border border-functional-error/10 bg-functional-error/[0.02] hover:border-functional-error/20 transition-all duration-300"
            >
              {/* Red accent line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-functional-error/30 to-transparent" />

              <div className="w-12 h-12 rounded-xl bg-functional-error/10 border border-functional-error/15 flex items-center justify-center mb-5">
                <item.icon className="w-6 h-6 text-functional-error/70" />
              </div>
              <h3 className="text-heading-4 text-brand-text-primary mb-2">
                {item.pain}
              </h3>
              <p className="text-body-reg text-brand-text-secondary leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom urgency callout */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-functional-warning/25 bg-functional-warning/[0.05]">
            <XCircle className="w-4 h-4 text-functional-warning" />
            <span className="text-body-sm text-functional-warning font-medium">
              Every hour without follow-up drops your conversion rate by 50%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
