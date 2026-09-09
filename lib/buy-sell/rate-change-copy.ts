import { formatEffectiveRateDisplay } from "@/lib/exchange-rate-display"

type RateChangeCopyArgs = {
  /** Raw input value from the amount field — may be blank or unparseable. */
  amount: string
  oldRate: number
  newRate: number
}

export type RateChangeCopyParams = {
  oldTotal: string
  newTotal: string
  oldRate: string
  newRate: string
}

/**
 * Values for the "Rate updated" copy.
 *
 * The dialog has to contrast the rate the buyer was quoted against the seller's
 * new one, so both rates go through `formatEffectiveRateDisplay` — the same
 * 2-decimal formatting the order sheet uses for a rate. Formatting only one side,
 * or formatting the two sides differently, is what made the dialog read as though
 * it were reporting a change that had not happened.
 */
export function buildRateChangeCopyParams({
  amount,
  oldRate,
  newRate,
}: RateChangeCopyArgs): RateChangeCopyParams {
  const parsedAmount = Number.parseFloat(amount)
  const numAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0

  return {
    oldTotal: (numAmount * oldRate).toFixed(2),
    newTotal: (numAmount * newRate).toFixed(2),
    oldRate: formatEffectiveRateDisplay(oldRate),
    newRate: formatEffectiveRateDisplay(newRate),
  }
}
