export function formatEffectiveRateDisplay(
  rate: number | null | undefined,
  formatRate = true,
): string {
  if (rate == null) return ""
  if (formatRate && typeof rate === "number") {
    return rate.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return String(rate)
}

export type ExchangeRateLine = {
  primary: string
  muted: string
  mutedPosition: "prefix" | "suffix"
}

/** Build exchange rate copy for LTR vs RTL (account currency muted). */
export function buildExchangeRateLine(
  rate: number | null | undefined,
  paymentCurrency: string,
  accountCurrency: string,
  rtl: boolean,
  formatRate = true,
): ExchangeRateLine {
  const formattedRate = formatEffectiveRateDisplay(rate, formatRate)

  if (rtl) {
    return {
      primary: `${paymentCurrency} ${formattedRate}`.trim(),
      muted: `${accountCurrency}/`,
      mutedPosition: "prefix",
    }
  }

  return {
    primary: `${formattedRate} ${paymentCurrency}`.trim(),
    muted: `/${accountCurrency}`,
    mutedPosition: "suffix",
  }
}
