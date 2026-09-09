"use client"

import type React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/use-translations"

interface DepositOptionProps {
  onClose: () => void
  onDirectDepositClick: () => void
  selectedCurrency?: string
}

export default function DepositOptions({ onClose, onDirectDepositClick, selectedCurrency }: DepositOptionProps) {
  const router = useRouter()
  const { t } = useTranslations()

  const handleDirectDepositClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    onDirectDepositClick()
  }

  const handleP2PTradingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    if (selectedCurrency) {
      router.push(`/?operation=buy&currency=${selectedCurrency}`)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="space-y-0 mt-6">
      <div
        data-testid="wallet-sidebar-btn-deposit"
        className="flex justify-center items-center gap-4 self-stretch cursor-pointer pl-0 md:pl-6 py-4"
        onClick={handleP2PTradingClick}
      >
        <div className="flex-shrink-0  rounded-full flex items-center justify-center mb-4">
          <Image src="/icons/up-down-arrows.png" alt={t("common.trade")} width={24} height={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-normal text-slate-1200 leading-6">{t("wallet.marketplaceTitle")}</h3>
          <p className="text-grayscale-text-muted text-xs font-normal leading-[22px] me-6 md:me-0">
            {t("wallet.marketplaceDescription")}
          </p>

          <div className="border-b border-grayscale-200 mt-4 ms-0"></div>
        </div>
      </div>

      <div
        className="flex justify-center items-center gap-4 self-stretch cursor-pointer pl-0 md:pl-6 py-0 hidden"
        onClick={handleDirectDepositClick}
      >
        <div className="flex-shrink-0  rounded-full flex items-center justify-center mb-4">
          <Image src="/icons/bank-icon.png" alt={t("common.bank")} width={24} height={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-normal text-slate-1200 leading-6">{t("wallet.directDepositTitle")}</h3>
          <p className="text-grayscale-text-muted text-xs font-normal leading-[22px] me-6 md:me-0">
            {t("wallet.directDepositDescription")}
          </p>

          <div className="border-b border-grayscale-200 mt-4 ms-0"></div>
        </div>
      </div>
    </div>
  )
}
