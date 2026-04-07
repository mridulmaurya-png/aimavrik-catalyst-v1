"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  Building2, 
  LogOut,
  Terminal,
} from "lucide-react";

const opsNav = [
  { name: "Workspaces", href: "/ops/workspaces", icon: Building2 },
];

export function OpsSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-bg-secondary flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-brand-border/30">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-sm tracking-tight">Catalyst Ops</span>
          <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-brand-primary">Internal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {opsNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-body-sm font-medium",
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
      </nav>

      {/* Footer — Admin Identity + Logout */}
      <div className="p-4 border-t border-brand-border space-y-3">
        <div className="flex items-center gap-2 px-3">
          <Terminal className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span className="text-[10px] text-brand-text-tertiary truncate font-mono">{adminEmail}</span>
        </div>
        <button 
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-medium text-brand-text-tertiary hover:text-functional-error hover:bg-functional-error/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
