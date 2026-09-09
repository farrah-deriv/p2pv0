import { isPaymentMethodSessionElevationEnabled } from "@/lib/payment-method-session-elevation"

describe("isPaymentMethodSessionElevationEnabled", () => {
  const originalEnv = process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED
  })

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED
    } else {
      process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED = originalEnv
    }
  })

  it("defaults to v1 mutations when the variable is unset", () => {
    expect(isPaymentMethodSessionElevationEnabled()).toBe(false)
  })

  it("keeps v1 mutations when the variable is not 1", () => {
    process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED = "0"

    expect(isPaymentMethodSessionElevationEnabled()).toBe(false)
  })

  it("enables session elevation and v2 mutations when the variable is 1", () => {
    process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED = "1"

    expect(isPaymentMethodSessionElevationEnabled()).toBe(true)
  })
})
