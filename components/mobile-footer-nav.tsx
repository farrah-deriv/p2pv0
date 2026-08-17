"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { cn, getHomeUrl } from "@/lib/utils"
import { shouldShowMobileFooterNav } from "@/lib/mobile-footer-nav"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { useUserDataStore, getCachedSignup } from "@/stores/user-data-store"
import { useWalletViewStore } from "@/stores/wallet-view-store"
import { useState, useEffect } from "react"
import { useTranslations } from "@/lib/i18n/use-translations"
import { SvgIcon } from "@/components/icons/svg-icon"
import HomeIcon from "@/public/icons/ic-house.svg"
import MarketIcon from "@/public/icons/ic-buy-sell.svg"
import MarketSelectedIcon from "@/public/icons/ic-buy-sell-selected.svg"
import OrdersIcon from "@/public/icons/ic-orders.svg"
import OrdersSelectedIcon from "@/public/icons/ic-orders-selected.svg"
import AdsIcon from "@/public/icons/ic-my-ads.svg"
import AdsSelectedIcon from "@/public/icons/ic-my-ads-selected.svg"
import WalletIcon from "@/public/icons/ic-wallet.svg"
import WalletSelectedIcon from "@/public/icons/ic-wallet-selected.svg"

export default function MobileFooterNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { isChatVisible } = useChatVisibilityStore()
  const { isTransactionListVisible } = useWalletViewStore()
  const { t } = useTranslations()
  const { userData } = useUserDataStore()
  const [showWallet, setShowWallet] = useState<boolean>(() => {
    const cached = getCachedSignup()
    return cached !== "v1"
  })
  const [isV1Signup, setIsV1Signup] = useState(() => {
    const cached = getCachedSignup()
    if (cached !== null) return cached === "v1"
    return userData?.signup === "v1"
  })

  useEffect(() => {
    if (userData?.signup === "v1") {
      setShowWallet(false)
      setIsV1Signup(true)
    } else if (userData?.signup) {
      setShowWallet(true)
      setIsV1Signup(false)
    }
  }, [userData?.signup])

  // Optimistic pending state: the tapped tab flips red immediately and shows a
  // pulsing dot while its route is still committing. Mirrors home-app's
  // MobileNav. Cleared on pathname commit (covers redirects) and by a 15s
  // safety fallback so a stuck navigation can't leave a tab permanently red.
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  useEffect(() => {
    if (!pendingHref) return
    const timer = window.setTimeout(() => setPendingHref(null), 15000)
    return () => window.clearTimeout(timer)
  }, [pendingHref])

  if (userData?.status === "disabled") {
    return null
  }

  if (!shouldShowMobileFooterNav(pathname, isChatVisible, isTransactionListVisible)) {
    return null
  }

  const isMarketActive = pathname === "/" || pathname.startsWith("/advertiser")
  const isOrdersActive = pathname.startsWith("/orders")
  const isAdsActive = pathname.startsWith("/ads")
  const isWalletActive = pathname.startsWith("/wallet")

  return (
    <div
      data-testid="footer-nav-container"
      data-guide-id="guide-footer-nav"
      className={cn("bg-white border-t border-neutral-200 md:hidden z-40 flex-shrink-0", className)}
    >
      <div
        className="flex items-center justify-around pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Link
          href={getHomeUrl(isV1Signup, "home")}
          data-testid="footer-nav-link-home"
          className="flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold text-neutral-600 transition-colors w-[100px]"
        >
          <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
            <SvgIcon src={HomeIcon} fill="var(--color-neutral-600)" />
          </div>
          {t("navigation.home")}
        </Link>
        <FooterTab
          href="/"
          pathname={pathname}
          testId="footer-nav-link-markets"
          label={t("navigation.market")}
          isSelected={pathname === "/" || isMarketActive}
          pendingHref={pendingHref}
          setPendingHref={setPendingHref}
          activeIcon={MarketSelectedIcon}
          inactiveIcon={MarketIcon}
        />
        <FooterTab
          href="/orders"
          pathname={pathname}
          testId="footer-nav-link-orders"
          label={t("navigation.orders")}
          isSelected={isOrdersActive}
          pendingHref={pendingHref}
          setPendingHref={setPendingHref}
          activeIcon={OrdersSelectedIcon}
          inactiveIcon={OrdersIcon}
        />
        <FooterTab
          href="/ads"
          pathname={pathname}
          testId="footer-nav-link-ads"
          label={t("navigation.myAds")}
          isSelected={isAdsActive}
          pendingHref={pendingHref}
          setPendingHref={setPendingHref}
          activeIcon={AdsSelectedIcon}
          inactiveIcon={AdsIcon}
          labelClassName="whitespace-nowrap"
        />
        {showWallet && (
          <FooterTab
            href="/wallet"
            pathname={pathname}
            testId="footer-nav-link-wallet"
            label={t("navigation.wallet")}
            isSelected={isWalletActive}
            pendingHref={pendingHref}
            setPendingHref={setPendingHref}
            activeIcon={WalletSelectedIcon}
            inactiveIcon={WalletIcon}
          />
        )}
      </div>
    </div>
  )
}

/**
 * A single bottom-nav tab with optimistic pending state.
 *
 * When tapped, the destination tab immediately flips to the selected (red)
 * style and shows a pulsing dot under its icon until the route commits — the
 * same pattern as home-app's `MobileNav`. Tapping the already-active tab is a
 * no-op (prevents a stuck pending state on same-route taps).
 */
function FooterTab({
  href,
  pathname,
  testId,
  label,
  isSelected,
  pendingHref,
  setPendingHref,
  activeIcon,
  inactiveIcon,
  labelClassName,
}: {
  href: string
  pathname: string
  testId: string
  label: string
  isSelected: boolean
  pendingHref: string | null
  setPendingHref: (href: string | null) => void
  activeIcon: typeof MarketIcon
  inactiveIcon: typeof MarketIcon
  labelClassName?: string
}) {
  const isExact = pathname === href
  const isPending = pendingHref === href && !isExact
  // Only the destination tab goes red during a cross-tab transition — otherwise
  // a user on a sub-route (e.g. /orders/123) tapping another tab would see both
  // the current parent tab and the pending tab highlighted at once.
  const crossTabPending = pendingHref !== null && pendingHref !== href
  const isTabSelected = isPending || (isSelected && !crossTabPending)
  const Icon = isTabSelected ? activeIcon : inactiveIcon

  return (
    <Link
      href={href}
      data-testid={testId}
      data-pending={isPending || undefined}
      aria-busy={isPending || undefined}
      aria-disabled={isPending || undefined}
      // aria-disabled is semantic only — the <a> remains in the tab order and
      // Enter still activates it. Remove it from the tab order while pending so
      // keyboard users can't focus and re-trigger the in-flight navigation.
      tabIndex={isPending ? -1 : undefined}
      onClick={(e) => {
        if (isExact || pendingHref === href) {
          e.preventDefault()
          return
        }
        setPendingHref(href)
      }}
      className={cn(
        "flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold transition-colors w-[100px]",
        labelClassName,
        isTabSelected ? "text-brand-red" : "text-neutral-600",
      )}
    >
      <div className="relative h-5 w-5 flex items-center justify-center flex-shrink-0">
        <SvgIcon src={Icon} fill={isTabSelected ? "var(--brand-red)" : "var(--color-neutral-600)"} />
        {isPending && (
          <span
            aria-hidden
            data-testid={`${testId}-pending-dot`}
            className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-red animate-pulse"
          />
        )}
      </div>
      {label}
    </Link>
  )
}
