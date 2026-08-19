import { resolveKycOverlay } from "@/lib/kyc-overlay"
import type { OnboardingStatusResponse } from "@/services/api/api-auth"
import type { VerificationStatus } from "@/stores/user-data-store"

const verifiedOnboarding: OnboardingStatusResponse = {
  kyc: { status: "verified", poi_status: "approved", poa_status: "approved" },
  tnc: { accepted: true },
  profile: { status: "complete" },
  verification: { email_verified: true, phone_verified: true },
  p2p: {
    allowed: true,
    criteria: [{ code: "phone_verified", passed: true }],
  },
}

const unverifiedOnboarding: OnboardingStatusResponse = {
  ...verifiedOnboarding,
  kyc: { status: "pending", poi_status: "none", poa_status: "none" },
  verification: { email_verified: true, phone_verified: false },
  p2p: { allowed: false, criteria: [{ code: "phone_verified", passed: false }] },
}

const verifiedStatus: VerificationStatus = {
  email_verified: true,
  phone_verified: true,
  kyc_verified: true,
  p2p_allowed: true,
}

describe("resolveKycOverlay", () => {
  const originalKycMandatory = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = "1"
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = originalKycMandatory
  })

  it("waits when status has not loaded", () => {
    expect(resolveKycOverlay({})).toBe("wait")
  })

  it("opens only the intro when the user is verified but has no P2P profile", () => {
    expect(
      resolveKycOverlay({
        userId: null,
        onboardingStatus: verifiedOnboarding,
      }),
    ).toBe("intro")
  })

  it("allows the original action when the user is a verified P2P user", () => {
    expect(
      resolveKycOverlay({
        userId: "user-1",
        verificationStatus: verifiedStatus,
        onboardingStatus: verifiedOnboarding,
      }),
    ).toBe("allow")
  })

  it("opens only KYC when the user is not verified", () => {
    expect(
      resolveKycOverlay({
        userId: null,
        onboardingStatus: unverifiedOnboarding,
      }),
    ).toBe("kyc")
  })
})
