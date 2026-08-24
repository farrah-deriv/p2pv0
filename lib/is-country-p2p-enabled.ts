import type { OnboardingStatusResponse } from "@/services/api/api-auth"

export const COUNTRY_P2P_ENABLED = "country_p2p_enabled"

// True only when onboarding-status explicitly reports the country criterion as
// failed. A missing criterion is treated as "not a geo block" so older
// responses and other failed criteria (phone, KYC) do not open the region page.
export function isCountryP2PDisabled(
  onboardingStatus?: OnboardingStatusResponse | null,
): boolean {
  return (
    onboardingStatus?.p2p?.criteria?.some(
      (criterion) => criterion.code === COUNTRY_P2P_ENABLED && criterion.passed === false,
    ) === true
  )
}
