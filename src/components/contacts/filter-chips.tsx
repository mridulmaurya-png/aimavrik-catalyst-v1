"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

const filters = [
  { id: 'hot', label: 'Hot leads' },
  { id: 'unresponsive', label: 'Unresponsive' },
  { id: 'high-value', label: 'High value' },
  { id: 'converted', label: 'Converted' },
  { id: 'inactive', label: 'Inactive' },
]

export function FilterChips() {
  const [active, setActive] = React.useState('hot')

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActive(filter.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-label-sm font-semibold transition-all duration-200 border",
            active === filter.id
              ? "bg-brand-primary/10 border-brand-primary text-brand-primary glow-active"
              : "bg-brand-bg-elevated/50 border-brand-border text-brand-text-tertiary hover:border-brand-text-secondary hover:text-brand-text-secondary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
