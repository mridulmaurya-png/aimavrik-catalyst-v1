import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { requireWorkspace } from "@/lib/auth/context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business } = await requireWorkspace();

  const identity = {
    businessName: business?.business_name || "",
    fullName: user.user_metadata?.full_name || "",
    email: user.email || ""
  };

  return (
    <div className="flex h-screen bg-brand-bg-primary overflow-hidden">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <div className="hidden lg:block h-full">
        <Sidebar identity={identity} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Nav Placeholder (Implemented in future refinement) */}
    </div>
  );
}
