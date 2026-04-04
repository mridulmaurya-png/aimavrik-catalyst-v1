"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_MAPPING: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { 
    title: "Revenue Command Center", 
    subtitle: "Track active revenue systems, conversions, and execution health." 
  },
  "/dashboard/contacts": { 
    title: "Contacts", 
    subtitle: "Track every lead and customer moving through your revenue system." 
  },
  "/dashboard/playbooks": { 
    title: "Revenue Playbooks", 
    subtitle: "Activate pre-built systems that automate follow-up, recovery, and conversion." 
  },
  "/dashboard/integrations": { 
    title: "Integrations", 
    subtitle: "Connect your funnel, CRM, website, payments, and communication channels." 
  },
  "/dashboard/analytics": { 
    title: "Analytics", 
    subtitle: "Understand which playbooks, channels, and sources are driving results." 
  },
  "/dashboard/event-logs": { 
    title: "Event Logs", 
    subtitle: "Monitor every event entering and moving through your system." 
  },
  "/dashboard/settings": { 
    title: "Settings", 
    subtitle: "Configure business details, communication rules, and system behavior." 
  },
  "/dashboard/billing": { 
    title: "Billing", 
    subtitle: "Manage your plan, usage, and subscription details." 
  },
};

export function Header() {
  const pathname = usePathname();
  const pageInfo = PAGE_MAPPING[pathname] || { title: "Catalyst", subtitle: "" };

  return (
    <header className="h-[72px] min-h-[72px] border-b border-brand-border bg-brand-bg-primary/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="flex flex-col">
        <h1 className="text-heading-4 font-bold tracking-tight">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-body-sm text-brand-text-secondary leading-none mt-0.5">
            {pageInfo.subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary group-focus-within:text-brand-primary" />
          <Input 
            className="pl-10 h-10 text-body-sm" 
            placeholder="Search contacts or events..." 
          />
        </div>
        
        <div className="flex items-center gap-2 border-l border-brand-border pl-4">
          <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
            <Bell className="w-4 h-4" />
          </Button>
          <Button className="h-10 gap-2 px-4">
            <Plus className="w-4 h-4" />
            <span>Connect source</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
