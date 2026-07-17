"use client"

import { useState } from "react"
import { useWalletTransactions } from "@/hooks/use-api-queries"
import Image from "next/image"
import TransactionDetails from "./transaction-details"
import { formatAppDate } from "@/lib/format-date"
import { formatAmountWithDecimals } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { CurrenciesResponse } from "@/services/api/api-auth"
import type { Transaction } from "../types"

interface TransactionsTabProps {
  selectedCurrency?: string | null
  currencies?: CurrenciesResponse
  selectedTransaction?: Transaction | null
  onTransactionSelect?: (transaction: Transaction | null) => void
}

export default function TransactionsTab({
  selectedCurrency,
  currencies = {},
  selectedTransaction: parentSelectedTransaction,
  onTransactionSelect
}: TransactionsTabProps) {
  const { t, locale } = useTranslations()
  const [activeFilter, setActiveFilter] = useState(t("wallet.all"))
  const [localSelectedTransaction, setLocalSelectedTransaction] = useState<Transaction | null>(null)

  const { data, isLoading: loading } = useWalletTransactions(
    selectedCurrency,
    parentSelectedTransaction == null
  )
  const transactions = data?.data?.transactions ?? []

  // Use parent's transaction if provided, otherwise use local state
  const selectedTransaction = parentSelectedTransaction !== undefined ? parentSelectedTransaction : localSelectedTransaction

  const filters = [t("wallet.all"), t("wallet.deposit"), t("wallet.withdraw"), t("wallet.transfer")]

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()

    if (date.toDateString() === today.toDateString()) {
      return t("wallet.today")
    }

    return formatAppDate(date, locale, { day: "numeric", month: "long", year: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    if (s === "pending") {
      return <Badge variant="pending-secondary">{t("wallet.pending")}</Badge>
    }
    if (s === "reverted") {
      return <Badge variant="error-secondary">{t("wallet.cancelled")}</Badge>
    }
    if (s === "complete" || s === "completed") {
      return <Badge variant="success-secondary">{t("wallet.completed")}</Badge>
    }
    if (s === "processing") {
      return <Badge variant="pending-secondary">{t("wallet.processing")}</Badge>
    }
    return null
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
    return walletTransactionType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTransactionDisplay = (transaction: Transaction) => {
    const type = getTransactionType(transaction)

    const getAmountColor = () => {
      if (type === t("wallet.withdraw")) {
        return "text-error"
      } else if (type === t("wallet.deposit")) {
        return "text-success-text"
      } else if (type === t("wallet.transfer")) {
        return "text-slate-1200"
      }
      return "text-slate-1200"
    }

    switch (type) {
      case t("wallet.deposit"):
        return {
          iconSrc: "/icons/add-icon.png",
          amountColor: getAmountColor(),
          type: t("wallet.deposit"),
        }
      case t("wallet.withdraw"):
        return {
          iconSrc: "/icons/subtract-icon.png",
          amountColor: getAmountColor(),
          type: t("wallet.withdraw"),
        }
      case t("wallet.transfer"):
      case t("wallet.buyOrder"):
      case t("wallet.sellOrder"):
        return {
          iconSrc: "/icons/transfer-icon.png",
          amountColor: getAmountColor(),
          type: type,
        }
      default:
        return {
          iconSrc: "/icons/add-icon.png",
          amountColor: getAmountColor(),
          type: type,
        }
    }
  }

  const getOrderCounterpartyText = (transaction: Transaction) => {
    const { order_type, buyer_nickname, seller_nickname } = transaction.metadata.statement_metadata ?? {}
    const buyer = buyer_nickname ?? ""
    const seller = seller_nickname ?? ""
    return order_type === "sell" ? `${seller} → ${buyer}` : `${buyer} → ${seller}`
  }

  const getTransferDestinationText = (transaction: Transaction) => {
    const { source_wallet_type, destination_wallet_type, transaction_currency } = transaction.metadata

    const isSourceP2P = source_wallet_type?.toLowerCase() === "p2p"
    const isDestinationP2P = destination_wallet_type?.toLowerCase() === "p2p"

    const currencyLabel = currencies[transaction_currency]?.label || transaction_currency

    if (isSourceP2P && !isDestinationP2P) {
      return t("wallet.transferRouteP2pToWallet", { currency: currencyLabel })
    }
    if (!isSourceP2P && isDestinationP2P) {
      return t("wallet.transferRouteWalletToP2p", { currency: currencyLabel })
    }
    if (isSourceP2P && isDestinationP2P) {
      return t("wallet.transferRouteP2pToP2p", { currency: currencyLabel })
    }
    return t("wallet.transferRouteWalletOnly", { currency: currencyLabel })
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeFilter === t("wallet.all")) {
      return true
    }
    return getTransactionType(transaction) === activeFilter
  })

  const groupedTransactions = filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
    const dateKey = formatDate(transaction.timestamp)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(transaction)
    return groups
  }, {})

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionSelect) {
      onTransactionSelect(transaction)
    } else {
      setLocalSelectedTransaction(transaction)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="py-0 space-y-6">
        <div className="hidden gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "black" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`h-8 rounded-full px-4 text-sm font-normal ${activeFilter === filter ? "" : "bg-white border-gray-200 hover:bg-gray-50 text-slate-600"
                }`}
            >
              {filter}
            </Button>
          ))}
        </div>

        {!selectedTransaction && (
          <div className="space-y-6 h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)] overflow-y-auto pb-16">
            {Object.entries(groupedTransactions).map(([dateKey, dateTransactions]) => (
              <div key={dateKey} className="space-y-0">
                <h3 className="text-xs font-medium text-grayscale-text-muted">{dateKey}</h3>

                <div className="space-y-0">
                  {dateTransactions.map((transaction, index) => {
                    const display = getTransactionDisplay(transaction)
                    const isTransfer = display.type === t("wallet.transfer")
                    const isOrder = display.type === t("wallet.buyOrder") || display.type === t("wallet.sellOrder")

                    return (
                      <div key={transaction.transaction_id} data-testid={`wallet-row-tx-${transaction.transaction_id}`} className="relative">
                        <div
                          className={`flex items-center justify-between min-h-[72px] py-3 cursor-pointer transition-colors ${"hover:bg-gray-50"
                            }`}
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {display.iconSrc && (
                                <Image
                                  src={display.iconSrc || "/placeholder.svg"}
                                  alt={`${display.type} icon`}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 object-contain"
                                  priority={index < 3}
                                />
                              )}
                            </div>

                            <div className="flex flex-col gap-1">
                              <div data-testid={`wallet-badge-tx-type-${transaction.transaction_id}`} className="text-slate-1200 text-base font-normal">{display.type}</div>
                              {isTransfer && (
                                <div className="text-xs font-normal text-grayscale-text-muted">
                                  {getTransferDestinationText(transaction)}
                                </div>
                              )}
                              {isOrder && (
                                <div className="text-xs font-normal text-grayscale-text-muted">
                                  {getOrderCounterpartyText(transaction)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end me-6 gap-1">
                            <div data-testid={`wallet-text-tx-amount-${transaction.transaction_id}`} className={`${display.amountColor} text-base font-normal`}>
                              {formatAmountWithDecimals(transaction.metadata.transaction_net_amount)}{" "}
                              {transaction.metadata.transaction_currency}
                            </div>
                            {getStatusBadge(transaction.metadata.transaction_status)}
                          </div>
                        </div>

                        <div className="h-px bg-grayscale-200 ms-10" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && !loading && (
              <div data-testid="wallet-empty-transactions" className="text-center py-8 text-gray-500">
                {selectedCurrency
                  ? t("wallet.noTransactionsForCurrency")
                  : activeFilter === t("wallet.all")
                    ? t("wallet.noTransactions")
                    : activeFilter === t("wallet.deposit")
                      ? t("wallet.noDepositTransactions")
                      : activeFilter === t("wallet.withdraw")
                        ? t("wallet.noWithdrawTransactions")
                        : t("wallet.noTransferTransactions")}
              </div>
            )}

            {filteredTransactions.length > 0 && (
              <div data-testid="wallet-sentinel-load-more" className="text-center text-xs font-normal pt-0 text-grayscale-text-placeholder">
                {t("wallet.endOfTransaction")}
              </div>
            )}
          </div>
        )}

        {selectedTransaction && (
          <div className="space-y-6 h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)] overflow-y-auto pb-16">
            <div className="bg-white">
              <div className="space-y-6">
                <TransactionDetails transaction={selectedTransaction} currencies={currencies} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
