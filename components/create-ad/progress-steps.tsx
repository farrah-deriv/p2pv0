interface ProgressStepsProps {
  currentStep: number
  steps: {
    title: string
    completed: boolean
  }[]
}

export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start">
          <div className="relative flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full border-2 transition-colors
                ${index === currentStep || step.completed ? "border-primary" : "border-gray-200"}
                ${index === currentStep && "ring-[3px] ring-primary/20"}`}
            />
            {index < steps.length - 1 && (
              <div
                className={`w-[2px] h-[32px] mt-1 mb-1 transition-colors
                  ${index < currentStep || step.completed ? "bg-primary" : "bg-gray-200"}`}
              />
            )}
          </div>
          <div className="ml-3 pb-8">
            <span className={`text-sm ${index === currentStep ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              {step.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

