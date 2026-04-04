export default function Home() {
  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-display-l gradient-text-primary">Revenue Command Center</h1>
          <p className="text-body-lg text-brand-text-secondary">
            Track active revenue systems, conversions, and execution health.
          </p>
        </header>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="card-elevated p-6 space-y-4">
            <h3 className="text-body-sm text-brand-text-tertiary uppercase tracking-wider">Execution health</h3>
            <div className="text-display-l font-bold">98.2%</div>
            <p className="text-body-sm text-functional-success">Operational</p>
          </div>
          <div className="card-elevated p-6 space-y-4">
            <h3 className="text-body-sm text-brand-text-tertiary uppercase tracking-wider">Conversions</h3>
            <div className="text-display-l font-bold">1,284</div>
            <p className="text-body-sm text-brand-text-secondary">+12.5% from last month</p>
          </div>
          <div className="card-elevated p-6 space-y-4">
            <h3 className="text-body-sm text-brand-text-tertiary uppercase tracking-wider">Revenue influenced</h3>
            <div className="text-display-l font-bold">$42.8k</div>
            <p className="text-body-sm text-functional-info">Direct attribution</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="card-elevated p-8 space-y-6">
            <h2>Active revenue systems</h2>
            <p className="text-body-reg text-brand-text-secondary">
              Connect a source and activate a playbook to start tracking actions and outcomes.
            </p>
            <div className="flex gap-4">
              <button className="btn btn-primary">Connect source</button>
              <button className="btn btn-secondary">Activate playbook</button>
            </div>
          </div>
          
          <div className="card-elevated p-8 space-y-6 glow-active">
            <h3>System setup</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-sm text-brand-text-secondary">Workspace name</label>
                <input type="text" className="input-base" placeholder="Enter business name..." />
              </div>
              <div className="space-y-1">
                <label className="text-label-sm text-brand-text-secondary">System email</label>
                <input type="email" className="input-base" placeholder="admin@business.com" />
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
