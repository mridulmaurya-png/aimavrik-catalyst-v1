import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-display-l gradient-text-primary">AiMavrik Catalyst</h1>
          <p className="text-body-lg text-brand-text-secondary">
            AI-powered revenue execution system. Connect, automate, and convert.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="card-elevated p-8 space-y-6">
            <h2>Get started</h2>
            <p className="text-body-reg text-brand-text-secondary">
              Connect a source and activate a playbook to start tracking actions and outcomes.
            </p>
            <div className="flex gap-4">
              <Link href="/login" className="btn btn-primary">Sign in</Link>
              <Link href="/signup" className="btn btn-secondary">Create account</Link>
            </div>
          </div>
          
          <div className="card-elevated p-8 space-y-6">
            <h3>How it works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-primary">1</div>
                <p className="text-body-sm text-brand-text-secondary">Import leads via CSV, webhook, or integrations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-primary">2</div>
                <p className="text-body-sm text-brand-text-secondary">Activate AI playbooks for automated follow-up</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-primary">3</div>
                <p className="text-body-sm text-brand-text-secondary">Track execution, revenue, and engagement in real time</p>
              </div>
            </div>
          </div>
        </section>
        
        <footer className="pt-12 border-t border-brand-border">
          <p className="text-body-sm text-brand-text-tertiary">
            Your data stays isolated to your workspace. All actions are logged for review.
          </p>
        </footer>
      </div>
    </main>
  );
}
