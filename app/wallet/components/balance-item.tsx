"use client"

import Image from "next/image"
import { currencyLogoMapper, formatAmountWithDecimals } from "@/lib/utils"

interface BalanceItemProps {
  currency: string
  amount: string
  label?: string
  currencyLabel?: string
  onClick?: () => void
}

export default function BalanceItem({ currency, amount, label, currencyLabel, onClick }: BalanceItemProps) {
  const logo = currencyLogoMapper[currency as keyof typeof currencyLogoMapper]

  const displayAmount = isNaN(Number(amount)) ? "0.00" : formatAmountWithDecimals(amount)

  return (
    <div
      onClick={onClick}
      data-testid={`wallet-card-balance-${currency}`}
      className="relative w-full cursor-pointer transition-colors"
    >
      {/* Content pad matches WalletSummary `p-6` (1.5rem); separator below is full-bleed. */}
      <div className="flex h-[72px] w-full items-center justify-between px-6 lg:px-0">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-7 w-7 flex-shrink-0">
            <Image src="/icons/p2p-black.png" alt="P2P" width={28} height={28} className="h-7 w-7 rounded-full" />

            <div className="absolute -bottom-1 start-1/2 -translate-x-1/2">
              {logo ? (
                <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white p-[2px]">
                  <Image
                    src={logo}
                    alt={`${currency} logo`}
                    width={12}
                    height={12}
                    className="h-3 w-3 rounded-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white p-[2px]">
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-gray-200 text-[8px] font-semibold text-gray-600">
                    {currency.charAt(0)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-base font-normal text-slate-1200">{label || currency}</div>
        </div>

        <div
          data-testid={`wallet-text-balance-${currency}`}
          className="shrink-0 text-base font-normal text-slate-1200"
        >
          {displayAmount} {currency}
        </div>
      </div>
    </div>
  )
}
