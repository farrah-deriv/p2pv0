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
        <Link
          href="/"
          data-testid="footer-nav-link-markets"
          className={cn(
            "flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold transition-colors w-[100px]",
            isMarketActive ? "text-brand-red" : "text-neutral-600",
          )}
        >
          <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
            <SvgIcon
              src={isMarketActive ? MarketSelectedIcon : MarketIcon}
              fill={isMarketActive ? "var(--brand-red)" : "var(--color-neutral-600)"}
            />
          </div>
          {t("navigation.market")}
        </Link>
        <Link
          href="/orders"
          data-testid="footer-nav-link-orders"
          className={cn(
            "flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold transition-colors w-[100px]",
            isOrdersActive ? "text-brand-red" : "text-neutral-600",
          )}
        >
          <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
            <SvgIcon src={isOrdersActive ? OrdersSelectedIcon : OrdersIcon} fill={isOrdersActive ? "var(--brand-red)" : "var(--color-neutral-600)"} />
          </div>
          {t("navigation.orders")}
        </Link>
        <Link
          href="/ads"
          data-testid="footer-nav-link-ads"
          className={cn(
            "flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold transition-colors w-[100px]",
            isAdsActive ? "text-brand-red" : "text-neutral-600",
          )}
        >
          <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
            <SvgIcon src={isAdsActive ? AdsSelectedIcon : AdsIcon} fill={isAdsActive ? "var(--brand-red)" : "var(--color-neutral-600)"} />
          </div>
          {t("navigation.myAds")}
        </Link>
        {showWallet && (
          <Link
            href="/wallet"
            data-testid="footer-nav-link-wallet"
            className={cn(
              "flex flex-col items-center gap-1.5 px-4 pt-2 pb-2 min-h-14 justify-center text-[12px] font-semibold transition-colors w-[100px]",
              isWalletActive ? "text-brand-red" : "text-neutral-600",
            )}
          >
            <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
              <SvgIcon src={isWalletActive ? WalletSelectedIcon : WalletIcon} fill={isWalletActive ? "var(--brand-red)" : "var(--color-neutral-600)"} />
            </div>
            {t("navigation.wallet")}
          </Link>
        )}
      </div>
    </div>
  )
}
