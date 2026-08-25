// eslint-disable-next-line @typescript-eslint/no-unused-vars
import jest from "jest"
import {
  advanceStaleEpisode,
  buildRecoveredRateFormData,
  calculateRecoveredFixedRate,
  extractExchangeRateUpdates,
  getAdvertRatePrefill,
  INITIAL_STALE_EPISODE_STATE,
  isExplicitlyUnavailableRate,
  isFloatingRateRecoveryError,
} from "@/lib/ads/exchange-rate-recovery"

describe("exchange-rate recovery", () => {
  it("parses map, nested, pair, and status-only updates", () => {
    expect(
      extractExchangeRateUpdates(
        { IDR: { rate: "16250.5", status: "ACTIVE" } },
        "exchange_rates/USD",
        "IDR",
      ),
    ).toEqual({ IDR: { rate: 16250.5, status: "active" } })

    expect(
      extractExchangeRateUpdates(
        { data: { rate: "0.92", status: "stale" } },
        "exchange_rates/USD/EUR",
        "EUR",
      ),
    ).toEqual({ EUR: { rate: 0.92, status: "stale" } })

    expect(
      extractExchangeRateUpdates(
        { data: { IDR: { status: "inactive" } } },
        "exchange_rates/USD",
        "IDR",
      ),
    ).toEqual({ IDR: { status: "inactive" } })
    expect(extractExchangeRateUpdates({}, "exchange_rates/USD", "IDR")).toEqual({})
  })

  it("only treats explicit non-active statuses as unavailable", () => {
    expect(isExplicitlyUnavailableRate(null)).toBe(false)
    expect(isExplicitlyUnavailableRate(undefined)).toBe(false)
    expect(isExplicitlyUnavailableRate("active")).toBe(false)
    expect(isExplicitlyUnavailableRate("stale")).toBe(true)
    expect(isExplicitlyUnavailableRate("inactive")).toBe(true)
  })

  it("dedupes repeated stale ticks and resets after active or pair change", () => {
    const first = advanceStaleEpisode(
      INITIAL_STALE_EPISODE_STATE,
      "USD:IDR",
      "stale",
      true,
    )
    expect(first.notify).toBe(true)
    expect(advanceStaleEpisode(first.state, "USD:IDR", "stale", true).notify).toBe(false)

    const active = advanceStaleEpisode(first.state, "USD:IDR", "active", true)
    expect(active.notify).toBe(false)
    expect(advanceStaleEpisode(active.state, "USD:IDR", "stale", true).notify).toBe(true)
    expect(advanceStaleEpisode(first.state, "USD:EUR", "stale", true).notify).toBe(true)
  })

  it("calculates without clamping and caps payment precision at six decimals", () => {
    expect(calculateRecoveredFixedRate(100, "2.5", 2)).toBe("102.50")
    expect(calculateRecoveredFixedRate(1.23456789, -20, 9)).toBe("0.987654")
    expect(calculateRecoveredFixedRate(null, 2, 2)).toBeNull()
  })

  it("builds fixed draft while preserving unrelated wizard state", () => {
    expect(
      buildRecoveredRateFormData(
        { floatingRate: "5", type: "sell", instructions: "keep me" },
        10,
        3,
      ),
    ).toEqual({
      floatingRate: "5",
      type: "sell",
      instructions: "keep me",
      priceType: "fixed",
      fixedRate: 10.5,
    })

    expect(
      buildRecoveredRateFormData({ floatingRate: "5", type: "buy" }, null, 2),
    ).toMatchObject({ type: "buy", priceType: "fixed", fixedRate: "" })
  })

  it("keeps floating edit percentage out of fixed-rate prefill", () => {
    expect(getAdvertRatePrefill("3.5", "float")).toEqual({
      fixedRate: undefined,
      floatingRate: 3.5,
    })
    expect(getAdvertRatePrefill("16250", "fixed")).toEqual({
      fixedRate: 16250,
      floatingRate: "",
    })
  })

  it("uses stale fallback only for floating submissions", () => {
    expect(isFloatingRateRecoveryError("InvalidExchangeRate", "float")).toBe(true)
    expect(isFloatingRateRecoveryError("AdvertFloatRateDisabled", "float")).toBe(true)
    expect(isFloatingRateRecoveryError("InvalidExchangeRate", "fixed")).toBe(false)
  })
})
