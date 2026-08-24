"use client"

import { TooltipTrigger } from "@/components/ui/tooltip"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Advertisement, PaymentMethod } from "@/services/api/api-buy-sell"
import MarketFilterDropdown from "@/components/market-filter/market-filter-dropdown"
import type { MarketFilterOptions } from "@/components/market-filter/types"
import OrderSidebar from "@/components/buy-sell/order-sidebar"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import {
  evaluateRisk,
  type RiskWarningResult,
} from "@/components/buy-sell/risk-warning/risk-warning-rules"
import { HeaderSegmentedControl } from "@/components/header-segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"
import { useCurrencyData } from "@/hooks/use-currency-data"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import Image from "next/image"
import { formatPaymentMethodName, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
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
import { indefiniteArticleFor } from "@/lib/i18n/indefinite-article"
import { usePaymentMethods, useAdvertisements } from "@/hooks/use-api-queries"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/verified-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackers } from "@/analytics/useTrackers"
import { PresenceLastSeen } from "@/components/presence-last-seen"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
import { useGuideStore } from "@/stores/guide-store"
import { P2PGuideButton } from "@/components/p2p-guide/p2p-guide-button"
import { StandaloneFilterRegularIcon } from "@deriv/quill-icons/Standalone"

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
  const pendingStartGuide = useGuideStore((s) => s.pendingStartGuide)
  const isGuideActive = useGuideStore((s) => s.isGuideActive)
  const guideType = useGuideStore((s) => s.guideType)
  const setMarketTradeType = useGuideStore((s) => s.setMarketTradeType)

  useEffect(() => {
    // Explore marketplace from a non-Markets page sets this flag, then
    // navigates here so the tour spotlights Markets UI, not Ads/Orders/etc.
    // Subscribe to the flag (not mount-only) so a later set still starts the
    // tour if Markets stays mounted instead of remounting. Read the store
    // fresh so we never start on a stale snapshot.
    if (!pendingStartGuide) return
    const store = useGuideStore.getState()
    store.setPendingStartGuide(false)
    store.startGuide("markets")
  }, [pendingStartGuide])

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

  // Keep marketTradeType in sync with the active tab so guide step 5 shows the
  // correct currency (Buy USD vs Sell USD). activeTab="buy" means the user is
  // browsing buy-ads and wants to sell; activeTab="sell" means they want to buy.
  useEffect(() => {
    if (!isGuideActive || guideType !== "markets") return
    setMarketTradeType(activeTab)
  }, [isGuideActive, guideType, activeTab, setMarketTradeType])

  const queryClient = useQueryClient()
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const isFetchingNextPageRef = useRef(false)
  const kycPopupHandledRef = useRef(false)

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = usePaymentMethods()

  const fetchedForRef = useRef<string | null>(null)
  const { currencies } = useCurrencyData()
  const { accountCurrencies } = useAccountCurrencies()
  const userId = useUserDataStore((state) => state.userId)
  const userData = useUserDataStore((state) => state.userData)
  const localCurrency = useUserDataStore((state) => state.localCurrency)
  const { runGatedAction, openKycIfUnverified } = useKycOverlay({ route: "markets" })
  const isMobile = useIsMobile()
  const { track } = useTrackers()

  const { isConnected, joinAdvertsChannel, leaveAdvertsChannel, subscribe, subscribeToUserUpdates, unsubscribeFromUserUpdates, joinUsersOnlineChannel, leaveUsersOnlineChannel } = useWebSocketContext()


  const { data: advertsData, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, queryKey: advertsQueryKey } = useAdvertisements(
    {
      type: activeTab,
      account_currency: selectedAccountCurrency,
      currency: currency,
      paymentMethod: selectedPaymentMethods.length === paymentMethods.length ? [] : selectedPaymentMethods,
      sortBy: sortBy,
      favourites_only: filterOptions.fromFollowing ? 1 : 0,
    }
  )
  const fetchNextPageRef = useRef(fetchNextPage)
  const adverts = useMemo(() => advertsData?.pages.flat() ?? [], [advertsData?.pages])

  // Tracks the current query key so WS callbacks always write to the right cache entry.
  const advertsQueryKeyRef = useRef(advertsQueryKey)
  useEffect(() => { advertsQueryKeyRef.current = advertsQueryKey }, [advertsQueryKey])

  const hasActiveFilters = filterOptions.fromFollowing !== false || sortBy !== "trade_band_rank"
  const isV1Signup = userData?.signup === "v1"
  const tempBanUntil = userData?.temp_ban_until
  const firstTradeableAdIndex = adverts.findIndex(ad => Number(userId) !== ad.user.id)

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

  // Reset scroll position when filters change so sentinel re-enters view and load more works
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0
    }
  }, [activeTab, currency, paymentMethodsString, sortBy, filterOptions.fromFollowing, selectedAccountCurrency])

  // Keep refs in sync so callbacks always read the latest values
  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage
  }, [fetchNextPage])

  // Infinite scroll: load the next page when the user scrolls within 300px of the
  // bottom of the scroll container. isFetchingNextPageRef is set to true synchronously
  // before the async fetchNextPage() call so that rapid scroll events fired in the same
  // JS tick cannot pass the guard and trigger parallel API requests.
  useEffect(() => {
    if (!hasNextPage) return
    const scrollEl = isMobile ? scrollContainerRef.current : tableScrollRef.current
    if (!scrollEl) return

    const handleScroll = () => {
      if (isFetchingNextPageRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      if (scrollTop > 0 && scrollTop + clientHeight >= scrollHeight - 300) {
        isFetchingNextPageRef.current = true  // synchronous guard — prevents duplicate calls
        fetchNextPageRef.current()
      }
    }

    scrollEl.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollEl.removeEventListener("scroll", handleScroll)
  }, [hasNextPage, isMobile])


  useEffect(() => {
    if (paymentMethods.length > 0 && selectedPaymentMethods.length === 0) {
      setSelectedPaymentMethods(paymentMethods.map((method) => method.method))
    }
  }, [paymentMethods, selectedPaymentMethods.length, setSelectedPaymentMethods])

  const handleAdvertiserClick = (advertiserId: number) => {
    if (isMaintenanceActive) return
    track("ek_advertiser_profile_markets")
    runGatedAction(() => router.push(`/advertiser/${advertiserId}`))
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
    runGatedAction(() => {
      const risk = evaluateRisk(ad)
      if (risk) {
        setPendingRiskAd(ad)
        setRiskResult(risk)
        setIsRiskWarningOpen(true)
        return
      }
      setSelectedAd(ad)
      setIsOrderSidebarOpen(true)
    })
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

          const key = advertsQueryKeyRef.current
          if (!key) return
          queryClient.setQueryData(
            key as readonly unknown[],
            (old: InfiniteData<Advertisement[]> | undefined) => {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map((page) =>
                  page.map((ad) =>
                    ad.id === updatedAdvert.id
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
                ),
              }
            },
          )
        }
      }
    })

    return unsubscribe
  }, [subscribe, queryClient])

  const handleUsersOnlineUpdate = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return
    const channel = (data as Record<string, any>)?.options?.channel
    if (channel !== "users_online") return

    const payload = (data as Record<string, any>)?.payload?.data
    if (!payload || typeof payload.user_id !== "number" || typeof payload.is_online !== "boolean") return

    const update: UsersOnlineUpdate = payload

    const key = advertsQueryKeyRef.current
    if (!key) return
    queryClient.setQueryData(
      key as readonly unknown[],
      (old: InfiniteData<Advertisement[]> | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((ad) => {
              if (update.user_id !== ad.user?.id) return ad
              // Prefer server-provided timestamp; fall back to Date.now() only as a
              // last resort so the UI immediately reflects the offline state.
              const lastOnlineAt = update.is_online
                ? ad.user.last_online_at
                : (update.last_online_at ?? Date.now())
              return { ...ad, user: { ...ad.user, is_online: update.is_online, last_online_at: lastOnlineAt } }
            }),
          ),
        }
      },
    )
  }, [queryClient])

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
    if (searchParams.get("show_kyc_popup") !== "true" || kycPopupHandledRef.current) return
    kycPopupHandledRef.current = true
    // Verified users must never auto-open KYC. After docs are approved on
    // this same page, the leftover ?show_kyc_popup param would re-mount the
    // sheet and then a later CTA would open the intro on top of it.
    void openKycIfUnverified()
  }, [searchParams, openKycIfUnverified])

  return (
    <>
      <div ref={scrollContainerRef} className="flex flex-col flex-1 min-h-0 h-full md:h-screen px-3 overflow-y-auto md:overflow-hidden overscroll-y-none scrollbar-hide">
        <div className="flex flex-col md:flex-shrink-0 gap-4">
          {/* Desktop only — maintenance + mobile balance banners live in main.tsx. */}
          <div className="relative z-10 flex w-full flex-col bg-slate-1200 p-6 max-md:w-[calc(100%+24px)] max-md:-mx-3 max-md:mb-0 rounded-b-3xl md:rounded-3xl overflow-hidden [transform:translateZ(0)]">
            <div data-testid="markets-text-balance">
              <BalanceSection balance={balance} currency={balanceCurrency} isLoading={isLoadingBalance} />
            </div>
            <div className="md:mt-4 flex w-full min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <HeaderSegmentedControl
                className="shrink-0"
                value={activeTab}
                onValueChange={(value) => {
                  if (value === "sell") track("ek_buy_markets")
                  else track("ek_sell_markets")
                  setActiveTab(value as "buy" | "sell")
                }}
                width={168}
                listDataGuideId="guide-buy-sell-tabs"
                segments={[
                  { value: "sell", label: t("market.buyTab"), testId: "markets-tab-buy" },
                  { value: "buy", label: t("market.sellTab"), testId: "markets-tab-sell" },
                ]}
              />
              {showCurrencyFilter && (
                <div
                  className="flex md:shrink-0 md:flex-row md:items-center gap-2 flex-col"
                  data-guide-id="guide-currency-filter"
                >
                  {activeTab === "sell" && (
                    <span className="text-start text-xs font-normal text-white opacity-72">
                      {t("market.payWith")}:
                    </span>
                  )}
                  {activeTab === "buy" && (
                    <span className="text-start text-xs font-normal text-white opacity-72">
                      {t("market.receiveIn")}:
                    </span>
                  )}
                  <CurrencyFilter
                    currencies={currencies}
                    selectedCurrency={displayCurrency}
                    onCurrencySelect={handleCurrencySelect}
                    disabled={isMaintenanceActive}
                    title={activeTab === "sell" ? t("market.payWith") : t("market.receiveIn")}
                    onOpen={() => track("ek_payment_currency_markets")}
                    triggerClassName="!h-10 !min-h-10 !max-h-10 !w-auto !px-3 !font-normal !border !border-white/24 !bg-transparent !text-white hover:!bg-white/10 !rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
          {tempBanUntil && !isMaintenanceActive && <TemporaryBanAlert tempBanUntil={tempBanUntil} />}
          <div className="flex flex-wrap gap-2 md:gap-3 md:px-0 md:mb-0 md:justify-end">
            <div className="flex gap-2 items-center md:ms-auto md:flex-none max-md:w-full">
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
              <div className="md:flex md:items-center md:gap-2 md:flex-none">
                <PaymentMethodsFilter
                  paymentMethods={paymentMethods}
                  selectedMethods={selectedPaymentMethods}
                  onSelectionChange={setSelectedPaymentMethods}
                  isLoading={isLoadingPaymentMethods}
                  disabled={isMaintenanceActive}
                  triggerLabel={getPaymentMethodsDisplayText()}
                  onOpen={() => track("ek_payment_method_filter_markets")}
                  triggerDataGuideId="guide-payment-method-filter"
                  triggerClassName={cn(
                    "!h-10 !min-h-10 !rounded-3xl !min-w-48 md:!min-w-0 !font-normal",
                    hasFilteredPaymentMethods
                      ? "!bg-black hover:!bg-black !text-white !border-black"
                      : "!bg-transparent hover:!bg-transparent",
                  )}
                />
              </div>

              <div className="filter-dropdown-container flex items-center gap-2 flex-shrink-0">
                <MarketFilterDropdown
                  activeTab={activeTab}
                  onApply={handleFilterApply}
                  initialFilters={filterOptions}
                  initialSortBy={sortBy}
                  hasActiveFilters={hasActiveFilters}
                  disabled={isMaintenanceActive}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isMaintenanceActive}
                      className={cn(
                        "font-normal px-3 min-w-fit rounded-3xl !h-10 !min-h-10 !border !border-solid !border-neutral-200",
                        hasActiveFilters ? "!bg-black hover:!bg-black !text-white !border-black" : "",
                      )}
                      onClick={() => track("ek_filter_markets")}
                      data-guide-id="guide-advanced-filter"
                    >
                      <StandaloneFilterRegularIcon width={20} height={20} fill="currentColor" aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
              <div className="flex-shrink-0 max-md:ml-auto">
                <P2PGuideButton guideType="markets" />
              </div>
            </div>
          </div>
        </div>
        <div ref={tableScrollRef} className="flex flex-col md:flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-y-none md:scrollbar-hide pt-2 pb-4">
          <div className="flex flex-col min-h-full">
            {isMaintenanceActive ? (
              <div className="flex-1 min-h-0 flex items-center md:items-start justify-center md:pt-16">
                <EmptyState title={t("market.noAdsMaintenanceTitle")} route={null} />
              </div>
            ) : isLoading || (adverts.length === 0 && !currency) ? (
              <div className="md:block" data-testid="markets-skeleton-ads">
                <Table>
                  <TableHeader className="hidden lg:table-header-group border-b bg-white z-[1]">
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
              <div className="text-center py-8 text-error">
                {error.message || t("market.failedToLoadAdvertisements")}
              </div>
            ) : adverts.length === 0 ? (
              <div className="flex-1 min-h-0 flex items-center md:items-start justify-center md:pt-16" data-testid="markets-empty-state">
                <EmptyState
                  title={t("market.noAdsTitle", { currency: currency })}
                  description={t("market.noAdsDescription", {
                    article: indefiniteArticleFor(currency),
                    currency: currency,
                  })}
                  redirectToAds={true}
                  adType={activeTab}
                  route="markets"
                />
              </div>
            ) : (
              <div className="md:block">
                <Table>
                  <TableHeader className="hidden lg:table-header-group border-b bg-white z-[1]">
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

                    {adverts.map((ad, adIndex) => (
                      <TableRow
                        className="grid grid-cols-[1fr_auto] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
                        key={ad.id}
                        data-testid={`markets-card-ad-${ad.id}`}
                      >
                        <TableCell
                          className="p-2 lg:p-4 lg:ps-0 align-top row-start-1 col-span-full whitespace-nowrap"
                        >
                          <div
                            className="flex items-center"
                            {...(adIndex === firstTradeableAdIndex ? { "data-guide-id": "guide-advertiser-name" } : {})}
                          >
                            <div className="relative h-[40px] w-[40px] flex-shrink-0 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl me-[8px]">
                              {(ad.user?.nickname || "").charAt(0).toUpperCase()}
                              <div
                                className={`absolute bottom-0 end-0 h-[10px] w-[10px] rounded-full border border-white ${ad.user?.is_online ? "bg-buy" : "bg-gray-400"
                                  }`}
                              />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                                  className="hover:underline hover:!bg-transparent cursor-pointer !p-0 !h-auto !shrink-0 !overflow-visible !leading-normal !text-sm"
                                  data-testid={`markets-link-advertiser-${ad.advertiser_id ?? ad.user?.id}`}
                                  size="sm"
                                >
                                  {ad.user?.nickname}
                                </Button>
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
                              variant={ad.type === "buy" ? "destructive" : "buy"}
                              size="sm"
                              onClick={() => handleOrderClick(ad)}
                              disabled={!!tempBanUntil || isMaintenanceActive}
                              data-testid={ad.type === "buy" ? `markets-btn-sell-${ad.id}` : `markets-btn-buy-${ad.id}`}
                              {...(adIndex === firstTradeableAdIndex ? { "data-guide-id": "guide-trade-button" } : {})}
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
          </div>
          {isFetchingNextPage && (
            <div className="fixed bottom-20 md:bottom-4 left-0 right-0 md:pl-[327px] md:pr-[24px] flex justify-center z-50 pointer-events-none">
              <Spinner size="md" />
            </div>
          )}
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
