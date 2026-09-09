"use client"

import type React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/use-translations"

interface WithdrawOptionProps {
  onClose: () => void
  onDirectWithdrawClick: () => void
  selectedCurrency?: string
}

export default function WithdrawOptions({ onClose, onDirectWithdrawClick, selectedCurrency }: WithdrawOptionProps) {
  const router = useRouter()
  const { t } = useTranslations()

  const handleDirectWithdrawClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    onDirectWithdrawClick()
  }

  const handleP2PTradingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    if (selectedCurrency) {
      router.push(`/?operation=sell&currency=${selectedCurrency}`)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="space-y-0 mt-6">
      <div
        data-testid="wallet-sidebar-btn-withdraw"
        className="flex justify-center items-center gap-4 self-stretch cursor-pointer ps-0 md:ps-6 py-4"
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
        className="flex justify-center items-center gap-4 self-stretch cursor-pointer ps-0 md:ps-6 py-0 hidden"
        onClick={handleDirectWithdrawClick}
      >
        <div className="flex-shrink-0  rounded-full flex items-center justify-center mb-4">
          <Image src="/icons/bank-icon.png" alt={t("common.bank")} width={24} height={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-normal text-slate-1200 leading-6">{t("wallet.directWithdrawalTitle")}</h3>
          <p className="text-grayscale-text-muted text-xs font-normal leading-[22px] me-6 md:me-0">
            {t("wallet.directWithdrawalDescription")}
          </p>
          <div className="border-b border-grayscale-200 mt-4 ms-0"></div>
        </div>
      </div>
    </div>
  )
}
