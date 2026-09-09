import { addPaymentMethod, deletePaymentMethod, updatePaymentMethod } from "@/services/api/api-profile"
import { p2pFetch } from "@/services/api/p2p-fetch"

jest.mock("@/lib/local-variables", () => ({
  API: {
    baseUrl: "https://test.api.deriv.com/p2p/v1",
    p2pV2BaseUrl: "https://test.api.deriv.com/p2p/v2",
  },
  AUTH: { getAuthHeader: () => ({}) },
  USER: { id: "user-1" },
}))

jest.mock("@/services/api/p2p-fetch", () => ({
  p2pFetch: jest.fn(),
}))

const mockP2pFetch = p2pFetch as jest.MockedFunction<typeof p2pFetch>
const requestedUrl = () => mockP2pFetch.mock.calls[0][0] as string

describe("payment-method mutation API version", () => {
  const originalEnv = process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED
    mockP2pFetch.mockResolvedValue({
      ok: true,
      statusText: "OK",
      text: async () => JSON.stringify({ data: {} }),
    } as Response)
  })

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED
    } else {
      process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED = originalEnv
    }
  })

  it("uses the v1 endpoint for create when elevation is disabled", async () => {
    await addPaymentMethod("bank_transfer", { account: "123" })

    expect(requestedUrl()).toBe("https://test.api.deriv.com/p2p/v1/user-payment-methods")
  })

  it("uses the v1 endpoint for update when elevation is disabled", async () => {
    await updatePaymentMethod("123", { fields: { account: "123" } })

    expect(requestedUrl()).toBe("https://test.api.deriv.com/p2p/v1/user-payment-methods/123")
  })

  it("uses the v1 endpoint for delete when elevation is disabled", async () => {
    await deletePaymentMethod("123")

    expect(requestedUrl()).toBe("https://test.api.deriv.com/p2p/v1/user-payment-methods/123")
  })

  it("uses the v2 endpoint when elevation is enabled", async () => {
    process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED = "1"

    await addPaymentMethod("bank_transfer", { account: "123" })

    expect(requestedUrl()).toBe("https://test.api.deriv.com/p2p/v2/user-payment-methods")
  })

  it.each([
    ["add", () => addPaymentMethod("bank_transfer", { account: "123" })],
    ["update", () => updatePaymentMethod("123", { fields: { account: "123" } })],
    ["delete", () => deletePaymentMethod("123")],
  ])("formats %s duplicate errors with the same user-friendly message", async (_, mutate) => {
    mockP2pFetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      text: async () => JSON.stringify({
        errors: [{ code: "PaymentMethodDuplicate", message: "PaymentMethodDuplicate" }],
      }),
    } as Response)

    await expect(mutate()).resolves.toEqual({
      success: false,
      errors: [{
        code: "PaymentMethodDuplicate",
        message: "You already have this payment method added to your account.",
      }],
    })
  })

  it.each([
    ["add", () => addPaymentMethod("bank_transfer", { account: "123" })],
    ["update", () => updatePaymentMethod("123", { fields: { account: "123" } })],
    ["delete", () => deletePaymentMethod("123")],
  ])("preserves the actionable session-authorization message for %s", async (_, mutate) => {
    mockP2pFetch.mockResolvedValue({
      ok: false,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({
        errors: [{ code: "ActionSessionUnauthorized", message: "Verification expired. Try again." }],
      }),
    } as Response)

    await expect(mutate()).resolves.toEqual({
      success: false,
      errors: [{
        code: "ActionSessionUnauthorized",
        message: "Verification expired. Try again.",
      }],
    })
  })
})
