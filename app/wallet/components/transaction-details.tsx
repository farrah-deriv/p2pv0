"use client"
import { Button } from "@/components/ui/button"
import { formatAppDate } from "@/lib/format-date"
import { localeToBcp47 } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import Image from "next/image"

interface Transaction {
  transaction_id: number
  timestamp: string
  metadata: {
    brand_name: string
    description: string
    destination_client_id: string
    destination_wallet_id: string
    destination_wallet_type: string
    is_reversible: string
    payout_method: string
    requester_platform: string
    source_client_id: string
    source_wallet_id: string
    source_wallet_type: string
    transaction_currency: string
    transaction_gross_amount: string
    transaction_net_amount: string
    transaction_status: string
    wallet_transaction_type: string
  }
}

interface TransactionDetailsProps {
  transaction: Transaction | null
  onClose: () => void
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const { t, locale } = useTranslations()
  const numberLocale = localeToBcp47(locale)

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = Number.parseFloat(amount)
    return `${numAmount.toFixed(2)} ${currency}`
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
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
    const sourceWalletType = transaction.metadata.source_wallet_type
    const transactionCurrency = transaction.metadata.transaction_currency

    if (sourceWalletType === "main") {
      return t("wallet.walletName", { currency: transactionCurrency })
    } else if (sourceWalletType === "system") {
      return transaction.metadata.payout_method || t("wallet.external")
    } else if (sourceWalletType === "p2p") {
      return `P2P ${transactionCurrency}`
    }
    return formatTransactionType(sourceWalletType)
  }

  const getToWalletName = (transaction: Transaction) => {
    const destinationWalletType = transaction.metadata.destination_wallet_type
    const transactionCurrency = transaction.metadata.transaction_currency

    if (destinationWalletType === "main") {
      return t("wallet.walletName", { currency: transactionCurrency })
    } else if (destinationWalletType === "system") {
      return transaction.metadata.payout_method || t("wallet.external")
    } else if (destinationWalletType === "p2p") {
      return `P2P ${transactionCurrency}`
    }
    return formatTransactionType(destinationWalletType)
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
        return { text: t("wallet.success"), color: "text-success-text" }
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

  if (!transaction) {
    return null
  }

  const display = getTransactionDisplay(transaction)
  const statusDisplay = getStatusDisplay(transaction.metadata.transaction_status)
  const transactionType = getTransactionType(transaction)

  return (
    <div data-testid="wallet-details-tx">
      <div>
        {/* Section 1: Status, ID, Type */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionStatus")}</span>
            <span className={`text-base font-normal ${statusDisplay.color}`}>{statusDisplay.text}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionId")}</span>
            <span className="text-base font-normal text-slate-1200">{transaction.transaction_id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transactionType")}</span>
            <span className="text-base font-normal text-slate-1200">{transactionType}</span>
          </div>
        </div>

        <div className="my-6 h-px bg-slate-200" />

        {/* Section 2: From, To, Amount */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>
            <span className="text-base font-normal text-slate-1200">{getFromWalletName(transaction)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>
            <span className="text-base font-normal text-slate-1200">{getToWalletName(transaction)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.amount")}</span>
            <span className="text-base font-normal text-slate-1200">{display.amount}</span>
          </div>
        </div>

        <div className="my-6 h-px bg-slate-200" />

        {/* Section 3: Date, Time */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.date")}</span>
            <span className="text-base font-normal text-slate-1200">{formatDate(transaction.timestamp)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.time")}</span>
            <span className="text-base font-normal text-slate-1200">{formatTime(transaction.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
