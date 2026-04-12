"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  PlayCircle, 
  Share2, 
  BarChart3, 
  History, 
  CreditCard, 
  Settings,
  Hexagon,
  Target,
  Megaphone
} from "lucide-react";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Audience Groups", href: "/segments", icon: Target },
  { name: "Playbooks", href: "/playbooks", icon: PlayCircle },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Connected Channels", href: "/integrations", icon: Share2 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNav = [
  { name: "Event Logs", href: "/event-logs", icon: History },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ identity }: { identity?: { businessName: string, fullName: string, email: string } }) {
  const pathname = usePathname();

  const mainLabel = identity?.businessName || identity?.fullName || "My Workspace";
  const subLabel = (identity?.businessName && identity?.fullName) ? identity.fullName : identity?.email || "owner";

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-bg-secondary flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading font-bold text-lg tracking-tight">Catalyst</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-body-sm font-medium",
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary glow-active" 
                    : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-brand-primary" : "text-brand-text-tertiary group-hover:text-brand-text-secondary")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="space-y-4">
          <h4 className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-tertiary">System</h4>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-body-sm font-medium",
                    isActive 
                      ? "bg-brand-primary/10 text-brand-primary glow-active" 
                      : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/[0.03]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-brand-primary" : "text-brand-text-tertiary group-hover:text-brand-text-secondary")} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-brand-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-bg-elevated border border-brand-border" />
            <div className="flex-1 min-w-0 font-medium">
              <p className="text-body-sm truncate">{mainLabel}</p>
              <p className="text-[10px] text-brand-text-tertiary truncate">{subLabel}</p>
            </div>
          </div>
          <button 
            onClick={async () => {
               const { createClient } = await import("@/lib/supabase/client");
               const supabase = createClient();
               await supabase.auth.signOut();
               window.location.href = "/login";
            }}
            className="text-brand-text-tertiary hover:text-functional-error transition-colors"
            title="Log out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
