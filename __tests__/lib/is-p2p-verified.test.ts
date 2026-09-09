import { isP2PVerified, isP2PVerifiedFromStatus } from "@/lib/is-p2p-verified"
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

const verifiedStatus: VerificationStatus = {
  email_verified: true,
  phone_verified: true,
  kyc_verified: true,
  p2p_allowed: true,
}

// A payment lock is folded into p2p.allowed by the backend, so a locked but
// otherwise fully verified account reports p2p_allowed: false.
const lockedStatus: VerificationStatus = { ...verifiedStatus, p2p_allowed: false }

const paymentLockOnlyOnboarding: OnboardingStatusResponse = {
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

const withdrawLockOnlyOnboarding: OnboardingStatusResponse = {
  ...verifiedOnboarding,
  p2p: {
    allowed: false,
    criteria: [
      { code: "deposit_enabled", passed: true },
      { code: "withdraw_enabled", passed: false },
    ],
  },
}

const lockAndPhoneOnboarding: OnboardingStatusResponse = {
  ...verifiedOnboarding,
  verification: { email_verified: true, phone_verified: false },
  p2p: {
    allowed: false,
    criteria: [
      { code: "phone_verified", passed: false },
      { code: "withdraw_enabled", passed: false },
    ],
  },
}

const lockAndCountryOnboarding: OnboardingStatusResponse = {
  ...verifiedOnboarding,
  p2p: {
    allowed: false,
    criteria: [
      { code: "country_p2p_enabled", passed: false },
      { code: "withdraw_enabled", passed: false },
    ],
  },
}

describe("isP2PVerified", () => {
  const originalKycMandatory = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = "1"
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = originalKycMandatory
  })

  it("is true when verificationStatus is fully verified", () => {
    expect(isP2PVerified({ verificationStatus: verifiedStatus })).toBe(true)
  })

  it("is true when onboardingStatus is fully verified (no P2P user yet)", () => {
    expect(isP2PVerified({ onboardingStatus: verifiedOnboarding })).toBe(true)
  })

  it("is false when p2p is not allowed", () => {
    expect(
      isP2PVerified({
        onboardingStatus: {
          ...verifiedOnboarding,
          p2p: { ...verifiedOnboarding.p2p, allowed: false },
        },
      }),
    ).toBe(false)
  })

  it("is false when phone is not verified", () => {
    expect(
      isP2PVerified({
        verificationStatus: { ...verifiedStatus, phone_verified: false },
        onboardingStatus: {
          ...verifiedOnboarding,
          verification: { email_verified: true, phone_verified: false },
          p2p: { allowed: true, criteria: [{ code: "phone_verified", passed: false }] },
        },
      }),
    ).toBe(false)
  })

  it("is false when KYC is incomplete and mandatory", () => {
    expect(
      isP2PVerified({
        verificationStatus: { ...verifiedStatus, kyc_verified: false },
        onboardingStatus: {
          ...verifiedOnboarding,
          kyc: { status: "pending", poi_status: "pending", poa_status: "none" },
        },
      }),
    ).toBe(false)
  })

  it("is true when KYC is incomplete but not mandatory", () => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = "0"
    expect(
      isP2PVerified({
        verificationStatus: { ...verifiedStatus, kyc_verified: false },
        onboardingStatus: {
          ...verifiedOnboarding,
          kyc: { status: "pending", poi_status: "pending", poa_status: "none" },
        },
      }),
    ).toBe(true)
  })

  it("is false when nothing is loaded", () => {
    expect(isP2PVerified({})).toBe(false)
  })
})

describe("isP2PVerifiedFromStatus", () => {
  const originalKycMandatory = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = "1"
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = originalKycMandatory
  })

  it("is not ready when nothing is loaded", () => {
    expect(isP2PVerifiedFromStatus({})).toEqual({
      verified: false,
      ready: false,
      blockedByPaymentLockOnly: false,
    })
  })

  it("is ready and verified when onboarding is complete", () => {
    expect(isP2PVerifiedFromStatus({ onboardingStatus: verifiedOnboarding })).toEqual({
      verified: true,
      ready: true,
      blockedByPaymentLockOnly: false,
    })
  })

  it("is ready and unverified when KYC is incomplete", () => {
    expect(
      isP2PVerifiedFromStatus({
        verificationStatus: { ...verifiedStatus, kyc_verified: false },
        onboardingStatus: {
          ...verifiedOnboarding,
          kyc: { status: "pending", poi_status: "pending", poa_status: "none" },
        },
      }),
    ).toEqual({ verified: false, ready: true, blockedByPaymentLockOnly: false })
  })

  describe("blockedByPaymentLockOnly", () => {
    it("is true when a deposit and withdrawal lock are the only failing criteria", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: lockedStatus,
          onboardingStatus: paymentLockOnlyOnboarding,
        }),
      ).toEqual({ verified: false, ready: true, blockedByPaymentLockOnly: true })
    })

    it("is true when only the withdrawal lock is failing", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: lockedStatus,
          onboardingStatus: withdrawLockOnlyOnboarding,
        }),
      ).toEqual({ verified: false, ready: true, blockedByPaymentLockOnly: true })
    })

    it("is false when phone verification is also failing", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: { ...lockedStatus, phone_verified: false },
          onboardingStatus: lockAndPhoneOnboarding,
        }).blockedByPaymentLockOnly,
      ).toBe(false)
    })

    it("is false when the country criterion is also failing", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: lockedStatus,
          onboardingStatus: lockAndCountryOnboarding,
        }).blockedByPaymentLockOnly,
      ).toBe(false)
    })

    it("is false when KYC is incomplete even though a lock is the only failing criterion", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: { ...lockedStatus, kyc_verified: false },
          onboardingStatus: {
            ...paymentLockOnlyOnboarding,
            kyc: { status: "pending", poi_status: "pending", poa_status: "none" },
          },
        }).blockedByPaymentLockOnly,
      ).toBe(false)
    })

    it("is false when p2p is disallowed but no criteria explain why", () => {
      expect(
        isP2PVerifiedFromStatus({
          verificationStatus: lockedStatus,
          onboardingStatus: {
            ...verifiedOnboarding,
            p2p: { allowed: false, criteria: [] },
          },
        }).blockedByPaymentLockOnly,
      ).toBe(false)
    })

    it("is false when the user is already allowed", () => {
      expect(
        isP2PVerifiedFromStatus({ onboardingStatus: verifiedOnboarding }).blockedByPaymentLockOnly,
      ).toBe(false)
    })
  })
})
