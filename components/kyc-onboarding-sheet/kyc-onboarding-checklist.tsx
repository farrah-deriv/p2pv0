import { KycOnboardingStepRow, type KycOnboardingStep } from "./kyc-onboarding-step-row"

interface KycOnboardingChecklistProps {
  steps: KycOnboardingStep[]
  statusLabels: {
    verified: string
    inReview: string
    failed: string
    unverified: string
  }
}

export function KycOnboardingChecklist({ steps, statusLabels }: KycOnboardingChecklistProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      {steps.map((step) => (
        <KycOnboardingStepRow key={step.id} step={step} statusLabels={statusLabels} />
      ))}
    </div>
  )
}
