interface ProgressStep {
  title: string
  completed: boolean
}

interface ProgressStepsProps {
  currentStep: number
  steps: ProgressStep[]
  className?: string
  title?: {
    label: string
    stepTitle: string
  }
}

export function ProgressSteps({ currentStep, steps, className = "", title }: ProgressStepsProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={`md:w-full ${className}`} data-testid="ad-form-progress">
      <div className="w-full h-[3px] bg-gray-200 relative overflow-hidden">
        <div
          className="h-full bg-black transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {title && (
        <div className="mt-6">
          <div className="text-base font-normal text-slate-1200">{title.label}</div>
          {/* Responsive: 20px to match mobile headingMedium; desktop keeps 32px */}
          <div className="text-xl md:text-[32px] font-extrabold text-black mt-1">
            {title.stepTitle}
          </div>
        </div>
      )}
    </div>
  )
}
