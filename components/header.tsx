"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import SearchIconWhite from "@/public/icons/search-icon-white.svg"
import { useUserDataStore } from "@/stores/user-data-store"
import { NovuBellLink } from "./novu-notifications"
import { MobileSidebarTrigger } from "./mobile-sidebar-wrapper"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useIsMobile } from "@/hooks/use-mobile"
import MobileAdvertiserSearch from "./mobile-advertiser-search"
import { Button } from "@/components/ui/button"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { guardP2PNavigation } from "@/lib/p2p-maintenance-navigation"
import { useWalletViewStore } from "@/stores/wallet-view-store"

export default function Header({ className }: { className?: string }) {
  const userId = useUserDataStore((state) => state.userId)
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { isTransactionListVisible } = useWalletViewStore()
  const isMobile = useIsMobile()
  const { isChatVisible } = useChatVisibilityStore()
  const pathname = usePathname()
  const [userIsSearchOpen, setUserIsSearchOpen] = useState(false)
  const { triggerSearchReopen, setTriggerSearchReopen, shouldReopenSearchOnReturn, setShouldReopenSearchOnReturn } = useOrderSidebarStore()

  // Derive open state synchronously so the sheet is open on the first render — no flash
  const isSearchOpen = userIsSearchOpen || triggerSearchReopen || (shouldReopenSearchOnReturn && pathname === "/")

  // Latch local state and clear store flags so the sheet stays open after flags are cleared
  useEffect(() => {
    if (triggerSearchReopen) {
      setUserIsSearchOpen(true)
      setTriggerSearchReopen(false)
    }
  }, [triggerSearchReopen, setTriggerSearchReopen])

  useEffect(() => {
    if (shouldReopenSearchOnReturn && pathname === "/") {
      setUserIsSearchOpen(true)
      setShouldReopenSearchOnReturn(false)
    }
  }, [shouldReopenSearchOnReturn, pathname, setShouldReopenSearchOnReturn])

  const isOrderDetailPage = pathname.match(/^\/orders\/[^/]+$/)
  const isAdFormPage = pathname === "/ads/create" || pathname.startsWith("/ads/edit/")
  // Hide header on advertiser page, order detail page, ad create/edit pages, wallet transaction list,
  // and when viewing chat on mobile. Using a CSS hidden class instead of a conditional return keeps
  // NovuBellLink in the same tree position on every render — React never remounts it, so its <Inbox>
  // session is never destroyed. A conditional return moves NovuBellLink to a different tree position,
  // causing unmount + remount and an extra /v1/inbox/session call on every navigation.
  const shouldHideHeader =
    pathname.startsWith("/advertiser") ||
    !!isOrderDetailPage ||
    isAdFormPage ||
    isTransactionListVisible ||
!!(isMobile && isOrderDetailPage && isChatVisible)

  const handleAskAmy = () => {
    track("ek_ask_amy_markets")
    if (window.Intercom) {
      window.Intercom("show")
    }
  }

  return (
    <>
      <header
        data-testid="header-container"
        className={cn(
          "relative z-20 flex justify-between items-center px-6 md:px-[24px] py-4 md:py-3 bg-slate-1200 -mb-px md:mb-0 h-14 md:h-auto",
          shouldHideHeader && "hidden",
          className,
        )}
        aria-hidden={shouldHideHeader ? true : undefined}
      >
        <div className="flex items-center md:hidden">
          <MobileSidebarTrigger data-testid="header-btn-mobile-sidebar" />
        </div>
        <Button
          data-testid="header-btn-ask-amy"
          onClick={handleAskAmy}
          aria-label={t("navigation.askAmy")}
          variant="ghost"
          className="absolute left-1/2 -translate-x-1/2 md:hidden p-0 hover:!bg-transparent [&:hover]:!opacity-80 [&:hover]:transition-opacity"
        >
          <Image src="/icons/ic-ask-amy-mobile.svg" alt={t("navigation.askAmy")} width={114} height={32} />
        </Button>

        <div className="flex items-center gap-2 shrink-0">
          {(pathname === "/" || pathname.startsWith("/advertiser")) && (
            <Button
              onClick={() => {
                guardP2PNavigation(isMaintenanceActive, () => {
                  track("ek_search_markets")
                  setUserIsSearchOpen(true)
                })
              }}
              variant="icon-muted"
              aria-label={t("common.search")}
              className="!bg-header-icon hover:!bg-header-icon"
            >
              <SearchIconWhite width={24} height={24} aria-hidden="true" />
            </Button>
          )}
          {userId && (
            <div data-testid="header-btn-notifications">
              <NovuBellLink
                className="!text-white"
                disabled={isMaintenanceActive}
                onClick={() => guardP2PNavigation(isMaintenanceActive, () => track("ek_notifications_markets"))}
              />
            </div>
          )}
        </div>
      </header>

      <MobileAdvertiserSearch isOpen={isSearchOpen} onClose={() => setUserIsSearchOpen(false)} />
    </>
  )
}
