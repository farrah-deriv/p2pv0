"use client"

import { useState, useEffect, useCallback } from "react"
import { TransactionsTab } from "./components"
import WalletSummary from "./components/wallet-summary"
import WalletBalances from "./components/wallet-balances"
import { useCurrencies, useTotalBalance } from "@/hooks/use-api-queries"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { useUserDataStore } from "@/stores/user-data-store"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
import { useRouter } from "next/navigation"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import EmptyState from "@/components/empty-state"
import { useWalletViewStore } from "@/stores/wallet-view-store"

interface Balance {
  wallet_id: string
  amount: string
  currency: string
  label: string
}

export default function WalletPage() {
  const router = useRouter()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { hideAlert, showAlert } = useAlertDialog()
  const { data: currenciesResponse, isLoading: isCurrenciesLoading } = useCurrencies()
  const { data: balanceData, isLoading: isBalanceLoading } = useTotalBalance()
  const { isConnected, subscribeToUserUpdates, unsubscribeFromUserUpdates, subscribe } = useWebSocketContext()
  const [displayBalances, setDisplayBalances] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>("USD")
  const [totalBalance, setTotalBalance] = useState("0.00")
  const [balanceCurrency, setBalanceCurrency] = useState("USD")
  const [p2pBalances, setP2pBalances] = useState<Balance[]>([])
  const [currenciesData, setCurrenciesData] = useState<Record<string, any>>({})
  const [hasCheckedSignup, setHasCheckedSignup] = useState(false)
  const [hasBalance, setHasBalance] = useState(false)
  const [showKycPopup, setShowKycPopup] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
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
    const searchParams = new URLSearchParams(window.location.search)
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (shouldShowKyc) {
      setShowKycPopup(true)
    }
  }, [])

  useEffect(() => {
    if (showKycPopup) {
      showAlert(createKycOnboardingAlertConfig({
        route: "wallets",
        onClose: hideAlert,
        onConfirm: () => setShowKycPopup(false),
        onCancel: () => setShowKycPopup(false),
      }))
      setShowKycPopup(false)
    }
  }, [showKycPopup, showAlert, t])

  useEffect(() => {
    if (userData?.signup === "v1") {
      router.push("/")
    } else {
      setHasCheckedSignup(true)
    }
  }, [userData?.signup, router])

  useEffect(() => {
    const currencies = currenciesResponse?.data || {}
    setCurrenciesData(currencies)
    processBalanceData(currencies, balanceData)
  }, [balanceData, currenciesResponse, processBalanceData])

  // Subscribe to WebSocket updates for users/me to get real-time balance updates
  useEffect(() => {
    if (!isConnected) return

    subscribeToUserUpdates()

    const unsubscribe = subscribe((data: any) => {
      // Check if message is from users/me channel with balance data
      if (data?.options?.channel?.startsWith("users/me")) {
        if (data?.payload?.data?.event === "balance_change" && data?.payload?.data?.user?.total_account_value) {
          setTotalBalance(data?.payload?.data?.user?.total_account_value.amount?.toString() || "0.00")
          setBalanceCurrency(data?.payload?.data?.user?.total_account_value.currency || "USD")

          // Update the user data store with the new balance
          const updateBalances = useUserDataStore.getState().updateBalances
          updateBalances({
            amount: data.payload.data.user.total_account_value.amount?.toString() || "0.00",
            currency: data.payload.data.user.total_account_value.currency || "USD",
          })
        }
      }
    })

    return () => {
      unsubscribe()
      unsubscribeFromUserUpdates()
    }
  }, [isConnected, subscribe, subscribeToUserUpdates, unsubscribeFromUserUpdates])

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

  if (userData?.signup === "v1") {
    return null
  }

  if (isDisabled) {
    return (
      <div data-testid="wallet-msg-access-removed" className="flex flex-col h-screen overflow-hidden px-3">
        <P2PAccessRemoved />
      </div>
    )
  }

  return (
    <div data-testid="wallet-container" className="flex flex-col h-full min-h-0 md:min-h-screen overflow-hidden bg-background px-0 md:ps-[16px]">
      <div className="flex flex-col flex-1 min-h-0 w-full items-center">
        <div className="w-full mt-0 flex-shrink-0">
          <WalletSummary
            isBalancesView={displayBalances || !!selectedTransaction}
            selectedCurrency={selectedCurrency}
            onBack={handleBackToBalances}
            balance={isMaintenanceActive ? p2pBalanceAmount : totalBalance}
            currency={isMaintenanceActive ? p2pBalanceCurrency : balanceCurrency}
            isLoading={isMaintenanceActive ? false : isBalanceLoading}
            hasBalance={hasBalance}
            selectedTransaction={selectedTransaction}
            onTransactionSelect={setSelectedTransaction}
            actionsDisabled={isMaintenanceActive}
          />
        </div>
        {tempBanUntil && !isMaintenanceActive && (
          <div data-testid="wallet-alert-temp-ban" className="w-full flex-shrink-0 px-4 md:px-0 mt-4">
            <TemporaryBanAlert tempBanUntil={tempBanUntil} />
          </div>
        )}
        <div className="flex flex-col flex-1 min-h-0 w-full mt-6 mx-4 md:mx-4 px-6 md:px-0">
          {isMaintenanceActive ? (
            <div data-testid="wallet-empty-transactions"><EmptyState title={t("wallet.noTransactions")} /></div>
          ) : displayBalances ? (
            <WalletBalances onBalanceClick={handleBalanceClick} balances={p2pBalances} isLoading={isBalanceLoading} />
          ) : (
            <TransactionsTab
              selectedCurrency={selectedCurrency}
              currencies={currenciesData}
              selectedTransaction={selectedTransaction}
              onTransactionSelect={setSelectedTransaction}
            />
          )}
        </div>
      </div>
    </div>
  )
}
