"use client"
import Image from "next/image"
import DepositOptions from "./deposit-options"
import WithdrawOptions from "./withdraw-options"
import Transfer from "./transfer"
import { Button } from "@/components/ui/button"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Transaction } from "../types"

interface Currency {
  code: string
  name: string
  logo: string
}

interface WalletSidebarProps {
  currencySelected?: string
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: (currency: string) => void
  operation?: "DEPOSIT" | "WITHDRAW" | "TRANSFER"
  onP2PTransferClick?: () => void
  onAccountTransferClick?: () => void
  currencies: Currency[]
  transferStep: string
  onViewDetails?: (transaction: Transaction) => void
}

export default function WalletSidebar({
  currencySelected,
  isOpen,
  onClose,
  onDirectDepositClick,
  operation = "DEPOSIT",
  onP2PTransferClick = () => {},
  onAccountTransferClick = () => {},
  currencies,
  transferStep,
  onViewDetails,
}: WalletSidebarProps) {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"

  if (!isOpen) return null

  const getTitle = () => {
    switch (operation) {
      case "DEPOSIT":
        return t("wallet.deposit")
      case "WITHDRAW":
        return t("wallet.withdraw")
      case "TRANSFER":
        return t("wallet.transfer")
      default:
        return t("wallet.deposit")
    }
  }

  if (operation === "TRANSFER") {
    return (
      <div data-testid="wallet-sidebar-btn-transfer" className="fixed inset-0 z-50 bg-background" onClick={onClose}>
        <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
          <Transfer
            currencySelected={currencySelected}
            onClose={onClose}
            stepVal={transferStep}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex md:justify-end md:items-stretch" onClick={onClose}>
      <div
        data-testid="wallet-sidebar-container"
        className="bg-background w-full h-full md:max-w-md flex flex-col shadow-lg md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div dir={dir} className="flex items-center justify-between gap-4 px-4 pb-3 md:py-3 mt-9 md:mt-0 md:border-b">
          <h2 className="min-w-0 flex-1 text-start text-lg font-bold">{getTitle()}</h2>
          <Button data-testid="wallet-sidebar-btn-close" onClick={onClose} variant="ghost" size="sm" className="px-1">
            <Image src="/icons/close-circle.png" alt={t("common.close")} width={24} height={24} />
          </Button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
          {operation === "DEPOSIT" ? (
            <DepositOptions onClose={onClose} onDirectDepositClick={onDirectDepositClick} currencies={currencies} />
          ) : (
            <WithdrawOptions onClose={onClose} onDirectWithdrawClick={onDirectDepositClick} currencies={currencies} />
          )}
        </div>
      </div>
    </div>
  )
}
