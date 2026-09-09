import { Badge } from "@/components/ui/badge"
import type { OnboardingKycStepStatus } from "@/lib/kyc/onboarding-kyc-step-status"

interface KycStatusBadgeProps {
  status: OnboardingKycStepStatus
  labels: {
    verified: string
    inReview: string
    failed: string
    unverified: string
  }
}

export function KycStatusBadge({ status, labels }: KycStatusBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <Badge variant="success" className="rounded-sm font-normal">
          {labels.verified}
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="pending" className="rounded-sm font-normal">
          {labels.inReview}
        </Badge>
      )
    case "rejected":
    case "expired":
      return (
        <Badge variant="error" className="rounded-sm font-normal">
          {labels.failed}
        </Badge>
      )
    default:
      // Never submitted — neutral badge, distinct from a rejected/expired
      // document (which shows the real "failed" status above).
      return (
        <Badge
          variant="outline"
          className="rounded-sm border-transparent bg-grayscale-500 px-2 py-0.5 text-xs font-normal text-grayscale-600"
        >
          {labels.unverified}
        </Badge>
      )
  }
}
