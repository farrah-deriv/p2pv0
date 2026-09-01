"use client"

import { useCallback, useMemo, useState } from "react"
import { flattenWalletTransactionsPages, useWalletTransactions } from "@/hooks/use-api-queries"
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll"
import Image from "next/image"
import TransactionDetails from "./transaction-details"
import { formatAppDate } from "@/lib/format-date"
import { formatAmountWithDecimals } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Transaction } from "../types"

interface TransactionsTabProps {
  selectedCurrency?: string | null
  selectedTransaction?: Transaction | null
  onTransactionSelect?: (transaction: Transaction | null) => void
}

export default function TransactionsTab({
  selectedCurrency,
  selectedTransaction: parentSelectedTransaction,
  onTransactionSelect
}: TransactionsTabProps) {
  const { t, locale } = useTranslations()
  const [activeFilter, setActiveFilter] = useState(t("wallet.all"))
  const [localSelectedTransaction, setLocalSelectedTransaction] = useState<Transaction | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const {
    data,
    isLoading: loading,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useWalletTransactions(
    selectedCurrency,
    parentSelectedTransaction == null
  )
  const transactions = useMemo(
    () => flattenWalletTransactionsPages(data) as Transaction[],
    [data],
  )

  const isShowingLoadMore = isFetchingNextPage || isLoadingMore

  const maybeLoadMore = useCallback(async () => {
    if (!hasNextPage || isShowingLoadMore) return
    setIsLoadingMore(true)
    try {
      await fetchNextPage()
    } finally {
      setIsLoadingMore(false)
    }
  }, [fetchNextPage, hasNextPage, isShowingLoadMore])

  const { scrollRootRef, sentinelRef } = useLoadMoreOnScroll(
    !!hasNextPage && !loading,
    maybeLoadMore,
    isShowingLoadMore,
  )

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
    const { source_wallet_type, destination_wallet_type } = transaction.metadata

    const isSourceP2P = source_wallet_type?.toLowerCase() === "p2p"
    const isDestinationP2P = destination_wallet_type?.toLowerCase() === "p2p"
    const fromName = isSourceP2P ? t("wallet.p2pWallet") : t("wallet.mainWallet")
    const toName = isDestinationP2P ? t("wallet.p2pWallet") : t("wallet.mainWallet")

    return `${fromName} → ${toName}`
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
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4" data-testid="wallet-error-transactions">
        <EmptyState
          title={t("errors.loadTransactionsFailedTitle")}
          description={t("errors.loadFailedDescription")}
          actionLabel={t("errors.retry")}
          onAction={() => refetch()}
        />
      </div>
    )
  }

  return (
    <>
      {/* Fill remaining page height under WalletSummary — avoid fixed vh (leaves a gap /
          clips mid-row). Parent wallet page owns the bounded height. */}
      <div className="flex flex-col flex-1 min-h-0 h-full py-0">
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
          <div className="flex flex-col flex-1 min-h-0">
            <div
              ref={scrollRootRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain space-y-6 pt-6 pb-6"
            >
              {Object.entries(groupedTransactions).map(([dateKey, dateTransactions]) => (
                <div key={dateKey} className="space-y-0">
                  <h3 className="px-6 lg:px-0 text-xs font-medium text-grayscale-text-muted">{dateKey}</h3>

                  <div className="space-y-0">
                    {dateTransactions.map((transaction, index) => {
                      const display = getTransactionDisplay(transaction)
                      const isTransfer = display.type === t("wallet.transfer")
                      const isOrder = display.type === t("wallet.buyOrder") || display.type === t("wallet.sellOrder")

                      return (
                        <div key={transaction.transaction_id} data-testid={`wallet-row-tx-${transaction.transaction_id}`} className="relative">
                          {/* px-6 matches WalletSummary `p-6` so trailing amounts align with header. */}
                          <div
                            className="flex items-center justify-between min-h-[72px] py-3 px-6 lg:px-0 cursor-pointer transition-colors hover:bg-gray-50"
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            <div className="flex items-center gap-4 min-w-0">
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

                              <div className="flex flex-col gap-1 min-w-0">
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

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div data-testid={`wallet-text-tx-amount-${transaction.transaction_id}`} className={`${display.amountColor} text-base font-normal`}>
                                {formatAmountWithDecimals(transaction.metadata.transaction_net_amount)}{" "}
                                {transaction.metadata.transaction_currency}
                              </div>
                              {getStatusBadge(transaction.metadata.transaction_status)}
                            </div>
                          </div>

                          {/* indent past pad(24)+icon(24)+gap(16)=64; no end inset (full-bleed trailing). */}
                          <div className="h-px bg-grayscale-200 ms-16" />
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

              {hasNextPage && filteredTransactions.length > 0 && (
                <div
                  ref={sentinelRef}
                  className="h-1 w-full shrink-0"
                  data-testid="wallet-sentinel-load-more"
                />
              )}

              {!isShowingLoadMore && hasNextPage && filteredTransactions.length > 0 && (
                <div className="flex w-full shrink-0 justify-center px-4 pb-2">
                  <Button
                    data-testid="wallet-btn-load-more-transactions"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void maybeLoadMore()
                    }}
                  >
                    {t("wallet.loadMore")}
                  </Button>
                </div>
              )}

              {!hasNextPage && filteredTransactions.length > 0 && (
                <div className="w-full shrink-0 text-center text-xs font-normal pt-6 pb-2 text-grayscale-text-placeholder">
                  {t("wallet.endOfTransaction")}
                </div>
              )}
            </div>

            {/* Outside scrollport — stays fully visible at panel bottom (responsive clip fix). */}
            {isShowingLoadMore && (
              <div
                data-testid="wallet-loading-more-transactions"
                className="flex w-full shrink-0 justify-center py-4 bg-background"
              >
                <div role="status" aria-label={t("common.loading")}>
                  <Spinner size="sm" />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTransaction && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-8">
            {/* Full-bleed slate canvas + white p-24 cards (Figma 12645:44337) */}
            <TransactionDetails transaction={selectedTransaction} />
          </div>
        )}
      </div>
    </>
  )
}
