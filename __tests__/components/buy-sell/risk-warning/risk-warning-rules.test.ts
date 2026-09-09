import type { Advertisement } from "@/services/api/api-buy-sell"

import { evaluateRisk } from "@/components/buy-sell/risk-warning/risk-warning-rules"

function makeAd(overrides: {
  type?: "buy" | "sell"
  user?: Partial<Advertisement["user"]>
}): Advertisement {
  return {
    id: 1,
    type: overrides.type ?? "buy",
    account_currency: "USD",
    actual_maximum_order_amount: "1000",
    available_amount: 1000,
    created_at: 0,
    description: "",
    exchange_rate: 1,
    exchange_rate_type: "fixed",
    is_active: true,
    maximum_order_amount: "1000",
    minimum_order_amount: "1",
    order_expiry_period: 15,
    payment_currency: "USD",
    payment_method_names: [],
    payment_methods: [],
    user: {
      nickname: "tester",
      id: 1,
      is_favourite: false,
      created_at: 0,
      ...overrides.user,
    },
  }
}

describe("evaluateRisk", () => {
  describe("high block count (priority 1)", () => {
    it("returns high_block_count when blocked_by_count is exactly 30 (inclusive)", () => {
      const ad = makeAd({ user: { blocked_by_count: 30 } })
      const result = evaluateRisk(ad)
      expect(result?.type).toBe("high_block_count")
      expect(result?.blockCount).toBe(30)
    })

    it("returns high_block_count when blocked_by_count > 30", () => {
      const ad = makeAd({ user: { blocked_by_count: 31 } })
      expect(evaluateRisk(ad)?.type).toBe("high_block_count")
    })

    it("high_block_count wins when both block and completion rate would trigger", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          blocked_by_count: 31,
          completion_rate_sell_30day: 50,
          order_count_sell_30day: 20,
        },
      })
      expect(evaluateRisk(ad)?.type).toBe("high_block_count")
    })

    it("does NOT return high_block_count when blocked_by_count is 29", () => {
      const ad = makeAd({ user: { blocked_by_count: 29 } })
      expect(evaluateRisk(ad)?.type).not.toBe("high_block_count")
    })

    it("propagates isBuyAdvert flag for buy advert", () => {
      const ad = makeAd({ type: "buy", user: { blocked_by_count: 30 } })
      expect(evaluateRisk(ad)?.isBuyAdvert).toBe(true)
    })

    it("propagates isBuyAdvert flag for sell advert", () => {
      const ad = makeAd({ type: "sell", user: { blocked_by_count: 30 } })
      expect(evaluateRisk(ad)?.isBuyAdvert).toBe(false)
    })
  })

  describe("low completion rate (priority 2)", () => {
    it("buy advert reads completion_rate_sell_30day", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          completion_rate_sell_30day: 79.99,
          order_count_buy_30day: 5,
          order_count_sell_30day: 5,
        },
      })
      const result = evaluateRisk(ad)
      expect(result?.type).toBe("low_completion_rate")
      expect(result?.completionRate).toBe(79.99)
      expect(result?.orderCount).toBe(10)
    })

    it("sell advert reads completion_rate_buy_30day", () => {
      const ad = makeAd({
        type: "sell",
        user: {
          completion_rate_buy_30day: 50,
          order_count_buy_30day: 6,
          order_count_sell_30day: 5,
        },
      })
      const result = evaluateRisk(ad)
      expect(result?.type).toBe("low_completion_rate")
      expect(result?.completionRate).toBe(50)
      expect(result?.orderCount).toBe(11)
    })

    it("returns null when relevant completion rate is null", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          completion_rate_sell_30day: null,
          order_count_buy_30day: 100,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("returns null when combined order count is 9 (just below threshold)", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          completion_rate_sell_30day: 50,
          order_count_buy_30day: 4,
          order_count_sell_30day: 5,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("triggers when combined order count is exactly 10 (inclusive)", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          completion_rate_sell_30day: 50,
          order_count_buy_30day: 5,
          order_count_sell_30day: 5,
        },
      })
      expect(evaluateRisk(ad)?.type).toBe("low_completion_rate")
    })

    it("returns null when completion rate is exactly 80 (strict <)", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          completion_rate_sell_30day: 80,
          order_count_buy_30day: 10,
          order_count_sell_30day: 10,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })
  })

  describe("trusted tier bypass (gold / diamond)", () => {
    it("returns null for a gold advertiser even when block count would trigger", () => {
      const ad = makeAd({ user: { trade_band: "gold", blocked_by_count: 50 } })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("returns null for a diamond advertiser even when block count would trigger", () => {
      const ad = makeAd({ user: { trade_band: "diamond", blocked_by_count: 50 } })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("returns null for a gold advertiser even when completion rate would trigger", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          trade_band: "gold",
          completion_rate_sell_30day: 10,
          order_count_buy_30day: 10,
          order_count_sell_30day: 10,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("returns null for a diamond advertiser even when completion rate would trigger", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          trade_band: "diamond",
          completion_rate_sell_30day: 10,
          order_count_buy_30day: 10,
          order_count_sell_30day: 10,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("still evaluates risk for a bronze advertiser", () => {
      const ad = makeAd({ user: { trade_band: "bronze", blocked_by_count: 30 } })
      expect(evaluateRisk(ad)?.type).toBe("high_block_count")
    })

    it("still evaluates risk for a silver advertiser", () => {
      const ad = makeAd({ user: { trade_band: "silver", blocked_by_count: 30 } })
      expect(evaluateRisk(ad)?.type).toBe("high_block_count")
    })

    it("still evaluates risk when trade_band is undefined", () => {
      const ad = makeAd({ user: { blocked_by_count: 30 } })
      expect(evaluateRisk(ad)?.type).toBe("high_block_count")
    })
  })

  describe("no warning", () => {
    it("returns null when no thresholds match", () => {
      const ad = makeAd({
        type: "buy",
        user: {
          blocked_by_count: 0,
          completion_rate_sell_30day: 99,
          order_count_buy_30day: 50,
          order_count_sell_30day: 50,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })

    it("returns null when block count is 0 and rates are null", () => {
      const ad = makeAd({
        user: {
          blocked_by_count: 0,
          completion_rate_buy_30day: null,
          completion_rate_sell_30day: null,
        },
      })
      expect(evaluateRisk(ad)).toBeNull()
    })
  })
})
