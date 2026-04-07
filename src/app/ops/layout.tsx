import { requireAdmin } from "@/lib/auth/context";
import { OpsSidebar } from "@/components/ops/ops-sidebar";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex h-screen bg-brand-bg-primary overflow-hidden">
      {/* Ops Sidebar */}
      <div className="hidden lg:block h-full">
        <OpsSidebar adminEmail={admin.email || "admin"} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-brand-border/30 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-brand-text-tertiary">AiMavrik Internal Operations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-bold uppercase tracking-widest border border-brand-primary/20">Ops Mode</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
