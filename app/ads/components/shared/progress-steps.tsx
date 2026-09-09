"use client"

import { cn } from "@/lib/utils"

interface ProgressStep {
  title: string
  completed: boolean
}

interface ProgressStepsProps {
  currentStep: number
  steps: ProgressStep[]
  label: string
  className?: string
}

export function ProgressSteps({ currentStep, steps, label, className = "" }: ProgressStepsProps) {
  const total = steps.length
  const filled = Math.min(currentStep + 1, total)
  const progressPct = (filled / total) * 100
  const stepTitle = steps[currentStep]?.title ?? ""

  return (
    <div className={cn("w-full", className)} data-testid="ad-form-progress">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-[3px] rounded-full bg-neutral-200">
          <div
            className="absolute inset-y-0 start-0 rounded-full bg-slate-1200 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            aria-hidden
          />
        </div>
        <span className="flex-shrink-0 text-sm text-neutral-400">
          {filled}/{total}
        </span>
      </div>

      <p className="mt-3 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-1200 leading-tight">{stepTitle}</p>
    </div>
  )
}
