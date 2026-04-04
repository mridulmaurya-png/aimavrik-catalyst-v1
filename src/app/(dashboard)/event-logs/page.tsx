"use client";

import * as React from "react"
import { EventTable } from "@/components/event-logs/event-table";
import { EventDetailDrawer } from "@/components/event-logs/event-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw,
  Zap,
  Download
} from "lucide-react";

export default function EventLogsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)

  const handleRowClick = (event: any) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

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
          <Button variant="secondary" className="gap-2 h-11 px-4 bg-white/[0.02] border border-brand-border/50">
            <Download className="w-4 h-4 text-brand-text-tertiary" />
            Export Logs
          </Button>
          <Button className="gap-2 h-11 px-6">
            <Zap className="w-4 h-4" />
            Run Test Event
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
              className="pl-10 h-11 bg-brand-bg-secondary" 
              placeholder="Search by Event ID, Contact, or Content..." 
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="ghost" className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4">
              <Calendar className="w-4 h-4" />
              Date Range
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-functional-success animate-pulse" />
            <span className="text-[11px] text-brand-text-tertiary font-bold uppercase tracking-wider">Live Feed Active</span>
          </div>
          <Button variant="ghost" className="h-8 gap-2 text-[11px] p-0 px-2 font-bold text-brand-text-tertiary hover:text-brand-primary transition-colors">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
        
        <EventTable onRowClick={handleRowClick} />
      </div>

      <EventDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
