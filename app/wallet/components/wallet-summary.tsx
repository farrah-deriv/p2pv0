"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { StandaloneArrowLeftFillIcon } from "@deriv/quill-icons/Standalone"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, currencyLogoMapper, formatAmountWithDecimals } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import { useCurrencies } from "@/hooks/use-api-queries"
import WalletSidebar from "./wallet-sidebar"
import FullScreenIframeModal from "./full-screen-iframe-modal"
import ChooseCurrencyStep from "./choose-currency-step"
import WalletActionStep from "./wallet-action-step"
import TransactionDetails from "./transaction-details"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import type { Transaction } from "../types"

interface Currency {
  code: string
  name: string
  logo: string
  label: string
}


type OperationType = "DEPOSIT" | "WITHDRAW" | "TRANSFER"
type WalletStep = "summary" | "chooseCurrency" | "walletAction" | "transactionDetails"

interface WalletSummaryProps {
  isBalancesView?: boolean
  selectedCurrency?: string | null
  onBack?: () => void
  balance?: string
  currency?: string
  isLoading?: boolean
  hasBalance?: boolean
  selectedTransaction?: Transaction | null
  onTransactionSelect?: (transaction: Transaction | null) => void
  actionsDisabled?: boolean
  onViewTransactionDetails?: (transaction: Transaction) => void
}

export default function WalletSummary({
  isBalancesView = true,
  selectedCurrency: externalSelectedCurrency = null,
  onBack,
  balance: propBalance = "0.00",
  currency: propCurrency = "USD",
  isLoading: propIsLoading = true,
  hasBalance = false,
  selectedTransaction: parentSelectedTransaction = null,
  onTransactionSelect,
  actionsDisabled = false,
  onViewTransactionDetails,
}: WalletSummaryProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { data: currenciesResponse, isLoading: isCurrenciesLoading } = useCurrencies()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isIframeModalOpen, setIsIframeModalOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<OperationType>("DEPOSIT")
  const [currentStep, setCurrentStep] = useState<WalletStep>("summary")
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [localSelectedTransaction, setLocalSelectedTransaction] = useState<Transaction | null>(null)
  const isMobile = useIsMobile()
  const { hideAlert, showAlert } = useAlertDialog()

  // Use parent's transaction if provided, otherwise use local state
  const selectedTransaction = parentSelectedTransaction !== undefined ? parentSelectedTransaction : localSelectedTransaction

  const getTransactionType = (transaction: Transaction) => {
    const walletTransactionType = transaction.metadata.wallet_transaction_type
    if (walletTransactionType === "transfer_cashier_to_wallet") {
      return t("wallet.deposit")
    } else if (walletTransactionType === "transfer_cashier_from_wallet") {
      return t("wallet.withdraw")
    } else if (walletTransactionType === "transfer_between_wallets") {
      return t("wallet.transfer")
    }
    return walletTransactionType
  }

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getCurrencyLabel = (currencyCode: string) =>
    currenciesResponse?.[currencyCode]?.label || currencyCode

  const getFromWalletName = (transaction: Transaction) => {
    const sourceWalletType = transaction.metadata.source_wallet_type?.toLowerCase()
    const currencyLabel = getCurrencyLabel(transaction.metadata.transaction_currency)

    if (sourceWalletType === "p2p") {
      return t("wallet.p2pWallet")
    } else if (sourceWalletType === "main") {
      return t("wallet.mainWallet")
    } else if (sourceWalletType === "system") {
      return transaction.metadata.payout_method || t("wallet.external")
    }
    return formatTransactionType(transaction.metadata.source_wallet_type)
  }

  const getToWalletName = (transaction: Transaction) => {
    const destinationWalletType = transaction.metadata.destination_wallet_type?.toLowerCase()
    const currencyLabel = getCurrencyLabel(transaction.metadata.transaction_currency)

    if (destinationWalletType === "p2p") {
      return t("wallet.p2pWallet")
    } else if (destinationWalletType === "main") {
      return t("wallet.mainWallet")
    } else if (destinationWalletType === "system") {
      return transaction.metadata.payout_method || t("wallet.external")
    }
    return formatTransactionType(transaction.metadata.destination_wallet_type)
  }

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = Number.parseFloat(amount)
    return `${numAmount.toFixed(2)} ${currency}`
  }

  const getTransactionDisplay = (transaction: Transaction) => {
    const type = getTransactionType(transaction)
    const amount = formatAmount(transaction.metadata.transaction_net_amount, transaction.metadata.transaction_currency)

    switch (type) {
      case t("wallet.deposit"):
        return {
          icon: "/icons/add-green.png",
          iconBg: "bg-success-light",
          amount: amount,
          amountColor: "text-success-text",
          subtitle: t("wallet.deposit"),
          subtitleColor: "text-grayscale-text-muted",
        }
      case t("wallet.withdraw"):
        return {
          icon: "/icons/withdraw-red.png",
          iconBg: "bg-error-light",
          amount: amount,
          amountColor: "text-error-text",
          subtitle: t("wallet.withdraw"),
          subtitleColor: "text-grayscale-text-muted",
        }
      case t("wallet.transfer"):
        return {
          icon: "/icons/transfer-bold.png",
          iconBg: "bg-slate-1200/[0.08]",
          amount: amount,
          amountColor: "text-slate-1200",
          subtitle: `${getFromWalletName(transaction)} → ${getToWalletName(transaction)}`,
          subtitleColor: "text-grayscale-text-muted",
        }
      default:
        return {
          icon: "/icons/add-green.png",
          iconBg: "bg-slate-100",
          amount: amount,
          amountColor: "text-slate-1200",
          subtitle: type,
          subtitleColor: "text-grayscale-text-muted",
        }
    }
  }

  const displayCurrency = externalSelectedCurrency || propCurrency
  const formattedBalance = formatAmountWithDecimals(propBalance)
  const displayCurrencyLabel = currenciesResponse?.[displayCurrency]?.label || displayCurrency

  const fetchCurrencies = () => {
    if (currenciesResponse) {
      const currencyList = Object.entries(currenciesResponse).map(([code, data]: [string, any]) => ({
        code,
        name: data.label,
        logo: currencyLogoMapper[code as keyof typeof currencyLogoMapper],
        label: data.label,
      }))
      setCurrencies(currencyList)
    }
  }

  useEffect(() => {
    fetchCurrencies()
  }, [currenciesResponse])

  const isVerified = !!(userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired)

  const handleDepositClick = () => {
    if (actionsDisabled) return
    if (isVerified) {
      setCurrentOperation("DEPOSIT")
      setCurrentStep("chooseCurrency")
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "wallets",
        onClose: hideAlert }))
    }
  }

  const handleWithdrawClick = () => {
    if (actionsDisabled) return
    if (isVerified) {
      setCurrentOperation("WITHDRAW")
      setCurrentStep("chooseCurrency")
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "wallets",
        onClose: hideAlert }))
    }
  }

  const handleTransferClick = () => {
    if (actionsDisabled) return

    if (!isVerified) {
      showAlert(createKycOnboardingAlertConfig({ route: "wallets", onClose: hideAlert }))
      return
    }

    track("ek_transfer_wallets")
    setCurrentOperation("TRANSFER")
    setIsSidebarOpen(true)
  }

  // Deep-link: Markets' zero-balance banner navigates here with
  // `?operation=TRANSFER` to open the transfer sidebar directly. We bypass
  // the hasBalance guard in handleTransferClick because the banner fires
  // precisely when P2P balance is zero — the whole point is to transfer
  // funds into it. The URL is cleaned immediately so a refresh doesn't
  // re-open the sheet.
  useEffect(() => {
    if (actionsDisabled) return
    if (searchParams.get("operation") !== "TRANSFER") return
    if (!userId) return
    router.replace("/wallet")
    if (isVerified) {
      track("ek_transfer_wallets")
      setCurrentOperation("TRANSFER")
      setIsSidebarOpen(true)
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "wallets",
        onClose: hideAlert }))
    }
  }, [
    searchParams,
    userId,
    router,
    verificationStatus,
    isPoiExpired,
    isPoaExpired,
    track,
    t,
    showAlert,
    hideAlert,
    actionsDisabled,
  ])

  const handleBuyClick = () => {
    router.push("/?operation=buy")
  }

  const handleSellClick = () => {
    router.push("/?operation=sell")
  }

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency)
    setCurrentStep("walletAction")
  }

  const handleClose = () => {
    setCurrentStep("summary")
    setIsSidebarOpen(false)
    setIsIframeModalOpen(false)
  }

  const handleTransactionSelect = (transaction: Transaction | null) => {
    if (transaction) {
      setCurrentStep("transactionDetails")
      if (onTransactionSelect) {
        onTransactionSelect(transaction)
      } else {
        setLocalSelectedTransaction(transaction)
      }
    } else {
      handleCloseTransactionDetails()
    }
  }

  const handleCloseTransactionDetails = () => {
    setCurrentStep("summary")
    if (onTransactionSelect) {
      onTransactionSelect(null)
    } else {
      setLocalSelectedTransaction(null)
    }
  }

  const handleDirectDepositClick = () => {
    setCurrentStep("summary")
    setIsIframeModalOpen(true)
  }

  const handleDirectWithdrawClick = () => {
    setCurrentStep("summary")
    setIsIframeModalOpen(true)
  }

  const handleSendTransferClick = () => { }
  const handleReceiveTransferClick = () => { }

  const handleGoBackToCurrency = () => {
    setCurrentStep("chooseCurrency")
  }

  const currencyLogo = currencyLogoMapper[displayCurrency as keyof typeof currencyLogoMapper]

  const isShowingTransactionDetails = selectedTransaction !== null

  return (
    <>
      <div
        className={cn(
          // Solid bg + z-index so list content clips cleanly under the header edge.
          "relative z-10 w-full p-6 flex flex-col",
          isBalancesView && !isShowingTransactionDetails ? "bg-slate-1200 md:h-[140px] h-auto" : "bg-slate-75 md:h-[180px] h-auto",
          // Transaction list: flat bottom so rows can scroll under the header.
          // Balances + details: rounded bottom for separation from content below.
          isBalancesView || isShowingTransactionDetails
            ? "rounded-b-3xl md:rounded-3xl"
            : "rounded-b-none md:rounded-t-3xl md:rounded-b-none",
        )}
      >
        {!isBalancesView && (
          <div className="flex justify-start items-center h-8 mb-6">
            <Button data-testid="wallet-btn-back" variant="icon-muted" size="sm" onClick={onBack} className="w-8 h-8 p-0 !bg-black/[0.04] hover:!bg-black/[0.08]" aria-label={t("common.back")}>
              <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        )}

        {isShowingTransactionDetails && selectedTransaction && (
          <div className="flex justify-start items-center h-8 mb-6">
            <Button variant="icon-muted" size="sm" onClick={handleCloseTransactionDetails} className="w-8 h-8 p-0 !bg-black/[0.04] hover:!bg-black/[0.08]" aria-label={t("common.back")}>
              <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        )}

        {isShowingTransactionDetails && selectedTransaction ? (
          <div className={cn("flex items-center gap-4", isMobile && "gap-2 flex-col text-center")}>
            <div className="flex-shrink-0">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getTransactionDisplay(selectedTransaction).iconBg}`}>
                <Image
                  src={getTransactionDisplay(selectedTransaction).icon}
                  alt={t("common.transaction")}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <div className={cn("flex flex-col", isMobile && "items-center")}>
              <p className={`text-[28px] font-extrabold ${getTransactionDisplay(selectedTransaction).amountColor}`}>
                {getTransactionDisplay(selectedTransaction).amount}
              </p>
              <p className={`mt-2 text-base font-normal ${getTransactionDisplay(selectedTransaction).subtitleColor}`}>
                {getTransactionDisplay(selectedTransaction).subtitle}
              </p>
            </div>
          </div>
        ) : (
          <div className={cn("flex items-center justify-between", isMobile && "flex-col gap-4")}>
            <div className={cn("flex items-center gap-4", isMobile && "gap-2 flex-col text-center")}>
              <div className="flex-shrink-0">
                {isBalancesView ? (<Image
                  src="/icons/dp2p-wallet.png"
                  alt={t("common.p2pLogo")}
                  width={92}
                  height={92}
                  className="w-18 h-18 md:w-24 md:h-24"
                />) :
                  (<div className="flex-shrink-0 relative w-16 h-16">
                    <Image src="/icons/icon-p2p.svg" alt={t("common.p2p")} width={64} height={64} className="w-16 h-16 rounded-full" />
                    <div className="absolute -bottom-[0.5rem] left-1/2 -translate-x-1/2">
                      <Image
                        src={currencyLogo}
                        alt={`${externalSelectedCurrency} Logo`}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full bg-white p-[2px]"
                      />
                    </div>
                  </div>)}
              </div>

              <div className={cn("flex flex-col", isMobile && "items-center")}>
                {isBalancesView ? (
                  <>
                    <p className="text-xs font-normal text-white/72 mb-1">{t("wallet.estTotalValue")}</p>
                    {propIsLoading ? (
                      <Skeleton className="h-7 w-32 animate-shimmer-dark" />
                    ) : (
                      <p data-testid="wallet-text-total-balance" className="text-xl font-extrabold text-white">{`${formattedBalance} ${displayCurrency}`}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[28px] font-extrabold text-slate-1200">
                      {propIsLoading ? t("common.loading") : `${formattedBalance} ${displayCurrency}`}
                    </p>
                    <p className="text-sm font-normal text-grayscale-100">{displayCurrencyLabel}</p>
                  </>
                )}
              </div>
            </div>

            <div className={cn("flex items-center gap-[66px] px-[33px]", isMobile && "flex-row justify-center w-full")}>
              <div className="hidden flex-col items-center gap-2">
                <Button
                  variant="icon-action"
                  data-testid="wallet-btn-deposit"
                  onClick={handleDepositClick}
                  aria-label={t("wallet.deposit")}
                >
                  <span className="flex items-center justify-center">
                    <Image src="/icons/plus-white.png" alt={t("wallet.deposit")} width={14} height={14} />
                  </span>
                </Button>
                <span className={cn("text-xs font-normal", isBalancesView ? "text-white" : "text-slate-1200")}>
                  {t("wallet.deposit")}
                </span>
              </div>

              {!isBalancesView && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="icon-action"
                    data-testid="wallet-btn-buy"
                    onClick={handleBuyClick}
                    aria-label={t("common.buy")}
                  >
                    <span className="flex items-center justify-center">
                      <Image src="/icons/plus-white.png" alt={t("common.buy")} width={14} height={14} />
                    </span>
                  </Button>
                  <span className="text-xs font-normal text-slate-1200">
                    {t("common.buy")}
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="icon-action"
                  data-testid="wallet-btn-transfer"
                  onClick={handleTransferClick}
                  disabled={actionsDisabled}
                  aria-label={t("wallet.transfer")}
                >
                  <span className="flex items-center justify-center">
                    <Image src="/icons/transfer-white.png" alt={t("wallet.transfer")} width={14} height={14} />
                  </span>
                </Button>
                <span className={cn("text-xs font-normal", isBalancesView ? "text-white" : "text-slate-1200")}>
                  {t("wallet.transfer")}
                </span>
              </div>

              {!isBalancesView && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="secondary-outline"
                    data-testid="wallet-btn-sell"
                    onClick={handleSellClick}
                    aria-label={t("common.sell")}
                    className="!rounded-full !w-12 !h-12 !p-0 !min-w-0"
                  >
                    <span className="flex items-center justify-center">
                      <Image src="/icons/withdraw-black.png" alt={t("common.sell")} width={14} height={14} />
                    </span>
                  </Button>
                  <span className="text-xs font-normal text-slate-1200">
                    {t("common.sell")}
                  </span>
                </div>
              )}

              <div className="hidden flex-col items-center gap-2">
                <Button
                  variant="icon-action-outlined"
                  onClick={handleWithdrawClick}
                  disabled={isBalancesView && propBalance === "0.00"}
                  aria-label={t("wallet.withdraw")}
                  className={cn(
                    isBalancesView
                      ? propBalance === "0.00"
                        ? "!border-white/24 !opacity-25"
                        : "!border-white hover:!bg-white/10"
                      : undefined,
                  )}
                >
                  <span className="flex items-center justify-center">
                    <Image
                      src={isBalancesView ? "/icons/withdraw-white.png" : "/icons/withdraw-black.png"}
                      alt={t("wallet.withdraw")}
                      width={14}
                      height={14}
                    />
                  </span>
                </Button>
                <span
                  className={cn(
                    "text-xs font-normal",
                    isBalancesView ? (propBalance === "0.00" ? "text-white/24" : "text-white") : "text-slate-1200",
                  )}
                >
                  {t("wallet.withdraw")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentStep === "chooseCurrency" && (
        <div className="fixed inset-0 z-50 bg-white">
          <ChooseCurrencyStep
            title={currentOperation === "DEPOSIT" ? t("wallet.deposit") : t("wallet.withdraw")}
            description={t("wallet.chooseCurrencyDescription", {
              action: currentOperation === "DEPOSIT" ? "deposit" : "withdraw",
            })}
            currencies={currencies}
            onClose={handleClose}
            onCurrencySelect={handleCurrencySelect}
          />
        </div>
      )}

      {currentStep === "walletAction" && (
        <div className="fixed inset-0 z-50 bg-white">
          <WalletActionStep
            title={currentOperation === "DEPOSIT" ? t("wallet.depositWith") : t("wallet.withdrawWith")}
            actionType={currentOperation.toLowerCase() as "deposit" | "withdraw"}
            onClose={handleClose}
            onGoBack={handleGoBackToCurrency}
            onDirectDepositClick={handleDirectDepositClick}
            onDirectWithdrawClick={handleDirectWithdrawClick}
            selectedCurrency={selectedCurrency}
          />
        </div>
      )}

      {currentStep === "transactionDetails" && selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-75 overflow-y-auto overflow-x-hidden">
          <div className="p-6 bg-slate-75">
            <div className="flex justify-start items-center mb-6">
              <Button
                variant="icon-muted"
                onClick={handleCloseTransactionDetails}
                className="!bg-black/[0.04] hover:!bg-black/[0.08]"
                aria-label={t("common.back")}
              >
                <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
              </Button>
            </div>
          </div>
          <TransactionDetails transaction={selectedTransaction} onClose={handleCloseTransactionDetails} />
        </div>
      )}

      <WalletSidebar
        currencySelected={selectedCurrency}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDirectDepositClick={currentOperation === "DEPOSIT" ? handleDirectDepositClick : handleDirectWithdrawClick}
        operation={currentOperation}
        onP2PTransferClick={handleSendTransferClick}
        onAccountTransferClick={handleReceiveTransferClick}
        currencies={currencies}
        transferStep={"enterAmount"}
        onViewDetails={(transaction) => {
          setIsSidebarOpen(false)
          if (onViewTransactionDetails) {
            onViewTransactionDetails(transaction)
          }
        }}
      />

      <FullScreenIframeModal
        isOpen={isIframeModalOpen}
        onClose={() => setIsIframeModalOpen(false)}
        operation={currentOperation}
        currency={displayCurrency}
      />
    </>
  )
}
