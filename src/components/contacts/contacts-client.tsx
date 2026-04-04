"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Users, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatStage, LIFECYCLE_STAGES } from "@/lib/config/constants";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: string | null;
  contact_type: string | null;
  last_active_at: string | null;
  first_seen_at: string | null;
  total_revenue: number | null;
  metadata_json: any;
}

const STAGE_FILTERS = [
  { id: "all", label: "All Contacts" },
  { id: "new", label: "New Leads" },
  { id: "engaged", label: "Engaged" },
  { id: "qualified", label: "Qualified" },
  { id: "converted", label: "Converted" },
  { id: "churned", label: "Churned" },
];

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ContactsClient({ contacts, currencyCode }: { contacts: Contact[]; currencyCode: string }) {
  const [search, setSearch] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    let result = contacts;

    if (stageFilter !== "all") {
      result = result.filter(c => (c.stage || "new") === stageFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.source || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [contacts, search, stageFilter]);

  const stageCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length };
    contacts.forEach(c => {
      const stage = c.stage || "new";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [contacts]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Contacts</h1>
          <p className="text-brand-text-secondary text-body-sm">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in your revenue pipeline.
          </p>
        </div>
        <Button disabled title="Manual contact addition — use CSV import or webhook" className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed">
          <Users className="w-4 h-4" />
          Add contact
        </Button>
      </div>

      {/* Search + Count Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary group-focus-within:text-brand-primary transition-colors" />
          <Input
            className="pl-10 h-11 bg-brand-bg-secondary"
            placeholder="Search by name, email, phone, or source..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stage Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {STAGE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setStageFilter(f.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-label-sm font-semibold transition-all duration-200 border flex items-center gap-2",
              stageFilter === f.id
                ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                : "bg-brand-bg-elevated/50 border-brand-border text-brand-text-tertiary hover:border-brand-text-secondary hover:text-brand-text-secondary"
            )}
          >
            {f.label}
            <span className="text-[10px] font-mono opacity-70">
              {stageCounts[f.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-brand-border/50">
                <TableHead>Name</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(contact => {
                const segment = contact.metadata_json?.segment || contact.contact_type || "lead";
                const opportunityValue = contact.metadata_json?.opportunity_value || contact.total_revenue;

                return (
                  <TableRow key={contact.id} className="group cursor-pointer border-brand-border/30">
                    <TableCell>
                      <Link href={`/contacts/${contact.id}`} className="flex flex-col">
                        <span className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors truncate max-w-[200px]">
                          {contact.full_name || "Unknown"}
                        </span>
                        <span className="text-[11px] text-brand-text-tertiary truncate max-w-[200px]">
                          {contact.email || contact.phone || "—"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        contact.stage === 'converted' ? 'success' :
                        contact.stage === 'engaged' || contact.stage === 'qualified' ? 'info' :
                        contact.stage === 'churned' ? 'error' : 'neutral'
                      } className="text-[10px] capitalize">
                        {formatStage(contact.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-body-sm text-brand-text-secondary capitalize">
                      {(contact.source || "manual").replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <span className="text-body-sm text-brand-text-secondary capitalize">
                        {segment.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-brand-highlight text-body-sm">
                      {opportunityValue ? formatCurrency(opportunityValue, currencyCode) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-body-sm text-brand-text-tertiary">
                      {formatTimeAgo(contact.last_active_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="p-16 border rounded-xl border-dashed border-brand-border flex flex-col items-center justify-center bg-brand-bg-secondary/30 gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-bg-primary border border-brand-border flex items-center justify-center">
            <Inbox className="w-5 h-5 text-brand-text-tertiary" />
          </div>
          <div className="text-center">
            <h3 className="text-body-lg font-bold text-brand-text-primary">
              {search || stageFilter !== "all" ? "No contacts match your filters" : "No contacts yet"}
            </h3>
            <p className="text-brand-text-tertiary text-body-sm max-w-sm mt-1">
              {search || stageFilter !== "all"
                ? "Try adjusting your search or stage filter."
                : "Import contacts via CSV or connect a webhook to start capturing leads."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
