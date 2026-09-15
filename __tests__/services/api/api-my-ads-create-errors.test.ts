import { createAd, updateAd, type AdvertApiError, type CreateAdPayload } from "@/services/api/api-my-ads"
import { p2pFetch } from "@/services/api/p2p-fetch"

jest.mock("@/services/api/p2p-fetch", () => ({
  p2pFetch: jest.fn(),
}))

const mockedP2pFetch = p2pFetch as jest.MockedFunction<typeof p2pFetch>

/** Minimum viable create payload — none of these values reach the mocked transport. */
const payload: CreateAdPayload = {
  type: "sell",
  account_currency: "USD",
  payment_currency: "IDR",
  minimum_order_amount: 10,
  maximum_order_amount: 100,
  available_amount: 1000,
  exchange_rate: 15000,
  exchange_rate_type: "fixed",
  description: "",
  is_active: 1,
  order_expiry_period: 15,
  payment_method_names: [],
}

function respondWith(body: unknown, status = 400) {
  mockedP2pFetch.mockResolvedValue(
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

function firstError(result: { errors?: AdvertApiError[] }): AdvertApiError {
  expect(result.errors).toBeDefined()
  expect(result.errors).toHaveLength(1)
  return (result.errors as AdvertApiError[])[0]
}

describe("createAd error normalisation", () => {
  beforeEach(() => {
    mockedP2pFetch.mockReset()
  })

  it.each(["AdvertLimitReached", "InvalidOrderAmount", "AdvertFloatRateMaximum"])(
    "preserves the backend code %s instead of collapsing it to 'Error'",
    async (code) => {
      respondWith({ errors: [{ code, message: `backend copy for ${code}`, status: 400 }] })

      const result = await createAd(payload)

      expect(result.success).toBe(false)
      const error = firstError(result)
      expect(error.code).toBe(code)
      expect(error.code).not.toBe("Error")
      expect(error.code).not.toBe("UnknownError")
      expect(error.message).not.toBe("ad_limit_reached")
      expect(error.status).toBe(400)
    },
  )

  it("keeps the backend message rather than substituting hardcoded English", async () => {
    respondWith({
      errors: [{ code: "AdvertLimitReached", message: "backend copy wins", status: 400 }],
    })

    const error = firstError(await createAd(payload))

    expect(error.message).toBe("backend copy wins")
  })

  it("preserves detail.existing_advert_id through an AdvertOrderRangeOverlap rejection", async () => {
    respondWith({
      errors: [
        {
          code: "AdvertOrderRangeOverlap",
          status: 400,
          detail: { existing_advert_id: 123 },
          existing_advert_id: 123,
        },
      ],
    })

    const error = firstError(await createAd(payload))

    expect(error.code).toBe("AdvertOrderRangeOverlap")
    expect(error.detail?.existing_advert_id).toBe(123)
    expect(error.existing_advert_id).toBe(123)
  })

  it("never emits the ad_limit_reached sentinel on any create path", async () => {
    const bodies: unknown[] = [
      { errors: [{ code: "AdvertLimitReached", message: "Too many ads", status: 400 }] },
      { errors: [{ code: "InvalidOrderAmount", message: "Bad limits", status: 400 }] },
      { errors: [{ message: "You have exceeded your daily limit" }] },
      { error: "Some limit was hit" },
    ]

    for (const body of bodies) {
      respondWith(body)
      const result = await createAd(payload)
      expect(JSON.stringify(result.errors)).not.toContain("ad_limit_reached")
    }
  })

  it("leaves code undefined when the backend supplied none, rather than inventing one", async () => {
    respondWith({ errors: [{ message: "You have exceeded your daily limit" }] })

    const error = firstError(await createAd(payload))

    expect(error.code).toBeUndefined()
    expect(error.message).toBe("You have exceeded your daily limit")
  })

  it("returns a single technical entry with no code for an unparseable failure", async () => {
    mockedP2pFetch.mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }),
    )

    const result = await createAd(payload)

    expect(result.success).toBe(false)
    const error = firstError(result)
    expect(error.code).toBeUndefined()
    expect(error.message).toContain("Bad Gateway")
  })
})

describe("createAd and updateAd normalise the same backend body identically", () => {
  beforeEach(() => {
    mockedP2pFetch.mockReset()
  })

  it.each([
    ["AdvertLimitReached", { code: "AdvertLimitReached", message: "Too many ads", status: 400 }],
    ["InvalidOrderAmount", { code: "InvalidOrderAmount", message: "Bad limits", status: 400 }],
    [
      "AdvertOrderRangeOverlap",
      {
        code: "AdvertOrderRangeOverlap",
        message: "Range overlaps",
        status: 400,
        detail: { existing_advert_id: 77 },
      },
    ],
  ])("yields an equivalently shaped first entry for %s", async (_label, entry) => {
    respondWith({ errors: [entry] })
    const created = firstError(await createAd(payload))

    respondWith({ errors: [entry] })
    const updated = firstError(await updateAd("42", { available_amount: 5 }))

    expect(created.code).toBe(updated.code)
    expect(created.message).toBe(updated.message)
    expect(created.detail).toEqual(updated.detail)
  })
})
