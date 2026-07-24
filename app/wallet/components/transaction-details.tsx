"use client"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { InfoCircleIcon } from "@/components/icons/info-circle"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatAppDate } from "@/lib/format-date"
import { localeToBcp47 } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { IS_TRANSFER_FEE_DISPLAY_ENABLED } from "@/lib/utils"
import type { Transaction } from "../types"

interface TransactionDetailsProps {
  transaction: Transaction | null
  onClose?: () => void
}

function formatConfiguredFeePercentage(raw: number | string | undefined): string {
  if (raw === undefined || raw === null || raw === "") return "0"
  const percentage = typeof raw === "number" ? raw : Number.parseFloat(raw)
  if (!Number.isFinite(percentage)) return "0"
  return Number(percentage.toFixed(2)).toString()
}

export default function TransactionDetails({ transaction }: TransactionDetailsProps) {
  const { t, locale } = useTranslations()
  const numberLocale = localeToBcp47(locale)
  const [showAmountReceiveInfoSheet, setShowAmountReceiveInfoSheet] = useState(false)

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = Number.parseFloat(amount)
    return `${numAmount.toFixed(2)} ${currency}`
  }

  const formatDate = (timestamp: string) => {
    return formatAppDate(new Date(timestamp), locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return `${date.toLocaleTimeString(numberLocale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "GMT",
      timeZoneName: "short",
    })}`
  }

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTransactionType = (transaction: Transaction) => {
    const orderType = transaction.metadata.statement_metadata?.order_type
    if (orderType === "buy") return t("wallet.buyOrder")
    if (orderType === "sell") return t("wallet.sellOrder")

    const walletTransactionType = transaction.metadata.wallet_transaction_type
    if (walletTransactionType === "transfer_cashier_to_wallet") {
      return t("wallet.deposit")
    } else if (walletTransactionType === "transfer_cashier_from_wallet") {
      return t("wallet.withdraw")
    } else if (walletTransactionType === "transfer_between_wallets") {
      return t("wallet.transfer")
    }
    return formatTransactionType(walletTransactionType)
  }

  const getFromWalletName = (transaction: Transaction) => {
    const orderType = transaction.metadata.statement_metadata?.order_type
    if (orderType === "buy") return transaction.metadata.statement_metadata?.buyer_nickname ?? ""
    if (orderType === "sell") return transaction.metadata.statement_metadata?.seller_nickname ?? ""

    const sourceWalletType = transaction.metadata.source_wallet_type?.toLowerCase()

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
    const orderType = transaction.metadata.statement_metadata?.order_type
    if (orderType === "buy") return transaction.metadata.statement_metadata?.seller_nickname ?? ""
    if (orderType === "sell") return transaction.metadata.statement_metadata?.buyer_nickname ?? ""

    const destinationWalletType = transaction.metadata.destination_wallet_type?.toLowerCase()

    if (destinationWalletType === "p2p") {
      return t("wallet.p2pWallet")
    } else if (destinationWalletType === "main") {
      return t("wallet.mainWallet")
    } else if (destinationWalletType === "system") {
      return transaction.metadata.payout_method || t("wallet.external")
    }
    return formatTransactionType(transaction.metadata.destination_wallet_type)
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

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete":
      case "completed":
        return { text: t("wallet.completed"), color: "text-success-text" }
      case "pending":
        return { text: t("wallet.pending"), color: "text-pending-text-secondary" }
      case "processing":
        return { text: t("wallet.processing"), color: "text-pending-text-secondary" }
      case "reverted":
        return { text: t("wallet.cancelled"), color: "text-error-text" }
      default:
        return { text: status, color: "text-slate-1200" }
    }
  }

  const getAmountReceiveInfoBody = (tx: Transaction) => {
    const feeAmountRaw = tx.metadata.transaction_fee_amount ?? "0"
    const feeAmount = Number.parseFloat(feeAmountRaw) || 0
    const feePercentage = formatConfiguredFeePercentage(tx.metadata.transaction_fee_percentage)
    if (!feeAmount && feePercentage === "0") {
      return t("wallet.amountReceiveInfoBodyFree")
    }
    const currency = tx.metadata.transaction_currency || ""
    return t("wallet.amountReceiveInfoBodyApplied", {
      amount: Number.isFinite(feeAmount) ? feeAmount.toFixed(2) : "0.00",
      currency,
    })
  }

  const renderAmountReceiveInfoControl = (infoBody: string) => {
    const infoIconClassName = "size-[1.5rem] h-[1.5rem] w-[1.5rem] shrink-0"
    const infoButtonClassName =
      "inline-flex shrink-0 items-center justify-center !size-[1.5rem] !h-[1.5rem] !w-[1.5rem] !min-h-[1.5rem] !max-h-[1.5rem] !min-w-[1.5rem] !max-w-[1.5rem] p-0 text-grayscale-text-muted hover:text-slate-1200 hover:bg-transparent [&_svg]:!size-[1.5rem] [&_svg]:!h-[1.5rem] [&_svg]:!w-[1.5rem]"

    return (
      <>
        <div className="hidden shrink-0 md:inline-flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  data-testid="wallet-details-btn-amount-receive-info"
                  className={infoButtonClassName}
                  aria-label={t("wallet.amountReceiveInfoTitle")}
                >
                  <InfoCircleIcon className={infoIconClassName} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[296px] text-white/70">
                <p>{infoBody}</p>
                <TooltipArrow className="fill-black" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          type="button"
          variant="ghost"
          data-testid="wallet-details-btn-amount-receive-info-mobile"
          className={`inline-flex md:hidden ${infoButtonClassName}`}
          aria-label={t("wallet.amountReceiveInfoTitle")}
          onClick={(e) => {
            e.stopPropagation()
            setShowAmountReceiveInfoSheet(true)
          }}
        >
          <InfoCircleIcon className={infoIconClassName} />
        </Button>
      </>
    )
  }

  const renderAmountReceiveInfoSheet = (infoBody: string) => {
    if (!showAmountReceiveInfoSheet) return null

    return (
      <div
        data-testid="wallet-details-sheet-amount-receive-info"
        className="fixed inset-0 bg-black/50 z-[60] md:hidden animate-in fade-in-0 duration-200"
        onClick={() => setShowAmountReceiveInfoSheet(false)}
      >
        <div
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2 px-6 pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-4 text-start">
              {t("wallet.amountReceiveInfoTitle")}
            </h2>
            <p className="text-base font-normal text-grayscale-600 mb-8 text-start">{infoBody}</p>
            <Button
              data-testid="wallet-details-btn-amount-receive-info-got-it"
              onClick={() => setShowAmountReceiveInfoSheet(false)}
              className="w-full h-12"
            >
              {t("wallet.gotIt")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  const display = getTransactionDisplay(transaction)
  const statusDisplay = getStatusDisplay(transaction.metadata.transaction_status)
  const transactionType = getTransactionType(transaction)
  const isWalletTransfer = transaction.metadata.wallet_transaction_type === "transfer_between_wallets"
  // Buy/sell orders also use transfer_between_wallets — fee info icon is only for
  // cashier↔wallet style transfers, not P2P order settlements.
  const isOrder =
    transaction.metadata.statement_metadata?.order_type === "buy" ||
    transaction.metadata.statement_metadata?.order_type === "sell"
  const feeAmount = Number.parseFloat(transaction.metadata.transaction_fee_amount ?? "0") || 0
  const feePercentage = formatConfiguredFeePercentage(transaction.metadata.transaction_fee_percentage)
  const hasTransferFee = feeAmount > 0 || feePercentage !== "0"
  // Fee info icon only when fee display flag is on, for non-order wallet transfers with a fee.
  const showAmountReceiveInfo =
    IS_TRANSFER_FEE_DISPLAY_ENABLED && isWalletTransfer && !isOrder && hasTransferFee
  const amountReceiveInfoBody = showAmountReceiveInfo
    ? getAmountReceiveInfoBody(transaction)
    : ""
  const transferAmount = formatAmount(
    transaction.metadata.transaction_gross_amount,
    transaction.metadata.transaction_currency,
  )
  // Always show actual net received (matches hero). Fee-display flag only
  // gates the info icon — staging already returns fee-adjusted net amounts.
  const amountReceived = formatAmount(
    transaction.metadata.transaction_net_amount,
    transaction.metadata.transaction_currency,
  )

  // Groups: Status/ID/Type → From/To → Amount(s) → Date/Time
  // Responsive: white fill + 4px slate gutters between cards (not grey page tail)
  // Desktop: thin full-width separators (incl. From/To | Amount)
  const sectionClassName = "w-full space-y-2 p-6 md:p-0 md:space-y-3"
  // First section: no top pad — hero gap handled by the spacer above.
  const firstSectionClassName = "w-full space-y-2 px-6 pb-6 md:p-0 md:space-y-3"
  const mobileGutterClassName = "h-1 w-full bg-slate-75 md:hidden"
  const desktopSeparatorClassName =
    "hidden md:block my-6 h-px w-full bg-grayscale-200"

  const detailRow = (label: ReactNode, value: ReactNode, valueClassName = "text-slate-1200") => (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-2 min-w-0">{label}</div>
      <span className={`text-base font-normal text-end shrink-0 ${valueClassName}`}>{value}</span>
    </div>
  )

  const sectionSeparator = (
    <>
      <div className={mobileGutterClassName} role="separator" />
      <div className={desktopSeparatorClassName} role="separator" />
    </>
  )

  return (
    <div
      data-testid="wallet-details-tx"
      className="flex flex-col w-full bg-white md:bg-transparent min-h-full"
    >
      {/* 24px under hero so first row isn’t flush against the header */}
      <div className="h-6 w-full shrink-0" aria-hidden />
      {/* Section 1: Status, ID, Type */}
      <section className={firstSectionClassName}>
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionStatus")}</span>,
          statusDisplay.text,
          statusDisplay.color,
        )}
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionId")}</span>,
          transaction.transaction_id,
        )}
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionType")}</span>,
          transactionType,
        )}
      </section>

      {sectionSeparator}

      {/* Section 2: From, To */}
      <section className={sectionClassName}>
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>,
          getFromWalletName(transaction),
        )}
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>,
          getToWalletName(transaction),
        )}
      </section>

      {sectionSeparator}

      {/* Section 3: Amount(s) */}
      <section className={sectionClassName}>
        {isWalletTransfer ? (
          <>
            {detailRow(
              <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transferAmount")}</span>,
              transferAmount,
            )}
            {detailRow(
              <>
                <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.amountReceived")}</span>
                {showAmountReceiveInfo &&
                  renderAmountReceiveInfoControl(amountReceiveInfoBody)}
              </>,
              amountReceived,
            )}
          </>
        ) : (
          detailRow(
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.amount")}</span>,
            display.amount,
          )
        )}
      </section>

      {sectionSeparator}

      {/* Section 4: Date, Time */}
      <section className={sectionClassName}>
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.date")}</span>,
          formatDate(transaction.timestamp),
        )}
        {detailRow(
          <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.time")}</span>,
          formatTime(transaction.timestamp),
        )}
      </section>

      {showAmountReceiveInfo && renderAmountReceiveInfoSheet(amountReceiveInfoBody)}
    </div>
  )
}
