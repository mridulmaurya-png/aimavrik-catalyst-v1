import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "badge", // Base badge class from globals.css
        variant === 'success' && "badge-success",
        variant === 'warning' && "badge-warning",
        variant === 'error' && "badge-error",
        variant === 'info' && "badge-info",
        variant === 'neutral' && "bg-brand-bg-elevated text-brand-text-secondary border border-brand-border",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
