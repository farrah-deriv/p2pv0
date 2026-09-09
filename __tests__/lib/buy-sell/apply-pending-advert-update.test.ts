import { applyPendingAdvertUpdate } from "@/lib/buy-sell/apply-pending-advert-update"
import type { Advertisement } from "@/services/api/api-buy-sell"

const baseAd = {
  id: 42,
  account_currency: "USD",
  payment_currency: "NPR",
  description: "Old terms",
  minimum_order_amount: "1.00",
  actual_maximum_order_amount: "1.04",
  order_expiry_period: 15,
  payment_methods: ["mpesa_tanzania"],
  payment_method_names: ["Mpesa Tanzania"],
  exchange_rate: 150,
  exchange_rate_type: "fixed",
  effective_rate: 150,
  effective_rate_display: 150,
  version: 3,
} as unknown as Advertisement

/** A non-rate advert frame: seller swapped the payment method and tightened limits. */
const nonRateFrame = {
  ...baseAd,
  description: "New terms",
  minimum_order_amount: "1.02",
  actual_maximum_order_amount: "1.04",
  order_expiry_period: 30,
  payment_methods: ["safaricom_mpesa"],
  payment_method_names: ["Safaricom Mpesa"],
  version: 4,
} as unknown as Advertisement

const rateFrame = { effective_rate: 152, effective_rate_display: 152, version: 5 }

describe("applyPendingAdvertUpdate", () => {
  it("applies the non-rate fields the seller changed", () => {
    const merged = applyPendingAdvertUpdate({
      localAd: baseAd,
      pendingAdvertUpdate: nonRateFrame,
      pendingRateUpdate: null,
    })

    expect(merged.description).toBe("New terms")
    expect(merged.minimum_order_amount).toBe("1.02")
    expect(merged.actual_maximum_order_amount).toBe("1.04")
    expect(merged.order_expiry_period).toBe(30)
    expect(merged.payment_methods).toEqual(["safaricom_mpesa"])
    expect(merged.payment_method_names).toEqual(["Safaricom Mpesa"])
  })

  it("leaves the rate alone when only non-rate fields changed", () => {
    const merged = applyPendingAdvertUpdate({
      localAd: baseAd,
      pendingAdvertUpdate: nonRateFrame,
      pendingRateUpdate: null,
    })

    expect(merged.effective_rate).toBe(150)
    expect(merged.effective_rate_display).toBe(150)
    expect(merged.version).toBe(4)
  })

  // The reported defect: a combined rate + payment-method save populates both
  // pending states, the "Ad updated" sheet wins, and the rate was dropped.
  it("applies the pending rate in the same commit as the non-rate fields", () => {
    const merged = applyPendingAdvertUpdate({
      localAd: baseAd,
      pendingAdvertUpdate: nonRateFrame,
      pendingRateUpdate: rateFrame,
    })

    expect(merged.effective_rate).toBe(152)
    expect(merged.effective_rate_display).toBe(152)
    expect(merged.payment_method_names).toEqual(["Safaricom Mpesa"])
  })

  it("carries the newer of the two pending versions so the submit is not stale", () => {
    expect(
      applyPendingAdvertUpdate({
        localAd: baseAd,
        pendingAdvertUpdate: nonRateFrame,
        pendingRateUpdate: rateFrame,
      }).version,
    ).toBe(5)

    // Order of arrival is not guaranteed — the advert frame can be the newer one.
    expect(
      applyPendingAdvertUpdate({
        localAd: baseAd,
        pendingAdvertUpdate: { ...nonRateFrame, version: 9 } as Advertisement,
        pendingRateUpdate: rateFrame,
      }).version,
    ).toBe(9)
  })

  it("falls back to whichever version is defined", () => {
    const merged = applyPendingAdvertUpdate({
      localAd: baseAd,
      pendingAdvertUpdate: { ...nonRateFrame, version: undefined } as Advertisement,
      pendingRateUpdate: rateFrame,
    })

    expect(merged.version).toBe(5)
  })

  it("does not mutate the advert it was given", () => {
    applyPendingAdvertUpdate({
      localAd: baseAd,
      pendingAdvertUpdate: nonRateFrame,
      pendingRateUpdate: rateFrame,
    })

    expect(baseAd.effective_rate_display).toBe(150)
    expect(baseAd.payment_method_names).toEqual(["Mpesa Tanzania"])
  })
})
