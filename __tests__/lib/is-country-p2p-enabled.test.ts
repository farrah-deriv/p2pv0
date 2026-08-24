import { isCountryP2PDisabled } from "@/lib/is-country-p2p-enabled"
import type { OnboardingStatusResponse } from "@/services/api/api-auth"

const baseStatus: OnboardingStatusResponse = {
  kyc: { status: "verified", poi_status: "approved", poa_status: "approved" },
  verification: { email_verified: true, phone_verified: false },
  p2p: {
    allowed: false,
    criteria: [
      { code: "country_p2p_enabled", passed: false },
      { code: "kyc_approved", passed: true },
      { code: "deposit_enabled", passed: true },
      { code: "withdraw_enabled", passed: true },
      { code: "phone_verified", passed: false },
    ],
  },
}

describe("isCountryP2PDisabled", () => {
  it("is true when country_p2p_enabled is present and failed", () => {
    expect(isCountryP2PDisabled(baseStatus)).toBe(true)
  })

  it("is false when country_p2p_enabled passed even if p2p.allowed is false", () => {
    expect(
      isCountryP2PDisabled({
        ...baseStatus,
        p2p: {
          allowed: false,
          criteria: [
            { code: "country_p2p_enabled", passed: true },
            { code: "phone_verified", passed: false },
          ],
        },
      }),
    ).toBe(false)
  })

  it("is false when the country criterion is missing", () => {
    expect(
      isCountryP2PDisabled({
        ...baseStatus,
        p2p: { allowed: false, criteria: [{ code: "phone_verified", passed: false }] },
      }),
    ).toBe(false)
  })

  it("is false when onboarding status is missing", () => {
    expect(isCountryP2PDisabled(null)).toBe(false)
    expect(isCountryP2PDisabled(undefined)).toBe(false)
  })
})
