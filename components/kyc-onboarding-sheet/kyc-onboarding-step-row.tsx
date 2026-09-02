import Image from "next/image"
import { cn } from "@/lib/utils"
import type { OnboardingKycStepStatus } from "@/lib/kyc/onboarding-kyc-step-status"
import { onboardingKycStepStatusIsDisplayable } from "@/lib/kyc/onboarding-kyc-step-status"
import { KycStatusBadge } from "./kyc-status-badge"

export interface KycOnboardingStep {
  id: string
  title: string
  icon: string
  completed: boolean
  link?: string
  rejected?: boolean
  inReview?: boolean
  expired?: boolean
  status?: OnboardingKycStepStatus
}

interface KycOnboardingStepRowProps {
  step: KycOnboardingStep
  statusLabels: {
    verified: string
    inReview: string
    failed: string
    unverified: string
  }
}

export function KycOnboardingStepRow({ step, statusLabels }: KycOnboardingStepRowProps) {
  const showProfileCheck = step.completed && step.id === "profile"
  const displayStatus = step.status ?? "none"
  const showStatusBadge =
    step.id !== "profile" &&
    (onboardingKycStepStatusIsDisplayable(displayStatus) || Boolean(step.expired))

  return (
    <div data-testid={`kyc-row-step-${step.id}`} className={cn("flex items-center gap-3")}>
      <div data-testid={`kyc-icon-step-${step.id}`} className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        <Image
          src={step.icon || "/placeholder.svg"}
          alt=""
          aria-hidden
          width={24}
          height={24}
          className="object-contain"
        />
      </div>
      <div className="flex-1 text-start text-base font-normal text-slate-1200">{step.title}</div>
      {showProfileCheck && (
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <Image
            src="/icons/tick.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
      )}
      {showStatusBadge && <KycStatusBadge status={displayStatus} labels={statusLabels} />}
    </div>
  )
}
