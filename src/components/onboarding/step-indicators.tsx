import * as React from "react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full space-y-4 mb-12">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary">
        <span>Step {currentStep} of {totalSteps}</span>
        <span className="text-brand-primary transform transition-all duration-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
      <div className="h-1.5 w-full bg-brand-bg-secondary rounded-full overflow-hidden border border-brand-border/30 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(109,93,251,0.3)]"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-brand-text-tertiary/70 font-medium text-center">
        {currentStep < totalSteps ? "This takes less than 2 minutes." : "Your system is ready to launch."}
      </p>
    </div>
  )
}
