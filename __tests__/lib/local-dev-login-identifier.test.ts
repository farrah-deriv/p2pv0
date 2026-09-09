import {
  buildLocalDevLoginIdentifier,
  normalizeDialCode,
  shouldUsePhoneLoginInput,
} from "@/lib/local-dev-login-identifier"
import { readLoginIdentifier } from "@/lib/ory-login-request-body"

describe("local-dev-login-identifier", () => {
  it("builds email identifiers", () => {
    expect(
      buildLocalDevLoginIdentifier({
        method: "email",
        email: "  user@example.com ",
        dialCode: "+60",
        phoneNumber: "123",
      }),
    ).toBe("user@example.com")
  })

  it("builds phone identifiers with a normalised dial code", () => {
    expect(
      buildLocalDevLoginIdentifier({
        method: "phone",
        email: "",
        dialCode: "60",
        phoneNumber: "12 345 6789",
      }),
    ).toBe("+60123456789")
  })

  it("detects phone-style input", () => {
    expect(shouldUsePhoneLoginInput("60123456789")).toBe(true)
    expect(shouldUsePhoneLoginInput("+60123456789")).toBe(true)
    expect(shouldUsePhoneLoginInput("user@example.com")).toBe(false)
  })

  it("normalises dial codes", () => {
    expect(normalizeDialCode("60")).toBe("+60")
    expect(normalizeDialCode("+44")).toBe("+44")
  })
})

describe("readLoginIdentifier", () => {
  it("prefers identifier over legacy email field", () => {
    expect(readLoginIdentifier({ identifier: "+60123456789", email: "user@example.com" })).toBe("+60123456789")
  })

  it("falls back to email", () => {
    expect(readLoginIdentifier({ email: "user@example.com" })).toBe("user@example.com")
  })
})
