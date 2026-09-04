import {
  emailEligibilityFromProfileEmail,
  isEmailEligibleForP2P,
  isExistingP2PUser,
  isKnownNonP2PUser,
  normalizeClientProfileEmail,
} from "@/lib/email-eligibility"

describe("email-eligibility", () => {
  describe("normalizeClientProfileEmail", () => {
    it("returns trimmed non-empty strings", () => {
      expect(normalizeClientProfileEmail("  user@example.com  ")).toBe("user@example.com")
    })

    it("returns null for empty or invalid values", () => {
      expect(normalizeClientProfileEmail("")).toBeNull()
      expect(normalizeClientProfileEmail("   ")).toBeNull()
      expect(normalizeClientProfileEmail(null)).toBeNull()
      expect(normalizeClientProfileEmail(undefined)).toBeNull()
    })
  })

  describe("emailEligibilityFromProfileEmail", () => {
    it("marks non-empty email as eligible", () => {
      expect(emailEligibilityFromProfileEmail("user@example.com")).toBe("eligible")
    })

    it("marks missing email as missing", () => {
      expect(emailEligibilityFromProfileEmail("")).toBe("missing")
    })
  })

  describe("isEmailEligibleForP2P", () => {
    it("allows only eligible state", () => {
      expect(isEmailEligibleForP2P("eligible")).toBe(true)
      expect(isEmailEligibleForP2P("missing")).toBe(false)
      expect(isEmailEligibleForP2P("unknown")).toBe(false)
      expect(isEmailEligibleForP2P("loading")).toBe(false)
      expect(isEmailEligibleForP2P("error")).toBe(false)
    })
  })

  describe("isExistingP2PUser", () => {
    it("returns true only for a non-empty P2P user id", () => {
      expect(isExistingP2PUser("123")).toBe(true)
      expect(isExistingP2PUser("")).toBe(false)
      expect(isExistingP2PUser(null)).toBe(false)
      expect(isExistingP2PUser(undefined)).toBe(false)
    })
  })

  describe("isKnownNonP2PUser", () => {
    it("is true only for the resolved \"no P2P profile\" id", () => {
      expect(isKnownNonP2PUser("")).toBe(true)
    })

    // The guard that keeps `useTotalBalance` from disabling itself mid-hydration and
    // flashing the zero-wallets empty state at a funded user.
    it("is false while the user-data store has not resolved yet", () => {
      expect(isKnownNonP2PUser(null)).toBe(false)
      expect(isKnownNonP2PUser(undefined)).toBe(false)
    })

    it("is false for an existing P2P user", () => {
      expect(isKnownNonP2PUser("123")).toBe(false)
    })
  })
})
