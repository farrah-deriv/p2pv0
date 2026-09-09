export type OnboardingKycStepStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "expired"
  | "none"

export function onboardingKycStepStatusFromRaw(
  raw: string | undefined | null,
): OnboardingKycStepStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "approved":
    case "verified":
      return "verified"
    case "pending":
      return "pending"
    case "rejected":
      return "rejected"
    case "expired":
      return "expired"
    default:
      return "none"
  }
}

export function onboardingKycStepStatusIsDisplayable(
  status: OnboardingKycStepStatus,
): boolean {
  return status !== "none"
}
