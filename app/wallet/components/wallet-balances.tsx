"use client"

import BalanceItem from "./balance-item"
import { useTranslations } from "@/lib/i18n/use-translations"
import BuyCurrencies from "./buy-currencies"
import EmptyState from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveListViewState } from "@/lib/errors/resolve-list-view-state"

interface Balance {
  amount: string
  currency: string
  label: string
}

interface WalletBalancesProps {
  onBalanceClick?: (currency: string, amount: string) => void
  balances?: Balance[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

export default function WalletBalances({
  onBalanceClick,
  balances = [],
  isLoading = true,
  isError = false,
  onRetry,
}: WalletBalancesProps) {
  const { t } = useTranslations()
  const viewState = resolveListViewState({ isLoading, isError, itemCount: balances.length })

  if (viewState === "loading") {
    return (
      <div data-testid="wallet-skeleton" className="w-full">
        <div className="mb-2 px-6 lg:px-0">
          <Skeleton className="h-6 w-32 bg-grayscale-500" />
        </div>
        <div className="flex w-full flex-col">
          {[1, 2].map((i) => (
            <div key={i} className="relative w-full">
              <div className="flex h-[72px] w-full items-center justify-between px-6 lg:px-0">
                <div className="flex min-w-0 items-center gap-4">
                  <Skeleton className="h-7 w-7 flex-shrink-0 rounded-full bg-grayscale-500" />
                  <Skeleton className="h-5 w-24 bg-grayscale-500" />
                </div>
                <Skeleton className="h-5 w-32 shrink-0 bg-grayscale-500" />
              </div>
              <div className="absolute bottom-0 start-16 end-0 h-px bg-grayscale-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (viewState === "error") {
    return (
      <div className="px-6" data-testid="wallet-error-balances">
        <EmptyState
          title={t("errors.loadWalletsFailedTitle")}
          description={t("errors.loadFailedDescription")}
          actionLabel={t("errors.retry")}
          onAction={onRetry}
        />
      </div>
    )
  }

  if (viewState === "empty") {
    return <div data-testid="wallet-empty-state" className="px-6"><BuyCurrencies /></div>
  }

  return (
    <div className="w-full">
      <h2 className="mb-2 px-6 lg:px-0 text-base font-extrabold text-slate-1200">{t("wallet.p2pWallets")}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        {balances
          .filter((wallet) => wallet.currency === "USD")
          .map((wallet) => (
            <BalanceItem
              key={wallet.currency}
              currency={wallet.currency}
              amount={wallet.amount}
              label={wallet.label}
              currencyLabel={wallet.label}
              onClick={() => onBalanceClick?.(wallet.currency, wallet.amount)}
            />
          ))}
      </div>
    </div>
  )
}
