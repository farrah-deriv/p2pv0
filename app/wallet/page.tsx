"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TransactionsTab } from "./components"
import WalletSummary from "./components/wallet-summary"
import WalletBalances from "./components/wallet-balances"
import { useCurrencies, useTotalBalance } from "@/hooks/use-api-queries"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { useUserDataStore } from "@/stores/user-data-store"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import EmptyState from "@/components/empty-state"
import { useWalletViewStore } from "@/stores/wallet-view-store"
import type { Transaction } from "./types"
import { useBalanceChangeWs } from "@/hooks/use-balance-change-ws"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"

interface Balance {
  wallet_id: string
  amount: string
  currency: string
  label: string
}

export default function WalletPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { openKycIfUnverified } = useKycOverlay({ route: "wallets" })
  const kycPopupHandledRef = useRef(false)
  const { data: currenciesResponse } = useCurrencies()
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useTotalBalance()
  const [displayBalances, setDisplayBalances] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>("USD")
  const [totalBalance, setTotalBalance] = useState("0.00")
  const [balanceCurrency, setBalanceCurrency] = useState("USD")
  const [p2pBalances, setP2pBalances] = useState<Balance[]>([])
  const [hasBalance, setHasBalance] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const { userData } = useUserDataStore()
  const tempBanUntil = userData?.temp_ban_until
  const isDisabled = userData?.status === "disabled"
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { setIsTransactionListVisible } = useWalletViewStore()
  const p2pBalanceAmount = userData?.balances?.amount ?? totalBalance
  const p2pBalanceCurrency = userData?.balances?.currency ?? balanceCurrency

  const processBalanceData = useCallback(
    (currencies: Record<string, any>, balance: any) => {
      try {
        const p2pWallet = balance?.wallets?.items?.find((wallet: any) => wallet.type === "p2p")
        const mainWallet = balance?.wallets?.items?.find((wallet: any) => wallet.type === "main")

        if (p2pWallet) {
          setTotalBalance(p2pWallet.total_balance?.approximate_total_balance ?? "0.00")
          setBalanceCurrency(p2pWallet.total_balance?.converted_to ?? "USD")

          const hasP2pBalance =
            p2pWallet.balances?.some((wallet: any) => Number.parseFloat(wallet.balance || "0") > 0) ?? false
          const hasMainBalance = (mainWallet &&
            mainWallet.balances?.some((wallet: any) => Number.parseFloat(wallet.balance || "0") > 0)) ?? false

          const hasAnyBalance = hasP2pBalance || hasMainBalance
          setHasBalance(hasAnyBalance)

          if (p2pWallet.balances) {
            const balancesList: Balance[] = p2pWallet.balances.map((wallet: any) => ({
              wallet_id: p2pWallet.id,
              amount: String(wallet.balance || "0"),
              currency: wallet.currency,
              label: currencies[wallet.currency]?.label || wallet.currency,
            }))
            setP2pBalances(balancesList)
          }
        }
      } catch (error) {
        console.error("Error processing P2P wallet balance:", error)
        setTotalBalance("0.00")
        setHasBalance(false)
      }
    },
    []
  )

  useEffect(() => {
    track("ek_open_wallets")
    return () => setIsTransactionListVisible(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (!shouldShowKyc || kycPopupHandledRef.current) return
    kycPopupHandledRef.current = true
    void openKycIfUnverified()
  }, [searchParams, openKycIfUnverified])

  useEffect(() => {
    processBalanceData(currenciesResponse || {}, balanceData)
  }, [balanceData, currenciesResponse, processBalanceData])

  // Subscribe to WebSocket updates for users/me to get real-time balance updates
  const handleBalanceChangeWs = useCallback((amount: string, currency: string) => {
    setTotalBalance(amount)
    setBalanceCurrency(currency)
  }, [])
  useBalanceChangeWs(handleBalanceChangeWs)

  const handleBalanceClick = (currency: string, balance: string) => {
    track("ek_wallet_item_wallets", { currency_code: currency })
    setSelectedCurrency(currency)
    setTotalBalance(balance)
    setDisplayBalances(false)
    setIsTransactionListVisible(true)
  }

  const handleBackToBalances = () => {
    setDisplayBalances(true)
    setSelectedCurrency(null)
    setSelectedTransaction(null)
    setIsTransactionListVisible(false)
    // Restore the total balance from the p2p wallet
    if (balanceData?.wallets?.items) {
      const p2pWallet = balanceData.wallets.items.find((wallet: any) => wallet.type === "p2p")
      if (p2pWallet?.total_balance?.approximate_total_balance) {
        setTotalBalance(p2pWallet.total_balance.approximate_total_balance)
        setBalanceCurrency(p2pWallet.total_balance.converted_to || "USD")
      }
    }
  }

  if (isDisabled) {
    return (
      <div data-testid="wallet-msg-access-removed" className="flex flex-col h-screen overflow-hidden px-3">
        <P2PAccessRemoved />
      </div>
    )
  }

  // Fill Main content height (desktop + mobile flex chain from shell).
  return (
    <div data-testid="wallet-container" className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-background px-0 md:ps-[16px]">
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="w-full mt-0 flex-shrink-0">
          <WalletSummary
            isBalancesView={displayBalances || !!selectedTransaction}
            selectedCurrency={selectedCurrency}
            onBack={handleBackToBalances}
            balance={isMaintenanceActive ? p2pBalanceAmount : (
              !displayBalances && selectedCurrency
                ? (p2pBalances.find((b) => b.currency === selectedCurrency)?.amount ?? totalBalance)
                : totalBalance
            )}
            currency={isMaintenanceActive ? p2pBalanceCurrency : balanceCurrency}
            isLoading={isMaintenanceActive ? false : isBalanceLoading}
            hasBalance={hasBalance}
            selectedTransaction={selectedTransaction}
            onTransactionSelect={setSelectedTransaction}
            actionsDisabled={!!tempBanUntil || isMaintenanceActive}
            onViewTransactionDetails={(transaction) => {
              const currency = transaction.metadata?.transaction_currency || selectedCurrency || "USD"
              setDisplayBalances(false)
              setSelectedCurrency(currency)
              setSelectedTransaction(transaction)
              setIsTransactionListVisible(true)
            }}
          />
        </div>
        {tempBanUntil && !isMaintenanceActive && (
          <div data-testid="wallet-alert-temp-ban" className="w-full flex-shrink-0 px-4 md:px-0 mt-4">
            <TemporaryBanAlert tempBanUntil={tempBanUntil} />
          </div>
        )}
        <div
          className={`flex flex-col flex-1 min-h-0 min-w-0 self-stretch ${
            selectedTransaction
              ? // Responsive: full-bleed section cards (Figma).
                "mx-0 px-0 mt-0"
              : // List: no wrapper pad — rows use same p-6 as WalletSummary so amounts
                // line up with header actions. Separators stay full-bleed in the row parent.
                displayBalances
                  ? // Full-bleed list — title/row content pad themselves; separator reaches edge.
                    "mx-0 px-0 mt-4 md:mt-4"
                  : "mx-0 px-0 mt-0"
          }`}
        >
          {isMaintenanceActive ? (
            <div data-testid="wallet-empty-transactions"><EmptyState title={t("wallet.noTransactions")} /></div>
          ) : displayBalances ? (
            <WalletBalances
              onBalanceClick={handleBalanceClick}
              balances={p2pBalances}
              isLoading={isBalanceLoading}
              isError={isBalanceError}
              onRetry={() => refetchBalance()}
            />
          ) : (
            <TransactionsTab
              selectedCurrency={selectedCurrency}
              selectedTransaction={selectedTransaction}
              onTransactionSelect={setSelectedTransaction}
            />
          )}
        </div>
      </div>
    </div>
  )
}
