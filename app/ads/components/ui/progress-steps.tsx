interface ProgressStep {
  title: string
  completed: boolean
}

interface ProgressStepsProps {
  currentStep: number
  steps: ProgressStep[]
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-center mb-12 max-w-xl mx-auto">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center relative flex-1">
          {/* Connect lines between steps */}
          {index > 0 && (
            <div className="absolute top-3 right-full h-[1px] bg-gray-300" style={{ right: "50%", left: "-50%" }}></div>
          )}

          {/* Step circle */}
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 
              ${
                index < currentStep
                  ? "bg-black border-black" // Completed step (black with checkmark)
                  : index === currentStep
                    ? "bg-white border-black" // Current step (white with black border)
                    : "bg-white border-gray-300" // Future step (white with gray border)
              }`}
          >
            {index < currentStep && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>

          {/* Step title */}
          <span
            className={`text-sm mt-2 text-center hidden md:block
              ${index <= currentStep ? "text-black font-medium" : "text-gray-400"}`}
          >
            {step.title}
          </span>
        </div>
      ))}
    </div>
  )
}
