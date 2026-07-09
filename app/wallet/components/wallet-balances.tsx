"use client"

import Image from "next/image"
import BalanceItem from "./balance-item"
import { useTranslations } from "@/lib/i18n/use-translations"
import BuyCurrencies from "./buy-currencies"
import { Skeleton } from "@/components/ui/skeleton"

interface Balance {
  amount: string
  currency: string
  label: string
}

interface WalletBalancesProps {
  onBalanceClick?: (currency: string, amount: string) => void
  balances?: Balance[]
  isLoading?: boolean
}

export default function WalletBalances({ onBalanceClick, balances = [], isLoading = true }: WalletBalancesProps) {
  const { t } = useTranslations()

  if (isLoading) {
    return (
      <div data-testid="wallet-skeleton" className="w-full">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between h-[72px] w-full relative">
              <div className="flex items-center gap-4 ps-0 w-full">
                <Skeleton className="h-7 w-7 rounded-full flex-shrink-0 bg-grayscale-500" />
                <Skeleton className="h-5 w-24 bg-grayscale-500" />
              </div>
              <Skeleton className="h-5 w-32 bg-grayscale-500" />
              <div className="absolute bottom-0 start-10 end-0 h-[1px] bg-grayscale-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (balances.length === 0) {
    return <div data-testid="wallet-empty-state"><BuyCurrencies /></div>
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
        {balances
          .filter((wallet) => wallet.currency === "USD")
          .map((wallet) => (
            <BalanceItem
              key={wallet.currency}
              currency={wallet.currency}
              amount={wallet.amount}
              label={`P2P ${wallet.label}`}
              currencyLabel={wallet.label}
              onClick={() => onBalanceClick?.(wallet.currency, wallet.amount)}
            />
          ))}
      </div>
    </div>
  )
}
