"use client"

import { TooltipTrigger } from "@/components/ui/tooltip"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Advertisement, PaymentMethod } from "@/services/api/api-buy-sell"
import MarketFilterDropdown from "@/components/market-filter/market-filter-dropdown"
import type { MarketFilterOptions } from "@/components/market-filter/types"
import OrderSidebar from "@/components/buy-sell/order-sidebar"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import {
  evaluateRisk,
  type RiskWarningResult,
} from "@/components/buy-sell/risk-warning/risk-warning-rules"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"
import { useCurrencyData } from "@/hooks/use-currency-data"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import Image from "next/image"
import { currencyFlagMapper, formatPaymentMethodName, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
import EmptyState from "@/components/empty-state"
import PaymentMethodsFilter from "@/components/payment-methods-filter/payment-methods-filter"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useUserDataStore } from "@/stores/user-data-store"
import { BalanceSection } from "@/components/balance-section"
import { cn } from "@/lib/utils"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { getTotalBalance } from "@/services/api/api-auth"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { usePaymentMethods, useAdvertisements } from "@/hooks/use-api-queries"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/verified-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackers } from "@/analytics/useTrackers"
import { PresenceLastSeen } from "@/components/presence-last-seen"

type Ad = Advertisement
type AdType = "buy" | "sell"

interface UsersOnlineUpdate {
  user_id: number
  is_online: boolean
  /** Server-provided epoch ms timestamp; only present on offline transitions. */
  last_online_at?: number | null
}


export default function BuySellPage() {
  const { t, locale } = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    activeTab,
    currency,
    sortBy,
    filterOptions,
    selectedPaymentMethods,
    selectedAccountCurrency,
    nickname,
    setActiveTab,
    setCurrency,
    setSortBy,
    setFilterOptions,
    setSelectedPaymentMethods,
    setSelectedAccountCurrency,
  } = useMarketFilterStore()

  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false)
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [pendingRiskAd, setPendingRiskAd] = useState<Advertisement | null>(null)
  const [riskResult, setRiskResult] = useState<RiskWarningResult | null>(null)
  const [isRiskWarningOpen, setIsRiskWarningOpen] = useState(false)
  const [isOpenedFromSearch, setIsOpenedFromSearch] = useState(false)
  const { pendingAd, openedFromSearch, setPendingAd, setTriggerSearchReopen } = useOrderSidebarStore()
  const [balance, setBalance] = useState<string>("0.00")
  const [balanceCurrency, setBalanceCurrency] = useState<string>("USD")
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true)
  const [showKycPopup, setShowKycPopup] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isFetchingNextPageRef = useRef(false)

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = usePaymentMethods()

  const fetchedForRef = useRef<string | null>(null)
  const { currencies } = useCurrencyData()
  const { accountCurrencies } = useAccountCurrencies()
  const userId = useUserDataStore((state) => state.userId)
  const userData = useUserDataStore((state) => state.userData)
  const localCurrency = useUserDataStore((state) => state.localCurrency)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { hideAlert, showAlert } = useAlertDialog()
  const isMobile = useIsMobile()
  const { track } = useTrackers()

  const { isConnected, joinAdvertsChannel, leaveAdvertsChannel, subscribe, subscribeToUserUpdates, unsubscribeFromUserUpdates, joinUsersOnlineChannel, leaveUsersOnlineChannel } = useWebSocketContext()


  const { data: advertsData, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdvertisements(
    {
      type: activeTab,
      account_currency: selectedAccountCurrency,
      currency: currency,
      paymentMethod: selectedPaymentMethods.length === paymentMethods.length ? [] : selectedPaymentMethods,
      sortBy: sortBy,
      favourites_only: filterOptions.fromFollowing ? 1 : 0,
    }
  )
  const fetchedAdverts = useMemo(() => advertsData?.pages.flat() ?? [], [advertsData?.pages])

  const hasActiveFilters = filterOptions.fromFollowing !== false || sortBy !== "trade_band_rank"
  const isV1Signup = userData?.signup === "v1"
  const tempBanUntil = userData?.temp_ban_until

  // Zero-balance banner. Two gates:
  //   1. Onboarding gate — banner only shows for fully-onboarded P2P
  //      advertisers (POI/POA approved, PNV verified, TnC accepted,
  //      profile complete, p2p.allowed). Mirrors the mobile gate so the
  //      banner stays hidden while the KYC onboarding sheet is shown.
  //   2. Balance source — `total_account_value.amount` from /users/me,
  //      which flows into local `balance` state via `fetchBalance` and
  //      the `balance_change` WebSocket handler. Pass `undefined` while
  //      loading so the hook preserves its state until a definitive
  //      value arrives.
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const displayCurrency = currency || localCurrency || selectedAccountCurrency
  const showCurrencyFilter = currencies.length > 0 || Boolean(displayCurrency)
  const hasFilteredPaymentMethods =
    paymentMethods.length > 0 &&
    selectedPaymentMethods.length < paymentMethods.length &&
    selectedPaymentMethods.length > 0

  const balancesKey = useMemo(() => {
    if (!userData?.signup) return null

    if (isV1Signup) {
      const balances = userData?.balances
      if (!balances) return "v1-empty"
      return `v1-${balances.amount || "0"}-${balances.currency || "USD"}`
    }
    return "v2"
  }, [isV1Signup, userData?.balances, userData?.signup])

  const fetchBalance = useCallback(async () => {
    if (!userData?.signup) {
      return
    }

    if (isV1Signup && !userData?.balances) {
      return
    }

    if (fetchedForRef.current === balancesKey) {
      return
    }

    fetchedForRef.current = balancesKey
    setIsLoadingBalance(true)

    try {
      const balances = userData?.balances || { amount: "0.00", currency: "USD" }
      setBalance(balances.amount)
      setBalanceCurrency(balances.currency)
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance("0.00")
      setBalanceCurrency("USD")
    } finally {
      setIsLoadingBalance(false)
    }
  }, [balancesKey, isV1Signup, userData])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    if (pendingAd) {
      setIsOpenedFromSearch(openedFromSearch)
      setSelectedAd(pendingAd)
      setIsOrderSidebarOpen(true)
      setPendingAd(null)
    }
  }, [pendingAd, openedFromSearch, setPendingAd])

  // Subscribe to WebSocket updates for users/me to get real-time balance updates
  useEffect(() => {
    if (!isConnected) return

    subscribeToUserUpdates()

    const unsubscribe = subscribe((data: any) => {
      // Check if message is from users/me channel with balance data
      if (data?.options?.channel?.startsWith("users/me")) {
        if (data?.payload?.data?.event === "balance_change" && data?.payload?.data?.user?.total_account_value) {
          setBalance(data?.payload?.data?.user?.total_account_value.amount?.toString() || "0.00")
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

  useEffect(() => {
    const operation = searchParams.get("operation")
    const currencyParam = searchParams.get("currency")

    if (operation && (operation === "buy" || operation === "sell")) {
      if (operation === "buy") setActiveTab("sell")
      else {
        setActiveTab("buy")
      }
    }


    if (currencyParam) {
      setSelectedAccountCurrency(currencyParam.toUpperCase())
    }
  }, [searchParams, setActiveTab, setSelectedAccountCurrency])

  useEffect(() => {
    // Currency init: if store has no currency yet, default to user's local currency (or first available).
    // If user already picked a currency, do not override it.
    if (currencies.length > 0 && (currency === "" || currency === null)) {
      const validCurrencyCodes = currencies.map((c) => c.code)
      if (localCurrency && validCurrencyCodes.includes(localCurrency)) {
        setCurrency(localCurrency)
      } else {
        setCurrency(currencies[0]?.code)
      }
    }
  }, [currencies, localCurrency, currency, setCurrency])

  const paymentMethodsString = useMemo(
    () => JSON.stringify(selectedPaymentMethods),
    [selectedPaymentMethods]
  )

  // Sync hook data to local state for websocket updates
  useEffect(() => {
    if (Array.isArray(fetchedAdverts)) {
      setAdverts((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(fetchedAdverts)) {
          return prev
        }
        return fetchedAdverts
      })
    }
  }, [fetchedAdverts])

  // Reset scroll position when filters change so sentinel re-enters view and load more works
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [activeTab, currency, paymentMethodsString, sortBy, filterOptions.fromFollowing, selectedAccountCurrency])

  // Keep ref in sync so the observer callback always reads the latest value
  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

  // Infinite scroll: fetch next page when sentinel comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollContainer = scrollContainerRef.current
    if (!sentinel || !hasNextPage || !scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPageRef.current) {
          fetchNextPage()
        }
      },
      { threshold: 0, rootMargin: "100px", root: scrollContainer },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  useEffect(() => {
    if (paymentMethods.length > 0 && selectedPaymentMethods.length === 0) {
      setSelectedPaymentMethods(paymentMethods.map((method) => method.method))
    }
  }, [paymentMethods, selectedPaymentMethods.length, setSelectedPaymentMethods])

  const handleAdvertiserClick = (advertiserId: number) => {
    if (isMaintenanceActive) return
    track("ek_advertiser_profile_markets")
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      router.push(`/advertiser/${advertiserId}`)
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "markets",
        onClose: hideAlert }))
    }
  }

  const handleRiskContinue = () => {
    if (pendingRiskAd) {
      setSelectedAd(pendingRiskAd)
      setIsOrderSidebarOpen(true)
    }
    setIsRiskWarningOpen(false)
    setPendingRiskAd(null)
    setRiskResult(null)
  }

  const handleRiskClose = () => {
    setIsRiskWarningOpen(false)
    setPendingRiskAd(null)
    setRiskResult(null)
  }

  const handleOrderClick = (ad: Advertisement) => {
    if (isMaintenanceActive) return
    track("ek_advert_action_markets", { advert_type: ad.type === "buy" ? "sell" : "buy" })
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      const risk = evaluateRisk(ad)
      if (risk) {
        setPendingRiskAd(ad)
        setRiskResult(risk)
        setIsRiskWarningOpen(true)
        return
      }
      setSelectedAd(ad)
      setIsOrderSidebarOpen(true)
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "markets",
        onClose: hideAlert }))
    }
  }

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode)
  }

  const handleFilterApply = (newFilters: MarketFilterOptions, sortByValue?: string) => {
    setFilterOptions(newFilters)
    if (sortByValue) setSortBy(sortByValue)
  }

  const getPaymentMethodsDisplayText = () => {
    if (
      paymentMethods.length === 0 ||
      selectedPaymentMethods.length === 0 ||
      selectedPaymentMethods.length === paymentMethods.length
    ) {
      return t("market.paymentMethodAll")
    }

    return t("market.paymentMethodSelected", { count: selectedPaymentMethods.length })
  }

  useEffect(() => {
    if (isFilterPopupOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (!(event.target as Element).closest(".filter-dropdown-container")) {
          setIsFilterPopupOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isFilterPopupOpen])

  useEffect(() => {
    if (isMaintenanceActive) return
    if (isConnected && selectedAccountCurrency && currency && activeTab) {
      joinAdvertsChannel(selectedAccountCurrency, currency, activeTab)

      return () => {
        leaveAdvertsChannel(selectedAccountCurrency, currency, activeTab)
      }
    }
  }, [isMaintenanceActive, isConnected, selectedAccountCurrency, currency, activeTab, joinAdvertsChannel, leaveAdvertsChannel])

  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (data?.options?.channel?.startsWith("adverts/currency/")) {
        if (data?.payload?.data?.event === "update" && data?.payload?.data?.advert) {
          const updatedAdvert = data.payload.data.advert

          setAdverts((currentAdverts) =>
            currentAdverts.map((ad) =>
              ad.id == updatedAdvert.id
                ? {
                  ...ad,
                  version: updatedAdvert.version,
                  effective_rate_display: updatedAdvert.effective_rate_display,
                  minimum_order_amount: updatedAdvert.minimum_order_amount,
                  actual_maximum_order_amount: updatedAdvert.actual_maximum_order_amount,
                  payment_methods: updatedAdvert.payment_methods,
                  payment_method_names: updatedAdvert.payment_method_names,
                }
                : ad,
            ),
          )
        }
      }
    })

    return unsubscribe
  }, [subscribe])

  const handleUsersOnlineUpdate = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return
    const channel = (data as Record<string, any>)?.options?.channel
    if (channel !== "users_online") return

    const payload = (data as Record<string, any>)?.payload?.data
    if (!payload || typeof payload.user_id !== "number" || typeof payload.is_online !== "boolean") return

    const update: UsersOnlineUpdate = payload

    setAdverts((currentAdverts) =>
      currentAdverts.map((ad) => {
        if (update.user_id !== ad.user?.id) return ad
        // Prefer server-provided timestamp; fall back to Date.now() only as a
        // last resort so the UI immediately reflects the offline state.
        const lastOnlineAt = update.is_online
          ? ad.user.last_online_at
          : (update.last_online_at ?? Date.now())
        return { ...ad, user: { ...ad.user, is_online: update.is_online, last_online_at: lastOnlineAt } }
      }),
    )
  }, [])

  useEffect(() => {
    if (isMaintenanceActive || !isConnected) return

    joinUsersOnlineChannel()
    const unsubscribe = subscribe(handleUsersOnlineUpdate)

    return () => {
      unsubscribe()
      leaveUsersOnlineChannel()
    }
  }, [isMaintenanceActive, isConnected, handleUsersOnlineUpdate, joinUsersOnlineChannel, leaveUsersOnlineChannel])

  useEffect(() => {
    track("ek_open_markets")
  }, []) // fires once on mount

  useEffect(() => {
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (shouldShowKyc && !showKycPopup) {
      setShowKycPopup(true)
      showAlert(createKycOnboardingAlertConfig({ route: "markets",
        onClose: hideAlert }))
    }
  }, [searchParams, showKycPopup, showAlert, t])

  return (
    <>
      <div className="flex flex-col h-full md:h-screen overflow-hidden">
        <div className="flex-shrink-0 flex-grow-0 sticky top-0 z-4 bg-background px-3">
          <div className="mb-4 md:mb-6 md:flex md:flex-col justify-between gap-4">
            {/* Desktop only — maintenance + mobile balance banners live in main.tsx. */}
            {/* Tuck the dark balance card under the banner's bottom edge via `-mb-8`. */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-[calc(100%+24px)] md:w-full flex flex-row items-end gap-[16px] md:gap-[24px] bg-slate-1200 p-6 rounded-b-3xl md:rounded-3xl justify-between -mx-3 mb-4 md:m-0">
                <div className="flex flex-col items-start w-full md:w-auto">
                  <div data-testid="markets-text-balance">
                    <BalanceSection balance={balance} currency={balanceCurrency} isLoading={isLoadingBalance} />
                  </div>
                  <Tabs value={activeTab} onValueChange={(value) => { if (value === "sell") track("ek_buy_markets"); else track("ek_sell_markets"); setActiveTab(value as "buy" | "sell") }}>
                    <TabsList className="w-auto bg-transparent p-0 gap-4 rtl:w-full rtl:justify-end">
                      <TabsTrigger
                        className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                        value="sell"
                        variant="underline"
                        data-testid="markets-tab-buy"
                      >
                        {t("market.buyTab")}
                      </TabsTrigger>
                      <TabsTrigger
                        className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                        value="buy"
                        variant="underline"
                        data-testid="markets-tab-sell"
                      >
                        {t("market.sellTab")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {showCurrencyFilter && (
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    {activeTab === "sell" && (
                      <span className="text-xs font-normal text-white opacity-72">
                        {t("market.payWith")}:
                      </span>
                    )}
                    {activeTab === "buy" && (
                      <span className="text-xs font-normal text-white opacity-72">
                        {t("market.receiveIn")}:
                      </span>
                    )}
                    <CurrencyFilter
                      currencies={currencies}
                      selectedCurrency={displayCurrency}
                      onCurrencySelect={handleCurrencySelect}
                      disabled={isMaintenanceActive}
                      title={activeTab === "sell" ? t("market.payWith") : t("market.receiveIn")}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isMaintenanceActive}
                          className="h-10 min-h-10 max-h-10 gap-2 border border-[#ffffff3d] bg-transparent px-3 font-normal hover:bg-transparent rounded-3xl text-white"
                          onClick={() => track("ek_payment_currency_markets")}
                        >
                          {currencyFlagMapper[displayCurrency as keyof typeof currencyFlagMapper] && (
                            <Image
                              src={
                                currencyFlagMapper[displayCurrency as keyof typeof currencyFlagMapper] || "/placeholder.svg"
                              }
                              alt={`${displayCurrency} logo`}
                              width={24}
                              height={16}
                              className="shrink-0 object-cover"
                            />
                          )}
                          <span className="shrink-0">{displayCurrency}</span>
                          <Image
                            src="/icons/chevron-down-white.png"
                            alt={t("common.arrow")}
                            width={24}
                            height={24}
                            className="shrink-0 transition-transform duration-200"
                          />
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            {tempBanUntil && !isMaintenanceActive && <TemporaryBanAlert tempBanUntil={tempBanUntil} />}
            <div className="flex flex-wrap gap-2 md:gap-3 md:px-0 mt-4 md:mt-0 justify-end">
              <div className="flex gap-2 items-center ms-auto flex-1 md:flex-none">
                {!isV1Signup && (
                  <div className="flex gap-2 mb-3 flex-1 hidden">
                    {accountCurrencies.map((curr) => (
                      <Button
                        key={curr.code}
                        variant={selectedAccountCurrency === curr.code ? "black" : "outline"}
                        onClick={() => setSelectedAccountCurrency(curr.code)}
                        className={cn(
                          "px-4 py-2 rounded-full font-normal border-slate-800",
                          selectedAccountCurrency === curr.code
                            ? ""
                            : "text-grayscale-600 hover:bg-transparent border-gray-300",
                        )}
                        size="sm"
                      >
                        {curr.code}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex-1 md:flex md:items-center md:gap-2 md:flex-none">
                  <PaymentMethodsFilter
                    paymentMethods={paymentMethods}
                    selectedMethods={selectedPaymentMethods}
                    onSelectionChange={setSelectedPaymentMethods}
                    isLoading={isLoadingPaymentMethods}
                    disabled={isMaintenanceActive}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMaintenanceActive}
                        className={cn(
                          "rounded-md border border-input font-normal w-full justify-between px-3 rounded-3xl",
                          hasFilteredPaymentMethods
                            ? "bg-black hover:bg-black text-white"
                            : "bg-transparent hover:bg-transparent",
                        )}
                        onClick={() => track("ek_payment_method_filter_markets")}
                      >
                        <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
                          {getPaymentMethodsDisplayText()}
                        </span>
                        {hasFilteredPaymentMethods ? (
                          <Image
                            src="/icons/chevron-down-white.png"
                            alt={t("common.arrow")}
                            width={24}
                            height={24}
                            className="transition-transform duration-200"
                          />
                        ) : (
                          <Image
                            src="/icons/chevron-down.png"
                            alt={t("common.arrow")}
                            width={24}
                            height={24}
                            className="transition-transform duration-200"
                          />
                        )}
                      </Button>
                    }
                  />
                </div>

                <div className="filter-dropdown-container flex-shrink-0">
                  <MarketFilterDropdown
                    activeTab={activeTab}
                    onApply={handleFilterApply}
                    initialFilters={filterOptions}
                    initialSortBy={sortBy}
                    hasActiveFilters={hasActiveFilters}
                    disabled={isMaintenanceActive}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMaintenanceActive}
                        className={cn(
                          "rounded-md border border-input font-normal px-3  focus:border-black min-w-fit rounded-3xl",
                          hasActiveFilters ? "bg-black hover:bg-black" : "bg-transparent hover:bg-transparent",
                        )}
                        onClick={() => track("ek_filter_markets")}
                      >
                        {hasActiveFilters ? (
                          <Image src="/icons/filter-icon-white.png" alt={t("common.filter")} width={16} height={16} />
                        ) : (
                          <Image src="/icons/filter-icon.png" alt={t("common.filter")} width={20} height={20} />
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto pb-4 md:pb-4 scrollbar-hide px-3">
          {isMaintenanceActive ? (
            <div className="h-full">
              <EmptyState title={t("market.noAdsMaintenanceTitle")} route={null} />
            </div>
          ) : isLoading || (adverts.length === 0 && !currency) ? (
            <div className="md:block" data-testid="markets-skeleton-ads">
              <Table>
                <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
                  <TableRow className="text-xs">
                    <TableHead className="text-start py-4 px-4 lg:ps-0 text-slate-600 font-normal">
                      <Skeleton className="bg-grayscale-500 h-5 w-32" />
                    </TableHead>
                    <TableHead className="text-start py-4 px-4 text-slate-600 font-normal">
                      <Skeleton className="bg-grayscale-500 h-5 w-32" />
                    </TableHead>
                    <TableHead className="text-start py-4 px-4 text-slate-600 hidden sm:table-cell font-normal">
                      <Skeleton className="bg-grayscale-500 h-5 w-32" />
                    </TableHead>
                    <TableHead className="text-end py-4 px-4 lg:pe-0"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
                  {[...Array(2)].map((_, index) => (
                    <TableRow
                      key={index}
                      className="grid grid-cols-[1fr_auto] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
                    >
                      <TableCell className="p-2 lg:p-4 lg:ps-0 align-top row-start-1 col-span-full whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="bg-grayscale-500 h-[40px] w-[40px] flex-shrink-0 rounded-full me-[8px]" />
                          <div className="flex-1">
                            <Skeleton className="bg-grayscale-500 h-4 w-32 mb-2" />
                            <Skeleton className="bg-grayscale-500 h-3 w-48" />
                            <Skeleton className="bg-grayscale-500 h-3 w-24 mt-2" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 lg:p-4 align-top row-start-2 col-span-full">
                        <Skeleton className="bg-grayscale-500 h-5 w-32 mb-2" />
                        <Skeleton className="bg-grayscale-500 h-3 w-48" />
                      </TableCell>
                      <TableCell className="p-2 lg:p-4 sm:table-cell align-top row-start-3">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="bg-grayscale-500 h-3 w-24" />
                          <Skeleton className="bg-grayscale-500 h-3 w-28" />
                        </div>
                      </TableCell>
                      <TableCell className="p-2 lg:p-4 lg:pe-0 text-end align-middle row-start-3 whitespace-nowrap">
                        <Skeleton className="bg-grayscale-500 h-8 w-20 ms-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error.message || t("market.failedToLoadAdvertisements")}
            </div>
          ) : adverts.length === 0 ? (
            <div className="h-full" data-testid="markets-empty-state">
              <EmptyState
                title={t("market.noAdsTitle", { currency: currency })}
                description={t("market.noAdsDescription", { currency: currency })}
                redirectToAds={true}
                adType={activeTab}
                route="markets"
              />
            </div>
          ) : (
            <div className="md:block">
              <Table>
                <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
                  <TableRow className="text-xs">
                    <TableHead className="text-start py-4 px-4 lg:ps-0 text-slate-600 font-normal">
                      {t("market.advertisers")}
                    </TableHead>
                    <TableHead className="text-start py-4 px-4 text-slate-600 font-normal">
                      {t("market.rates")}
                    </TableHead>
                    <TableHead className="text-start py-4 px-4 text-slate-600 hidden sm:table-cell font-normal">
                      {t("market.paymentMethods")}
                    </TableHead>
                    <TableHead className="text-end py-4 px-4 lg:pe-0"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm" data-testid="markets-list-ads">

                  {adverts.map((ad) => (
                    <TableRow
                      className="grid grid-cols-[1fr_auto] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
                      key={ad.id}
                      data-testid={`markets-card-ad-${ad.id}`}
                    >
                      <TableCell className="p-2 lg:p-4 lg:ps-0 align-top row-start-1 col-span-full whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative h-[40px] w-[40px] flex-shrink-0 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl me-[8px]">
                            {(ad.user?.nickname || "").charAt(0).toUpperCase()}
                            <div
                              className={`absolute bottom-0 end-0 h-[10px] w-[10px] rounded-full border border-white ${ad.user?.is_online ? "bg-buy" : "bg-gray-400"
                                }`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                                className="hover:underline cursor-pointer"
                                data-testid={`markets-link-advertiser-${ad.advertiser_id ?? ad.user?.id}`}
                              >
                                {ad.user?.nickname}
                              </button>
                              <VerifiedBadge size={20} />
                              {ad.user.trade_band && (
                                <TradeBandBadge
                                  tradeBand={ad.user.trade_band}
                                  showLearnMore={true}
                                  size={20}
                                />
                              )}
                              {IS_CLOSED_GROUP_ENABLED && ad.is_private && (
                                <Image
                                  src="/icons/closed-group.svg"
                                  alt={t("common.closedGroup")}
                                  width={32}
                                  height={32}
                                  className="cursor-pointer me-1"
                                />
                              )}
                              {ad.user?.is_favourite && (
                                <span className="px-[8px] py-[4px] bg-blue-50 text-blue-100 text-xs rounded-[4px]">
                                  {t("market.following")}
                                </span>
                              )}
                            </div>
                            <PresenceLastSeen
                              isOnline={ad.user?.is_online}
                              lastOnlineAt={ad.user?.last_online_at}
                              className="text-xs text-slate-500 block"
                            />
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-[4px]">
                          {ad.user.rating_average_lifetime && (
                            <span className="flex items-center">
                              <Image
                                src="/icons/star-active.svg"
                                alt={t("common.rating")}
                                width={16}
                                height={16}
                                className="me-1"
                              />
                              <span className="text-pending-text-secondary">
                                {ad.user.rating_average_lifetime.toFixed(2)}
                              </span>
                            </span>
                          )}
                          {ad.user.order_count_lifetime > 0 && (
                            <div className="flex flex-row items-center justify-start gap-[8px] mx-[8px]">
                              {ad.user.rating_average_lifetime && <div className="h-1 w-1 rounded-full bg-slate-500"></div>}
                              <span>
                                {ad.user.order_count_lifetime} {t("market.orders")}
                              </span>
                            </div>
                          )}
                          {ad.user.completion_rate_all_30day > 0 && (
                            <div className="flex flex-row items-center justify-start gap-[8px]">
                              <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                              <span>
                                {ad.user.completion_rate_all_30day}% {t("market.completion")}
                              </span>
                            </div>
                          )}
                        </div>
                        {!isMobile && <div className="flex items-center text-xs text-slate-500 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center bg-gray-100 text-slate-500 rounded-sm px-2 py-1 cursor-pointer">
                                  <Image src="/icons/clock.png" alt={t("common.time")} width={12} height={12} className="me-2" />
                                  <span>
                                    {ad.order_expiry_period} {t("market.min")}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent align="start" className="max-w-[328px] text-wrap">
                                <p>{t("order.paymentTimeTooltip", { minutes: ad.order_expiry_period })}</p>
                                <TooltipArrow className="fill-black" />
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        }
                      </TableCell>
                      <TableCell className="p-2 pt-0 lg:p-4 align-top row-start-2 col-span-full text-start">
                        <div className="font-bold text-base flex items-center justify-start text-start" data-testid={`markets-text-rate-${ad.id}`}>
                          <ExchangeRateDisplay
                            rate={ad.effective_rate_display}
                            paymentCurrency={ad.payment_currency}
                            mutedClassName="text-xs text-slate-500 font-normal"
                          />
                        </div>
                        <div className="mt-1 text-xs" data-testid={`markets-text-limits-${ad.id}`}>{`${t("market.orderLimits")}: ${ad.minimum_order_amount || "N/A"} - ${ad.actual_maximum_order_amount || "N/A"
                          }  ${ad.account_currency}`}</div>
                        {isMobile && <div className="flex w-full items-center justify-start text-start text-xs text-slate-500 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-start bg-gray-100 text-slate-500 rounded-sm px-2 py-1 cursor-pointer text-start">
                                  <Image src="/icons/clock.png" alt={t("common.time")} width={12} height={12} className="me-2" />
                                  <span>
                                    {ad.order_expiry_period} {t("market.min")}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent align="start" className="max-w-[328px] text-wrap">
                                <p>{t("order.paymentTimeTooltip", { minutes: ad.order_expiry_period })}</p>
                                <TooltipArrow className="fill-black" />
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>}
                      </TableCell>
                      <TableCell className="p-2 lg:p-4 sm:table-cell align-top row-start-3">
                        <div className="flex flex-row lg:flex-col flex-wrap gap-2 h-full">
                          {ad.payment_methods?.map((method, index) => (
                            <div key={index} className="flex items-center">
                              {method && (
                                <div
                                  className={`h-2 w-2 rounded-full me-2 ${method.toLowerCase().includes("bank")
                                    ? "bg-paymentMethod-bank"
                                    : "bg-paymentMethod-ewallet"
                                    }`}
                                ></div>
                              )}
                              <span className="text-xs">{formatPaymentMethodName(method, t)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 lg:p-4 lg:pe-0 text-end align-middle row-start-3 whitespace-nowrap">
                        {Number(userId) !== ad.user.id && (
                          <Button
                            variant={ad.type === "buy" ? "destructive" : "secondary"}
                            size="sm"
                            onClick={() => handleOrderClick(ad)}
                            disabled={!!tempBanUntil || isMaintenanceActive}
                            data-testid={ad.type === "buy" ? `markets-btn-sell-${ad.id}` : `markets-btn-buy-${ad.id}`}
                          >
                            {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {isFetchingNextPage && (
            <div className="sticky bottom-0 flex justify-center py-4 bg-background">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" data-testid="markets-sentinel-load-more" />
        </div>

        <OrderSidebar
          isOpen={isOrderSidebarOpen}
          onStartClose={() => {
            if (isOpenedFromSearch) {
              setTriggerSearchReopen(true)
              setIsOpenedFromSearch(false)
            }
          }}
          onClose={() => {
            setIsOrderSidebarOpen(false)
          }}
          ad={selectedAd}
          orderType={(selectedAd?.type ?? activeTab) as "buy" | "sell"}
          p2pBalance={Number.parseFloat(balance)}
        />

        {pendingRiskAd && riskResult && (
          <RiskWarningModal
            isOpen={isRiskWarningOpen}
            result={riskResult}
            advertiserNickname={pendingRiskAd.user.nickname}
            onContinue={handleRiskContinue}
            onClose={handleRiskClose}
          />
        )}
      </div>
    </>
  )
}
