import type { Advertisement } from "@/services/api/api-buy-sell"

export type RiskWarningType = "high_block_count" | "low_completion_rate"

export const HIGH_BLOCK_COUNT_THRESHOLD = 30
export const LOW_COMPLETION_RATE_THRESHOLD = 80
export const MIN_ORDER_COUNT_FOR_WARNING = 10

export interface RiskWarningResult {
  type: RiskWarningType
  isBuyAdvert: boolean
  completionRate?: number
  orderCount?: number
  blockCount?: number
}

const TRUSTED_TIERS = ["gold", "diamond"] as const

export function evaluateRisk(ad: Advertisement): RiskWarningResult | null {
  if (ad.user.trade_band && TRUSTED_TIERS.includes(ad.user.trade_band as (typeof TRUSTED_TIERS)[number])) {
    return null
  }

  const isBuyAdvert = ad.type === "buy"
  const blockCount = ad.user.blocked_by_count ?? 0

  if (blockCount >= HIGH_BLOCK_COUNT_THRESHOLD) {
    return { type: "high_block_count", isBuyAdvert, blockCount }
  }

  const rate = isBuyAdvert
    ? ad.user.completion_rate_buy_30day
    : ad.user.completion_rate_sell_30day
  // Combined buy+sell volume is intentional: gates "is this advertiser
  // established enough to be judged on completion rate", not direction-specific
  // throughput. Matches the mobile predicate.
  const count =
    (ad.user.order_count_buy_30day ?? 0) + (ad.user.order_count_sell_30day ?? 0)

  if (rate == null) return null
  if (rate < LOW_COMPLETION_RATE_THRESHOLD && count >= MIN_ORDER_COUNT_FOR_WARNING) {
    return {
      type: "low_completion_rate",
      isBuyAdvert,
      completionRate: rate,
      orderCount: count,
    }
  }
  return null
}
