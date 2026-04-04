import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { computeSegments } from "@/lib/engine/segments";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { 
  AlertCircle, Clock, Flame, Diamond, Moon, Layers, TrendingUp, RefreshCw, 
  Users, Target, Inbox
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  alert: AlertCircle,
  clock: Clock,
  flame: Flame,
  diamond: Diamond,
  moon: Moon,
  layers: Layers,
  "trending-up": TrendingUp,
  refresh: RefreshCw,
};

const CATEGORY_LABELS: Record<string, string> = {
  recovery: "Pipeline Recovery",
  remarketing: "Remarketing",
  revenue: "Revenue Expansion",
  lifecycle: "Lifecycle",
};

export default async function SegmentsPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const segments = await computeSegments(supabase, businessId);

  // Total contacts
  const { count: totalContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  // Group by category
  const grouped = new Map<string, typeof segments>();
  segments.forEach(s => {
    const cat = s.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(s);
  });

  const totalSegmented = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Segments</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Dynamic audience segments computed from your contact data in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-heading-4 font-bold">{totalContacts || 0}</p>
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Total Contacts</p>
          </div>
          <div className="w-px h-8 bg-brand-border" />
          <div className="text-right">
            <p className="text-heading-4 font-bold text-brand-primary">{totalSegmented}</p>
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Segmented</p>
          </div>
        </div>
      </div>

      {/* Segment Category Sections */}
      {Array.from(grouped.entries()).map(([catId, segs]) => (
        <div key={catId} className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-text-tertiary" />
            <h3 className="text-heading-4 font-bold">{CATEGORY_LABELS[catId] || catId}</h3>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {segs.map(segment => {
              const Icon = ICON_MAP[segment.icon] || Users;
              return (
                <Card key={segment.id} variant="elevated" className="p-6 space-y-4 group hover:border-brand-primary/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-text-tertiary group-hover:text-brand-primary transition-colors" />
                    </div>
                    <Badge variant={segment.count > 0 ? "info" : "neutral"} className="text-[10px]">
                      {segment.count > 0 ? "Active" : "Empty"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-body-md font-bold text-brand-text-primary">{segment.name}</h4>
                    <p className="text-[11px] text-brand-text-tertiary leading-relaxed">{segment.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-border/30">
                    <div>
                      <p className="text-heading-4 font-bold text-brand-primary">{segment.count}</p>
                      <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Contacts</p>
                    </div>
                    {segment.count > 0 && (
                      <Link href="/contacts" className="text-[11px] text-brand-primary font-bold hover:underline">
                        View →
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {(totalContacts || 0) === 0 && (
        <div className="p-16 border rounded-xl border-dashed border-brand-border flex flex-col items-center justify-center gap-3 bg-brand-bg-secondary/30">
          <Inbox className="w-8 h-8 text-brand-text-tertiary opacity-40" />
          <div className="text-center">
            <h3 className="text-body-lg font-bold text-brand-text-primary">No contacts to segment</h3>
            <p className="text-brand-text-tertiary text-body-sm max-w-sm mt-1">
              Import contacts via CSV or webhook, then segments will populate automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
