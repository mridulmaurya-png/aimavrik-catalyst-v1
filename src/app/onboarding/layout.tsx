import * as React from "react"
import { ShieldCheck } from "lucide-react"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-bg-primary text-brand-text-primary flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-brand-border/30 flex items-center px-8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-body-lg font-bold tracking-tight">AiMavrik <span className="text-brand-text-tertiary font-medium">Catalyst</span></span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-brand-border/30 flex items-center justify-center px-8 shrink-0">
        <p className="text-[11px] text-brand-text-tertiary font-medium tracking-wide">
          &copy; 2026 AiMavrik Catalyst. Premium Revenue Execution.
        </p>
      </footer>
    </div>
  )
}
