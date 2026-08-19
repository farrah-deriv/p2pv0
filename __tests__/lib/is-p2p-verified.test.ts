import { isP2PVerified } from "@/lib/is-p2p-verified"
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
