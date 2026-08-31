import { readExistingAdvertId } from "@/lib/ads/range-overlap-error"
import { createAd } from "@/services/api/api-my-ads"

jest.mock("@/services/api/p2p-fetch", () => ({
  p2pFetch: jest.fn(),
}))

jest.mock("@/lib/local-variables", () => ({
  API: { baseUrl: "https://test.api.deriv.com", endpoints: { ads: "/adverts" } },
  AUTH: { getAuthHeader: () => ({ "Content-Type": "application/json" }) },
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: { getState: jest.fn(() => ({})) },
}))

const { p2pFetch } = jest.requireMock("@/services/api/p2p-fetch") as {
  p2pFetch: jest.Mock
}

const payload = {
  type: "buy" as const,
  account_currency: "USD",
  payment_currency: "AMD",
  minimum_order_amount: 2,
  maximum_order_amount: 4,
  available_amount: 10,
  exchange_rate: 364.69,
  exchange_rate_type: "fixed" as const,
  description: "",
  is_active: 1,
  order_expiry_period: 15,
  payment_method_names: ["2checkout"],
}

function rejectWith(body: unknown, status = 400) {
  p2pFetch.mockResolvedValue({
    ok: false,
    status,
    statusText: "Bad Request",
    text: async () => JSON.stringify(body),
  } as Response)
}

describe("createAd error payload", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("passes the nested detail through untouched on an overlap rejection", async () => {
    rejectWith({
      errors: [{ status: 400, code: "AdvertOrderRangeOverlap", detail: { existing_advert_id: 4282 } }],
    })

    const result = await createAd(payload)

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        code: "AdvertOrderRangeOverlap",
        status: 400,
        detail: { existing_advert_id: 4282 },
      }),
    )
  })

  it("keeps the mapped code and message alongside the passed-through detail", async () => {
    rejectWith({
      errors: [
        {
          status: 400,
          code: "AdvertExchangeRateDuplicate",
          message: "raw backend copy",
          detail: { existing_advert_id: 7 },
        },
      ],
    })

    const result = await createAd(payload)

    expect(result.errors?.[0].code).toBe("AdvertExchangeRateDuplicate")
    expect(result.errors?.[0].message).toBe(
      "You already have an ad with this exchange rate. Please use a different rate.",
    )
    expect(result.errors?.[0].detail).toEqual({ existing_advert_id: 7 })
  })

  it("still reports a code-only rejection that carries no extra fields", async () => {
    rejectWith({ errors: [{ status: 400, code: "InsufficientBalance" }] })

    const result = await createAd(payload)

    expect(result.errors?.[0].code).toBe("InsufficientBalance")
    expect(result.errors?.[0].detail).toBeUndefined()
    expect(result.errors?.[0].existing_advert_id).toBeUndefined()
  })

  /**
   * The regression this PR exists to close: a verbatim backend 400 goes in one end and the
   * form must come out the other with an id to resolve. Asserting the two halves separately
   * is what let the reader stay broken while every test stayed green.
   */
  it("hands the reader an id it can resolve, end to end", async () => {
    rejectWith({
      errors: [{ status: 400, code: "AdvertOrderRangeOverlap", detail: { existing_advert_id: 4282 } }],
      meta: { endpoint: "/tenant/.../adverts", method: "POST", timing: 0.138 },
      data: {},
    })

    const result = await createAd(payload)

    expect(readExistingAdvertId(result)).toBe("4282")
  })
})
