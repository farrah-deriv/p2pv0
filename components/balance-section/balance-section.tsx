"use client"

import { formatAmountWithDecimals } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/lib/i18n/use-translations"

interface BalanceSectionProps {
  balance: string
  currency: string
  isLoading: boolean
  className?: string
}

export function BalanceSection({ balance, currency, isLoading, className }: BalanceSectionProps) {
  const { t } = useTranslations()
  const displayAmount = !balance || isNaN(Number(balance)) ? "0.00" : formatAmountWithDecimals(balance)
  const displayCurrency = currency || "USD"

  return (
    <div className={className}>
      <div className="text-white opacity-[0.72] text-xs mb-1">{t("wallet.estTotalValue")}</div>
      {isLoading ? (
        <Skeleton className="h-7 w-32 animate-shimmer-dark" />
      ) : (
        <div className="text-white text-[20px] font-extrabold leading-tight">{`${displayAmount} ${displayCurrency}`}</div>
      )}
    </div>
  )
}
