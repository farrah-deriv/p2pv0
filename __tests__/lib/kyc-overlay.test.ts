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

// A deposit/withdrawal lock is folded into p2p.allowed by the backend, so a
// locked but otherwise fully verified account reports p2p_allowed: false.
const lockedStatus: VerificationStatus = { ...verifiedStatus, p2p_allowed: false }

const paymentLockOnboarding: OnboardingStatusResponse = {
  ...verifiedOnboarding,
  p2p: {
    allowed: false,
    criteria: [
      { code: "country_p2p_enabled", passed: true },
      { code: "phone_verified", passed: true },
      { code: "deposit_enabled", passed: false },
      { code: "withdraw_enabled", passed: false },
    ],
  },
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

  // A deposit/withdrawal lock leaves nothing for the onboarding sheet to ask
  // for: every step already reads as approved, so its CTA becomes "Got it" and
  // only closes the sheet. Gating an existing P2P user behind it is a dead end
  // that also blocks Sell, the one route a withdrawal-locked client has to move
  // funds out.
  describe("payment-locked accounts", () => {
    it("allows an existing P2P user blocked only by a deposit/withdrawal lock", () => {
      expect(
        resolveKycOverlay({
          userId: "user-1",
          verificationStatus: lockedStatus,
          onboardingStatus: paymentLockOnboarding,
        }),
      ).toBe("allow")
    })

    it("allows an existing P2P user blocked only by a withdrawal lock", () => {
      expect(
        resolveKycOverlay({
          userId: "user-1",
          verificationStatus: lockedStatus,
          onboardingStatus: {
            ...paymentLockOnboarding,
            p2p: {
              allowed: false,
              criteria: [
                { code: "deposit_enabled", passed: true },
                { code: "withdraw_enabled", passed: false },
              ],
            },
          },
        }),
      ).toBe("allow")
    })

    it("still opens KYC for a locked user with no P2P profile yet", () => {
      expect(
        resolveKycOverlay({
          userId: null,
          verificationStatus: lockedStatus,
          onboardingStatus: paymentLockOnboarding,
        }),
      ).toBe("kyc")
    })

    it("still opens KYC when phone verification is also failing", () => {
      expect(
        resolveKycOverlay({
          userId: "user-1",
          verificationStatus: { ...lockedStatus, phone_verified: false },
          onboardingStatus: {
            ...paymentLockOnboarding,
            verification: { email_verified: true, phone_verified: false },
            p2p: {
              allowed: false,
              criteria: [
                { code: "phone_verified", passed: false },
                { code: "withdraw_enabled", passed: false },
              ],
            },
          },
        }),
      ).toBe("kyc")
    })

    it("still opens KYC when the country criterion is also failing", () => {
      expect(
        resolveKycOverlay({
          userId: "user-1",
          verificationStatus: lockedStatus,
          onboardingStatus: {
            ...paymentLockOnboarding,
            p2p: {
              allowed: false,
              criteria: [
                { code: "country_p2p_enabled", passed: false },
                { code: "withdraw_enabled", passed: false },
              ],
            },
          },
        }),
      ).toBe("kyc")
    })

    it("still opens KYC when KYC itself is incomplete", () => {
      expect(
        resolveKycOverlay({
          userId: "user-1",
          verificationStatus: { ...lockedStatus, kyc_verified: false },
          onboardingStatus: {
            ...paymentLockOnboarding,
            kyc: { status: "pending", poi_status: "pending", poa_status: "none" },
          },
        }),
      ).toBe("kyc")
    })
  })
})
