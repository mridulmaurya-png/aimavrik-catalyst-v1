import * as React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function SettingsFormGroup({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-body-lg font-bold tracking-tight text-brand-text-primary">{title}</h4>
        {subtitle && <p className="text-body-sm text-brand-text-tertiary">{subtitle}</p>}
      </div>
      <div className="p-8 rounded-xl border border-brand-border bg-brand-bg-secondary/30 space-y-6">
        {children}
      </div>
    </div>
  )
}

export function SettingsTabNav({ active, onChange }: { active: string, onChange: (id: string) => void }) {
  const tabs = [
    { id: 'profile', label: 'Business Profile' },
    { id: 'voice', label: 'Brand Voice' },
    { id: 'comm', label: 'Communication' },
    { id: 'orchestration', label: 'Orchestration' },
    { id: 'team', label: 'Team Settings' },
    { id: 'security', label: 'Security' },
  ]

  return (
    <div className="flex overflow-x-auto gap-1 p-1 bg-brand-bg-secondary rounded-xl border border-brand-border w-max max-w-full no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
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
