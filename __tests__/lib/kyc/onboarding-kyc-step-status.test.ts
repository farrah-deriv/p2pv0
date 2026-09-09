import {
  onboardingKycStepStatusFromRaw,
  onboardingKycStepStatusIsDisplayable,
} from "@/lib/kyc/onboarding-kyc-step-status"

describe("onboardingKycStepStatusFromRaw", () => {
  it("maps approved and verified to verified", () => {
    expect(onboardingKycStepStatusFromRaw("approved")).toBe("verified")
    expect(onboardingKycStepStatusFromRaw("verified")).toBe("verified")
  })

  it("maps pending, rejected, and expired", () => {
    expect(onboardingKycStepStatusFromRaw("pending")).toBe("pending")
    expect(onboardingKycStepStatusFromRaw("rejected")).toBe("rejected")
    expect(onboardingKycStepStatusFromRaw("expired")).toBe("expired")
  })

  it("maps unknown values to none", () => {
    expect(onboardingKycStepStatusFromRaw("")).toBe("none")
    expect(onboardingKycStepStatusFromRaw(undefined)).toBe("none")
  })
})

describe("onboardingKycStepStatusIsDisplayable", () => {
  it("returns true for displayable statuses", () => {
    expect(onboardingKycStepStatusIsDisplayable("verified")).toBe(true)
    expect(onboardingKycStepStatusIsDisplayable("pending")).toBe(true)
    expect(onboardingKycStepStatusIsDisplayable("rejected")).toBe(true)
    expect(onboardingKycStepStatusIsDisplayable("expired")).toBe(true)
  })

  it("returns false for none", () => {
    expect(onboardingKycStepStatusIsDisplayable("none")).toBe(false)
  })
})
