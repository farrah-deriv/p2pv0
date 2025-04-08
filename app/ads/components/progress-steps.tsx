interface ProgressStepsProps {
  currentStep: number
  steps: {
    title: string
    completed: boolean
  }[]
}

export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center relative">
          {/* Connect lines between steps */}
          {index > 0 && (
            <div
              className="absolute top-5 right-full w-full h-[1px] bg-gray-300"
              style={{ right: "50%", width: "100%" }}
            ></div>
          )}

          {/* Step circle */}
          <div
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-white
              ${index === currentStep ? "border-black" : "border-gray-300"}`}
          >
            {index === currentStep && <div className="w-2 h-2 bg-black rounded-full"></div>}
          </div>

          {/* Step title */}
          <span
            className={`text-base mt-2 text-center
              ${index === currentStep ? "text-black font-medium" : "text-gray-400"}`}
          >
            {step.title}
          </span>
        </div>
      ))}
    </div>
  )
}
