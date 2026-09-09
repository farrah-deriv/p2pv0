"use client"

import { isRtlLocale } from "@/lib/i18n/config"
import { formatEffectiveRateDisplay } from "@/lib/exchange-rate-display"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

export { formatEffectiveRateDisplay, buildExchangeRateLine } from "@/lib/exchange-rate-display"

type ExchangeRateDisplayProps = {
  rate: number | null | undefined
  paymentCurrency: string
  accountCurrency?: string
  className?: string
  mutedClassName?: string
  formatRate?: boolean
}

/**
 * Exchange rate line: payment currency + rate vs account currency (muted).
 * RTL: account currency first (e.g. "USD/ AMD 374.00").
 * LTR: rate + payment first (e.g. "374.00 AMD /USD").
 */
export function ExchangeRateDisplay({
  rate,
  paymentCurrency,
  accountCurrency,
  className,
  mutedClassName = "text-grayscale-text-muted",
  formatRate = true,
}: ExchangeRateDisplayProps) {
  const { locale } = useTranslations()
  const rtl = isRtlLocale(locale)
  const formattedRate = formatEffectiveRateDisplay(rate, formatRate)
  const paymentAndRate = rtl
    ? `${paymentCurrency} ${formattedRate}`.trim()
    : `${formattedRate} ${paymentCurrency}`.trim()

  // Slash in its own segment: RTL "USD/" + gap + "AMD …"; LTR "AMD …" + gap + "/USD".
  // `dir=ltr` keeps typographic order; page `dir=rtl` must not flip flex children.
  return (
    <span dir="ltr" className={cn("inline-flex items-baseline gap-1", className)}>
      {rtl ? (
        <>
          {accountCurrency && <span className={mutedClassName}>{accountCurrency}</span>}
          {accountCurrency && <span className={mutedClassName}>/</span>}
          <span>{paymentAndRate}</span>
        </>
      ) : (
        <>
          <span>{paymentAndRate}</span>
          {accountCurrency && <span className={mutedClassName}>/</span>}
          {accountCurrency && <span className={mutedClassName}>{accountCurrency}</span>}
        </>
      )}
    </span>
  )
}
