import type { AdvertEditSnapshot } from "@/lib/ads/advert-edit-patch"
import {
  buildAdvertEditPatch,
  buildCurrentEditState,
  createAdvertEditSnapshot,
  finalizeAdvertEditPatch,
  hasAdvertEditChanges,
  normalizeUpdateAdPayload,
} from "@/lib/ads/advert-edit-patch"
import { MINIMUM_JOIN_DAYS_API_KEY } from "@/lib/ads/ad-condition-values"

const snapshot = (overrides: Partial<AdvertEditSnapshot> = {}): AdvertEditSnapshot => ({
  advertType: "buy",
  minOrderAmount: 10,
  maxOrderAmount: 100,
  exchangeRate: 16000,
  exchangeRateType: "fixed",
  orderExpiryPeriod: 30,
  availableCountries: [],
  minimumTradeBand: null,
  minimumJoinedDays: null,
  minimumCompletionRate30Day: null,
  isPrivate: false,
  instructions: "",
  paymentMethodNames: ["bank_transfer"],
  paymentMethodIds: [],
  ...overrides,
})

describe("buildAdvertEditPatch", () => {
  it("returns empty object when nothing changed", () => {
    const original = snapshot()
    const current = snapshot()

    expect(buildAdvertEditPatch(original, current)).toEqual({})
    expect(hasAdvertEditChanges(original, current)).toBe(false)
  })

  it("includes only changed scalar fields", () => {
    const original = snapshot()
    const current = snapshot({
      minOrderAmount: 20,
      exchangeRate: 16500,
      orderExpiryPeriod: 45,
      instructions: "Updated note",
      isPrivate: true,
    })

    const patch = buildAdvertEditPatch(original, current)

    expect(patch).toMatchObject({
      minimum_order_amount: 20,
      exchange_rate: 16500,
      order_expiry_period: 45,
      description: "Updated note",
      is_private: true,
    })
    expect(patch).not.toHaveProperty("maximum_order_amount")
    expect(patch).not.toHaveProperty("is_active")
    expect(patch).not.toHaveProperty("available_amount")
  })

  it("sends null description when instructions are cleared", () => {
    const original = snapshot({ instructions: "Keep me" })
    const current = snapshot({ instructions: "" })

    expect(buildAdvertEditPatch(original, current)).toEqual({
      description: null,
    })
  })

  it("sends available_countries only when changed", () => {
    const original = snapshot({ availableCountries: ["MY"] })
    const unchanged = snapshot({ availableCountries: ["MY"] })
    const cleared = snapshot({ availableCountries: [] })

    expect(buildAdvertEditPatch(original, unchanged)).toEqual({})
    expect(buildAdvertEditPatch(original, cleared)).toEqual({
      available_countries: [],
    })
  })

  it("sends bronze when editing advert with legacy minimum trade band", () => {
    const original = snapshot({ minimumTradeBand: "diamond" })
    const current = snapshot()

    expect(buildAdvertEditPatch(original, current)).toEqual({
      minimum_trade_band: "bronze",
    })
  })

  it("includes ad condition fields only when changed", () => {
    const original = snapshot({ minimumJoinedDays: 15 })
    const current = snapshot({
      minimumJoinedDays: 30,
      minimumCompletionRate30Day: 70,
    })

    const patch = buildAdvertEditPatch(original, current)

    expect(patch[MINIMUM_JOIN_DAYS_API_KEY]).toBe(30)
    expect(patch.minimum_completion_rate_30day).toBe(70)
  })

  it("sends 0 when user clears ad conditions to Any", () => {
    const original = snapshot({
      minimumJoinedDays: 30,
      minimumCompletionRate30Day: 70,
    })
    const current = snapshot()

    const patch = buildAdvertEditPatch(original, current)

    expect(patch[MINIMUM_JOIN_DAYS_API_KEY]).toBe(0)
    expect(patch.minimum_completion_rate_30day).toBe(0)
  })

  it("includes payment_method_names only when buy methods changed", () => {
    const original = snapshot({ paymentMethodNames: ["bank_transfer"] })
    const current = snapshot({
      paymentMethodNames: ["bank_transfer", "ewallet"],
    })

    expect(buildAdvertEditPatch(original, current)).toEqual({
      payment_method_names: ["bank_transfer", "ewallet"],
    })
  })

  it("includes payment_method_ids only when sell methods changed", () => {
    const original = snapshot({
      advertType: "sell",
      paymentMethodNames: [],
      paymentMethodIds: [1, 2],
    })
    const current = snapshot({
      advertType: "sell",
      paymentMethodNames: [],
      paymentMethodIds: [1, 3],
    })

    const patch = buildAdvertEditPatch(original, current)

    expect(patch).toEqual({ payment_method_ids: [1, 3] })
    expect(patch).not.toHaveProperty("payment_method_names")
  })
})

describe("hasAdvertEditChanges", () => {
  it("returns false for legacy minimum trade band without user edits", () => {
    const original = snapshot({ minimumTradeBand: "gold" })
    const current = snapshot()

    expect(hasAdvertEditChanges(original, current)).toBe(false)
  })

  it("returns true when ad condition fields change", () => {
    const original = snapshot()
    const current = snapshot({ minimumJoinedDays: 15 })

    expect(hasAdvertEditChanges(original, current)).toBe(true)
  })
})

describe("finalizeAdvertEditPatch", () => {
  it("always includes ad condition fields on edit submit", () => {
    const patch = finalizeAdvertEditPatch({}, null, 70)

    expect(patch).toEqual({
      minimum_join_days: 0,
      minimum_completion_rate_30day: 70,
    })
  })

  it("maps Any (null) to 0 for both ad condition fields", () => {
    const patch = finalizeAdvertEditPatch({}, null, null)

    expect(patch).toEqual({
      minimum_join_days: 0,
      minimum_completion_rate_30day: 0,
    })
  })
})

describe("createAdvertEditSnapshot", () => {
  it("normalizes description, trade band, and ad conditions from API values", () => {
    const result = createAdvertEditSnapshot({
      type: "buy",
      minimumOrderAmount: 10,
      maximumOrderAmount: 100,
      exchangeRate: 16000,
      exchangeRateType: "fixed",
      orderExpiryPeriod: 30,
      availableCountries: ["MY"],
      minimumTradeBand: "bronze",
      minimumJoinedDays: 0,
      minimumCompletionRate30Day: -1,
      isPrivate: false,
      description: "  hello  ",
      paymentMethodNames: ["bank_transfer"],
      paymentMethodIds: [],
    })

    expect(result.instructions).toBe("hello")
    expect(result.minimumTradeBand).toBeNull()
    expect(result.minimumJoinedDays).toBeNull()
    expect(result.minimumCompletionRate30Day).toBeNull()
    expect(result.availableCountries).toEqual(["MY"])
  })

  it("defaults ad conditions to Any when legacy restricted tier was set", () => {
    const result = createAdvertEditSnapshot({
      type: "buy",
      minimumOrderAmount: 10,
      maximumOrderAmount: 100,
      exchangeRate: 16000,
      exchangeRateType: "fixed",
      orderExpiryPeriod: 30,
      availableCountries: ["MY"],
      minimumTradeBand: "gold",
      minimumJoinedDays: 45,
      minimumCompletionRate30Day: 80,
      isPrivate: false,
      description: "",
      paymentMethodNames: ["bank_transfer"],
      paymentMethodIds: [],
    })

    expect(result.minimumTradeBand).toBe("gold")
    expect(result.minimumJoinedDays).toBeNull()
    expect(result.minimumCompletionRate30Day).toBeNull()
  })
})

describe("buildCurrentEditState", () => {
  it("maps form data and step-3 state into a comparable snapshot", () => {
    const current = buildCurrentEditState(
      {
        type: "sell",
        minAmount: 15,
        maxAmount: 150,
        priceType: "float",
        floatingRate: 2.5,
        instructions: " note ",
      },
      {
        orderTimeLimit: 45,
        selectedCountries: ["SG"],
        minimumJoinedDays: 30,
        minimumCompletionRate30Day: 90,
        isPrivate: true,
        selectedPaymentMethodIds: ["1", "2"],
      },
    )

    expect(current).toMatchObject({
      advertType: "sell",
      minOrderAmount: 15,
      maxOrderAmount: 150,
      exchangeRate: 2.5,
      exchangeRateType: "float",
      orderExpiryPeriod: 45,
      availableCountries: ["SG"],
      minimumJoinedDays: 30,
      minimumCompletionRate30Day: 90,
      isPrivate: true,
      instructions: "note",
      paymentMethodIds: [1, 2],
    })
  })
})

describe("normalizeUpdateAdPayload", () => {
  it("does not inject payment or country keys when absent", () => {
    const payload = normalizeUpdateAdPayload({
      minimum_order_amount: 20,
    })

    expect(payload).toEqual({ minimum_order_amount: 20 })
  })

  it("normalizes only keys present on the payload", () => {
    const payload = normalizeUpdateAdPayload({
      payment_method_names: "bank_transfer",
      payment_method_ids: null,
      available_countries: null,
    })

    expect(payload).toEqual({
      payment_method_names: ["bank_transfer"],
      payment_method_ids: null,
      available_countries: null,
    })
  })

  it("preserves empty available_countries array", () => {
    const payload = normalizeUpdateAdPayload({
      available_countries: [],
    })

    expect(payload).toEqual({ available_countries: [] })
  })
})
