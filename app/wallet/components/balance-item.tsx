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
      className="flex items-center justify-between h-[72px] w-full cursor-pointer transition-colors relative"
    >
      <div className="flex items-center gap-4 ps-0">
        <div className="flex-shrink-0 relative w-7 h-7">
          <Image src="/icons/p2p-black.png" alt="P2P" width={28} height={28} className="w-7 h-7 rounded-full" />

          <div className="absolute -bottom-1 start-1/2 -translate-x-1/2">
            {logo ? (
              <div className="w-[14px] h-[14px] rounded-full bg-white flex items-center justify-center p-[2px]">
                <Image
                  src={logo}
                  alt={`${currency} logo`}
                  width={12}
                  height={12}
                  className="w-3 h-3 rounded-full object-contain"
                />
              </div>
            ) : (
              <div className="w-[14px] h-[14px] rounded-full bg-white flex items-center justify-center p-[2px]">
                <div className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-600">
                  {currency.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-slate-1200 text-base font-normal">{label || currency}</div>
      </div>

      <div data-testid={`wallet-text-balance-${currency}`} className="text-slate-1200 text-base font-normal pe-6">
        {displayAmount} {currency}
      </div>

      <div className="absolute bottom-0 start-10 end-0 h-[1px] bg-grayscale-200" />
    </div>
  )
}
