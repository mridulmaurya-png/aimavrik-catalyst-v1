"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Globe,
  Calendar,
  MessageSquare,
  Loader2,
  Filter,
} from "lucide-react";
import {
  getInsightLabel,
  getInsightPriorityColor,
} from "@/lib/intelligence/types";

interface InsightData {
  id: string;
  type: string;
  priority: string;
  message: string;
  recommended_action?: string;
  status: string;
  lead_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

function getInsightIcon(type: string) {
  switch (type) {
    case "no_response": return AlertTriangle;
    case "followup_not_triggered": return MessageSquare;
    case "channel_failure": return AlertTriangle;
    case "language_mismatch": return Globe;
    case "festive_trigger": return Calendar;
    case "reengagement_opportunity": return TrendingUp;
    case "region_based_opportunity": return Globe;
    default: return Lightbulb;
  }
}

export function InsightsPanel({ insights }: { insights: InsightData[] }) {
  const [filter, setFilter] = React.useState<string>("all");

  const filteredInsights = filter === "all"
    ? insights
    : insights.filter(i => i.status === filter);

  const openCount = insights.filter(i => i.status === "open").length;
  const criticalCount = insights.filter(i => i.priority === "critical" || i.priority === "high").length;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Insights"
          value={insights.length}
          icon={Lightbulb}
        />
        <SummaryCard
          label="Open"
          value={openCount}
          icon={AlertTriangle}
          highlight={openCount > 0}
        />
        <SummaryCard
          label="High Priority"
          value={criticalCount}
          icon={TrendingUp}
          highlight={criticalCount > 0}
        />
        <SummaryCard
          label="Acted On"
          value={insights.filter(i => i.status === "acted").length}
          icon={MessageSquare}
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-brand-text-tertiary" />
        <div className="flex gap-1">
          {["all", "open", "acknowledged", "acted", "dismissed"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === s
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg-primary/30 text-brand-text-tertiary hover:text-brand-text-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {filteredInsights.length === 0 && (
          <div className="py-12 text-center text-brand-text-tertiary text-body-sm">
            No insights to display.
          </div>
        )}

        {filteredInsights.map(insight => {
          const Icon = getInsightIcon(insight.type);
          return (
            <Card key={insight.id} className="p-4 border border-brand-border/30 bg-brand-bg-primary/30 rounded-xl space-y-3 hover:border-brand-border/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  insight.priority === "critical" ? "bg-functional-error/10 text-functional-error" :
                  insight.priority === "high" ? "bg-functional-warning/10 text-functional-warning" :
                  "bg-brand-primary/10 text-brand-primary"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getInsightPriorityColor(insight.priority)} className="text-[9px]">
                      {insight.priority}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-tertiary">
                      {getInsightLabel(insight.type)}
                    </span>
                    <span className="text-[10px] text-brand-text-tertiary ml-auto">
                      {new Date(insight.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-body-sm text-brand-text-primary leading-relaxed">
                    {insight.message}
                  </p>

                  {insight.recommended_action && (
                    <p className="text-[11px] text-brand-text-secondary italic">
                      💡 {insight.recommended_action}
                    </p>
                  )}
                </div>

                <Badge
                  variant={insight.status === "open" ? "warning" : insight.status === "acted" ? "success" : "neutral"}
                  className="text-[9px] shrink-0"
                >
                  {insight.status}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, highlight }: { label: string; value: number; icon: any; highlight?: boolean }) {
  return (
    <Card className={`p-4 border rounded-xl text-center space-y-1 ${
      highlight ? "border-functional-warning/40 bg-functional-warning/5" : "border-brand-border/30 bg-brand-bg-primary/30"
    }`}>
      <Icon className={`w-4 h-4 mx-auto ${highlight ? "text-functional-warning" : "text-brand-text-tertiary"}`} />
      <p className="text-heading-3 font-bold">{value}</p>
      <p className="text-[9px] text-brand-text-tertiary uppercase tracking-widest font-bold">{label}</p>
    </Card>
  );
}
