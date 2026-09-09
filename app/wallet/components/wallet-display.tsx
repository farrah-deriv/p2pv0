"use client"

import Image from "next/image"
import { currencyLogoMapper } from "@/lib/utils"

interface WalletDisplayProps {
  name: string
  amount: string
  currency: string
  isP2PWallet: boolean
  onClick?: () => void
  isSelected?: boolean
}

export default function WalletDisplay({ name, amount, currency, isP2PWallet, onClick, isSelected }: WalletDisplayProps) {
  return (
    <div
      className={`h-[76px] px-4 py-2 flex items-center self-stretch rounded-lg bg-grayscale-500 cursor-pointer hover:bg-gray-100 transition-colors ${
        isSelected ? "border border-black" : ""
      }`}
      onClick={onClick}
    >
      {isP2PWallet ? (
        <div className="w-8 h-8 flex-shrink-0 relative">
          <Image src="/icons/p2p-black.png" alt="P2P" width={28} height={28} className="rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4">
            <div className="w-[14px] h-[14px] rounded-full bg-white flex items-center justify-center">
              <Image
                src={currencyLogoMapper[currency as keyof typeof currencyLogoMapper]}
                alt={currency}
                width={12}
                height={12}
                className="rounded-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-8 h-8 flex-shrink-0">
          <Image
            src={currencyLogoMapper[currency as keyof typeof currencyLogoMapper]}
            alt={name}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}

      <div className="flex-1 ms-4">
        <h3 className="text-slate-1200 text-base font-normal">{name}</h3>
        <p className="text-grayscale-text-muted text-sm font-normal">
          {amount} {currency}
        </p>
      </div>

      <div className="ms-4">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            isSelected ? "border-black bg-black" : "border-grayscale-text-muted"
          }`}
        >
          {isSelected && <div className="w-[0.4rem] h-[0.4rem] bg-white rounded-full" />}
        </div>
      </div>
    </div>
  )
}
