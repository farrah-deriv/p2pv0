"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn, getHomeUrl } from "@/lib/utils"
import { getHelpCentreUrl } from "@/lib/get-help-centre-url"
import { NovuNotifications } from "./novu-notifications"
import { useState, useEffect, useRef, Fragment } from "react"
import { useUserDataStore, getCachedSignup } from "@/stores/user-data-store"
import { SvgIcon } from "@/components/icons/svg-icon"
import { useTranslations } from "@/lib/i18n/use-translations"
import { StandaloneSearchRegularIcon, StandaloneUserFillIcon, StandaloneChevronRightRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TabHorizontal } from "@deriv-com/quill-ui-v2"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useAdvertiserSearch } from "@/hooks/use-api-queries"
import { FeedbackDialog } from "@/components/feedback/feedback-dialog"
import type { Advertisement } from "@/services/api/api-buy-sell"
import EmptyState from "@/components/empty-state"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { guardP2PNavigation } from "@/lib/p2p-maintenance-navigation"
import { AdvertiserSearchResultCard } from "@/components/advertiser-search-result-card"
import { AdvertiserSearchSkeleton } from "@/components/advertiser-search-skeleton"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import { evaluateRisk, type RiskWarningResult } from "@/components/buy-sell/risk-warning/risk-warning-rules"
import MarketIcon from "@/public/icons/ic-buy-sell.svg"
import MarketSelectedIcon from "@/public/icons/ic-buy-sell-selected.svg"
import OrdersIcon from "@/public/icons/ic-orders.svg"
import OrdersSelectedIcon from "@/public/icons/ic-orders-selected.svg"
import AdsIcon from "@/public/icons/ic-my-ads.svg"
import AdsSelectedIcon from "@/public/icons/ic-my-ads-selected.svg"
import WalletIcon from "@/public/icons/ic-wallet.svg"
import WalletSelectedIcon from "@/public/icons/ic-wallet-selected.svg"
import ProfileIcon from "@/public/icons/profile-icon.svg"
import ProfileSelectedIcon from "@/public/icons/profile-icon-red.svg"
import GuideIcon from "@/public/icons/ic-guide.svg"
import GuideSelectedIcon from "@/public/icons/ic-guide-selected.svg"
import HomeIcon from "@/public/icons/ic-house.svg"
interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isWalletAccount, userData, userId, verificationStatus, onboardingStatus } = useUserDataStore()
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const { t, locale } = useTranslations()
  const { nickname, setNickname, currency, selectedAccountCurrency, activeTab } = useMarketFilterStore()
  const { setPendingAd, setShouldReopenSearchOnReturn } = useOrderSidebarStore()
  const { hideAlert, showAlert } = useAlertDialog()
  const { track } = useTrackers()
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const [searchInput, setSearchInput] = useState(nickname)
  const [debouncedSearchInput, setDebouncedSearchInput] = useState(nickname)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchTab, setSearchTab] = useState<"buy" | "sell">("sell")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    data: searchData,
    isFetching: isSearching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAdvertiserSearch({
    nickname: debouncedSearchInput,
    type: searchTab,
  })

  const searchResults = searchData?.pages.flat() ?? []

  const dropdownSentinelRef = useRef<HTMLDivElement>(null)
  const dropdownScrollContainerRef = useRef<HTMLDivElement>(null)
  const isFetchingNextPageRef = useRef(false)

  // Reset nickname filter when navigating away from market/advertiser pages
  useEffect(() => {
    const isMarketPage = pathname === "/" || pathname.startsWith("/advertiser")
    if (!isMarketPage) {
      setSearchInput("")
      setDebouncedSearchInput("")
      setNickname("")
    }
  }, [pathname, setNickname])

  // Cleanup timeouts on unmount to prevent memory leaks and race conditions
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  // Keep ref in sync so the observer callback always reads the latest value
  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

  // Infinite scroll: fetch next page when sentinel comes into view
  useEffect(() => {
    const sentinel = dropdownSentinelRef.current
    const scrollContainer = dropdownScrollContainerRef.current
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

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (value.length > 0) {
      setIsSearchFocused(true)
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchInput(value)
      setNickname(value)
    }, 300)
  }

  const handleAdvertiserClick = (advertiserId: number) => {
    if (isMaintenanceActive) return
    track("ek_advertiser_profile_markets_search")
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      router.push(`/advertiser/${advertiserId}`)
    } else {
      showAlert(createKycOnboardingAlertConfig({
        route: "markets",
        onClose: hideAlert
      }))
    }
  }

  const [pendingRiskAd, setPendingRiskAd] = useState<Advertisement | null>(null)
  const [riskResult, setRiskResult] = useState<RiskWarningResult | null>(null)
  const [isRiskWarningOpen, setIsRiskWarningOpen] = useState(false)

  const handleBuySellClick = (ad: Advertisement) => {
    if (isMaintenanceActive) return
    track("ek_advert_action_markets_search", { advert_type: ad.type === "buy" ? "sell" : "buy" })
    const risk = evaluateRisk(ad)
    if (risk) {
      setPendingRiskAd(ad)
      setRiskResult(risk)
      setIsRiskWarningOpen(true)
      return
    }
    setPendingAd(ad)
    setIsSearchFocused(false)
    if (pathname.startsWith("/advertiser")) {
      router.push("/")
    }
  }

  const handleRiskContinue = () => {
    if (pendingRiskAd) {
      setPendingAd(pendingRiskAd)
      setIsSearchFocused(false)
      if (pathname.startsWith("/advertiser")) {
        router.push("/")
      }
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

  const handleClear = () => {
    track("ek_clear_search_markets_search")
    setSearchInput("")
    setDebouncedSearchInput("")
    setNickname("")
  }
  const [showWallet, setShowWallet] = useState<boolean>(() => {
    const cached = getCachedSignup()
    return cached !== "v1"
  })
  const [isV1Signup, setIsV1Signup] = useState(() => {
    const cached = getCachedSignup()
    if (cached !== null) return cached === "v1"
    return userData?.signup === "v1"
  })

  const firstName = userData?.first_name
  const lastName = userData?.last_name
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null
  const email = userData?.email
  const isDisabled = userData?.status === "disabled"

  useEffect(() => {
    if (userData?.signup === "v1") {
      setShowWallet(false)
      setIsV1Signup(true)
    } else if (userData?.signup) {
      setShowWallet(true)
      setIsV1Signup(false)
    }
  }, [userData?.signup])

  const homeUrl = getHomeUrl(isV1Signup, "home")
  const homeProfileUrl = getHomeUrl(isV1Signup, "homeProfile")

  const helpCentreUrl = `${getHelpCentreUrl(locale)}/help-centre/deriv-p2p`

  const navItems = [
    ...(!isDisabled
      ? [
        { name: t("navigation.home"), href: homeUrl, icon: HomeIcon, selectedIcon: HomeIcon, testId: "sidebar-link-home" },
        { name: t("navigation.market"), href: "/", icon: MarketIcon, selectedIcon: MarketSelectedIcon, testId: "sidebar-link-markets" },
        { name: t("navigation.orders"), href: "/orders", icon: OrdersIcon, selectedIcon: OrdersSelectedIcon, testId: "sidebar-link-orders" },
        { name: t("navigation.myAds"), href: "/ads", icon: AdsIcon, selectedIcon: AdsSelectedIcon, testId: "sidebar-link-ads" },
        ...(showWallet
          ? [{ name: t("navigation.wallet"), href: "/wallet", icon: WalletIcon, selectedIcon: WalletSelectedIcon, testId: "sidebar-link-wallet" }]
          : []),
        { name: t("navigation.profile"), href: "/profile", icon: ProfileIcon, selectedIcon: ProfileSelectedIcon, testId: "sidebar-link-profile" },
        { name: t("navigation.p2pHelpCentre"), href: helpCentreUrl, icon: GuideIcon, selectedIcon: GuideSelectedIcon, testId: "sidebar-link-help" },
      ]
      : []),
  ]

  const hideOnMobile = [
    t("navigation.market"),
    t("navigation.orders"),
    t("navigation.myAds"),
    t("navigation.wallet"),
    t("navigation.profile"),
  ]

  const isOnMarketPage = pathname === "/" || pathname.startsWith("/advertiser")

  const handleAskAmy = () => {
    track("ek_ask_amy_markets")
    if (window.Intercom) {
      window.Intercom("show")
    }
  }

  return (
    <div data-testid="sidebar-container" className={cn("w-[296px] flex flex-col border-e border-neutral-200 bg-white me-[8px]", className)}>
      <div className="flex flex-row justify-between items-center gap-4 px-6 py-5">
        <Image src="/icons/deriv-p2p.png" alt={t("common.derivLogo")} width={128} height={24} />
        {userId && (
          <div
            data-testid="sidebar-btn-notifications"
            className="hidden md:block text-slate-600 hover:text-slate-700"
            onClick={() => guardP2PNavigation(isMaintenanceActive, () => track("ek_notifications_markets"))}
          >
            <NovuNotifications disabled={isMaintenanceActive} />
          </div>
        )}
      </div>
      <nav className="flex-1 px-3">
        {!isDisabled && (
          <a
            data-testid="sidebar-link-home"
            href={homeUrl}
            className="hidden md:flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
            rel="noopener noreferrer"
          >
            <div className="h-5 w-5 flex items-center justify-center">
              <SvgIcon src={HomeIcon} fill="var(--color-neutral-600)" />
            </div>
            {t("navigation.home")}
          </a>
        )}
        {/* Market divider + search sit above the nav list so the guide spotlight excludes them */}
        <div className="my-3 border-b border-grayscale-200"></div>
        {isOnMarketPage && (
          <div className="relative mt-2 mb-1">
            <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-2 h-9">
              <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
              <input
                data-testid="sidebar-input-search"
                type="text"
                placeholder={t("market.searchAdvertiserNickname")}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (isMaintenanceActive) return
                  setIsSearchFocused(true)
                }}
                disabled={isMaintenanceActive}
                onBlur={() => {
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                  blurTimeoutRef.current = setTimeout(() => setIsSearchFocused(false), 150)
                }}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {searchInput && (
                <Button
                  variant="icon-muted"
                  data-testid="sidebar-btn-search-clear"
                  onClick={handleClear}
                  aria-label={t("common.clearSearch")}
                  className="!bg-transparent hover:!bg-transparent"
                >
                  <Image src="/icons/clear-search-icon.png" alt="" aria-hidden="true" width={16} height={16} />
                </Button>
              )}
            </div>
            {isSearchFocused && searchInput.length > 0 && (
              <div className="absolute top-full start-0 mt-1 w-[360px] min-h-[272px] bg-white border border-slate-200 rounded-xl shadow-md z-50 overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
                <div className="px-0 pt-3 pb-0">
                  <TabHorizontal
                    type="fill"
                    value={searchTab}
                    onChange={(v) => {
                      if (v === "sell") track("ek_buy_tab_markets_search")
                      else track("ek_sell_tab_markets_search")
                      setSearchTab(v as "buy" | "sell")
                    }}
                    tabs={[
                      { value: "sell", label: t("market.buyTab") },
                      { value: "buy", label: t("market.sellTab") },
                    ]}
                  />
                </div>
                {isSearching && searchResults.length === 0 ? (
                  <AdvertiserSearchSkeleton count={3} />
                ) : searchResults.length > 0 ? (
                  <div ref={dropdownScrollContainerRef} className="max-h-[480px] overflow-y-auto">
                    {searchResults.map((ad) => (
                      <div key={ad.id} data-testid={`sidebar-card-search-${ad.user?.id}`} className="border-b border-slate-100">
                        {ad.user && <AdvertiserSearchResultCard ad={ad} onAdvertiserClick={handleAdvertiserClick} onBuySellClick={handleBuySellClick} />}
                      </div>
                    ))}
                    {isFetchingNextPage && (
                      <div className="sticky bottom-0 flex justify-center py-2 bg-white">
                        <Spinner size="sm" />
                      </div>
                    )}
                    <div ref={dropdownSentinelRef} className="h-1" />
                  </div>
                ) : debouncedSearchInput.length > 0 ? (
                  <EmptyState
                    title={t("common.searchNoResultsTitle", { query: debouncedSearchInput })}
                    description={t("common.searchNoResultsDescription")}
                    className="py-4 px-2"
                  />
                ) : null}
              </div>
            )}
          </div>
        )}
        <ul data-guide-id="guide-sidebar-nav" className="space-y-1">
          {navItems.filter((item) => item.name !== t("navigation.home")).map((item) => {
            const isExternal = item.href.startsWith("http")
            const isActive = !isExternal && (
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/advertiser")
                : pathname.startsWith(item.href)
            )

            const linkContent = (
              <>
                <div className="h-5 w-5 flex items-center justify-center">
                  <SvgIcon src={isActive ? item.selectedIcon : item.icon} fill={isActive ? "var(--brand-red)" : "var(--color-neutral-600)"} />
                </div>
                {item.name}
              </>
            )

            return (
              <Fragment key={item.name}>
                <li className={cn(hideOnMobile.includes(item.name) && "hidden md:block")}>
                  {item.name === t("navigation.p2pHelpCentre") && <div className="my-3 border-b border-grayscale-200"></div>}
                  {isExternal ? (
                    <a
                      data-testid={item.testId}
                      href={item.href}
                      target="_blank"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                      rel="noopener noreferrer"
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      prefetch
                      data-testid={item.testId}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive ? "text-brand-red" : "text-neutral-600 hover:bg-neutral-50",
                      )}
                    >
                      {linkContent}
                    </Link>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ul>
        {!userData?.feedback_exist && !isDisabled && userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired && (
          <Button
            variant="ghost"
            type="button"
            data-testid="sidebar-btn-feedback"
            onClick={() => setShowFeedbackDialog(true)}
            className="hidden md:flex w-full !justify-start !rounded-lg !px-3 !py-2.5 !h-auto !text-sm !font-normal !text-neutral-600 hover:!bg-neutral-50"
          >
            <span className="flex items-center gap-3">
              <span className="h-5 w-5 flex items-center justify-center">
                <Image src="/icons/ic-feedback.svg" alt="" width={20} height={20} aria-hidden />
              </span>
              {t("nps.sendFeedback")}
            </span>
          </Button>
        )}
        {!isDisabled && (
          <Button
            data-testid="sidebar-btn-ask-amy"
            onClick={handleAskAmy}
            aria-label={t("navigation.askAmy")}
            variant="ghost"
            size="lg"
            className="hidden md:flex w-full my-1 p-0 hover:!bg-transparent"
          >
            <Image src="/icons/ic-ask-amy.svg" alt={t("navigation.askAmy")} width={263} height={40} />
          </Button>
        )}
      </nav>
      <div className="p-4 mb-4">
        <a
          className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors"
          href={homeProfileUrl}
          onClick={() => track("ek_profile_markets")}
        >
          <div className="flex items-center gap-3">
            <div data-testid="sidebar-avatar" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600 shrink-0">
              <StandaloneUserFillIcon width={20} height={20} fill="currentColor" />
            </div>
            <div className="flex flex-col min-w-0 gap-1">
              <span className="text-sm font-semibold text-slate-1200 whitespace-pre-wrap wrap-anywhere">{fullName}</span>
              {email && <span className="text-xs text-slate-1200 whitespace-pre-wrap wrap-anywhere">{email}</span>}
            </div>
          </div>
          <StandaloneChevronRightRegularIcon width={16} height={16} className="text-neutral-400 shrink-0 rtl:rotate-180 ml-auto" />
        </a>
      </div>
      <FeedbackDialog isOpen={showFeedbackDialog} onClose={() => setShowFeedbackDialog(false)} />
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
  )
}
