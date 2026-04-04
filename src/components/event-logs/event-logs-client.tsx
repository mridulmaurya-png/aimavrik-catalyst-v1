"use client";

import * as React from "react"
import { EventDetailDrawer } from "@/components/event-logs/event-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  RefreshCw,
  Zap,
  Download,
  Inbox
} from "lucide-react";

interface EventLog {
  id: string;
  event_type: string;
  source: string;
  status: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  payload_json: any;
}

export default function EventLogsClient({ events }: { events: EventLog[] }) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  const handleRowClick = (event: EventLog) => {
    setSelectedEvent({
      id: event.id,
      type: event.event_type,
      source: event.source,
      contact: event.contact_name || event.contact_email || "Unknown",
      receivedAt: new Date(event.created_at).toLocaleString(),
      status: event.status,
      outcomeBadge: event.status === "processed" ? "processed" : event.status,
      outcomeDetail: event.payload_json?.intent || event.event_type
    });
    setIsDrawerOpen(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Event Logs</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Monitor every business event entering and moving through your system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled className="gap-2 h-11 px-4 bg-white/[0.02] border border-brand-border/50 opacity-50 cursor-not-allowed" title="Export available in production tier">
            <Download className="w-4 h-4 text-brand-text-tertiary" />
            Export Logs
          </Button>
          <Button disabled className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed" title="Test suite available in production tier">
            <Zap className="w-4 h-4" />
            Run Test Event
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
            <span className="text-[11px] text-brand-text-tertiary font-bold uppercase tracking-wider">
              {events.length > 0 ? `${events.length} Events Recorded` : 'Awaiting Events'}
            </span>
          </div>
          <Button
            variant="ghost"
            className="h-8 gap-2 text-[11px] p-0 px-2 font-bold text-brand-text-tertiary hover:text-brand-primary transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>

        {events.length > 0 ? (
          <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px]">Event ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="group cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => handleRowClick(event)}
                  >
                    <TableCell className="font-mono text-[11px] text-brand-text-tertiary">
                      {event.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                      {event.event_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="bg-white/[0.03] text-[10px] border-brand-border/40">
                        {event.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-body-sm text-brand-text-secondary">
                      {event.contact_name || event.contact_email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        event.status === 'processed' ? 'success' :
                        event.status === 'failed' ? 'error' :
                        event.status === 'ignored' ? 'neutral' : 'warning'
                      } className="text-[10px] px-1.5 py-0 uppercase tracking-tighter">
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-body-sm text-brand-text-tertiary">
                      {formatTime(event.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-16 border rounded-xl border-dashed border-brand-border flex flex-col items-center justify-center bg-brand-bg-secondary/30 gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-bg-primary border border-brand-border flex items-center justify-center">
              <Inbox className="w-5 h-5 text-brand-text-tertiary" />
            </div>
            <div className="text-center">
              <h3 className="text-body-lg font-bold text-brand-text-primary">No events recorded yet</h3>
              <p className="text-brand-text-tertiary text-body-sm max-w-sm mt-1">
                Events will appear here once your webhook receives payloads or you import contacts via CSV.
              </p>
            </div>
          </div>
        )}
      </div>

      <EventDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
