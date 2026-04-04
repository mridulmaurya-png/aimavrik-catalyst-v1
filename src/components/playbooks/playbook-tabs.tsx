"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: 'all', label: 'All Playbooks' },
  { id: 'd2c', label: 'D2C' },
  { id: 'services', label: 'Services' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
]

export function PlaybookTabs() {
  const [active, setActive] = React.useState('all')

  return (
    <div className="flex overflow-x-auto gap-1 p-1 bg-brand-bg-secondary rounded-xl border border-brand-border w-max max-w-full no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={cn(
            "px-6 py-2 rounded-lg text-body-sm font-semibold transition-all duration-200 whitespace-nowrap",
            active === tab.id
              ? "bg-brand-bg-elevated text-brand-text-primary shadow-card border border-brand-border/50"
              : "text-brand-text-tertiary hover:text-brand-text-secondary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
