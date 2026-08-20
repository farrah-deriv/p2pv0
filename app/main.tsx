"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MobileFooterNav from "@/components/mobile-footer-nav"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import { WebSocketProvider } from "@/contexts/websocket-context"
import * as AuthAPI from "@/services/api/api-auth"
import { useUserDataStore } from "@/stores/user-data-store"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { useOnboardingStatus } from "@/hooks/use-api-queries"
import { cn, getLoginUrl } from "@/lib/utils"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
import { LoadingIndicator } from "@/components/loading-indicator"
import { IntercomProvider } from "@/components/intercom-provider"
import { P2PAnnouncementController } from "@/components/p2p-announcement"
import { P2PSystemMaintenanceBanner } from "@/components/p2p-system-maintenance"
import { P2PMaintenanceController } from "@/components/p2p-maintenance-controller"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { shouldShowP2PMaintenanceBanner } from "@/lib/p2p-maintenance-constants"
import { shouldShowMobileFooterNav } from "@/lib/mobile-footer-nav"
import { useWalletViewStore } from "@/stores/wallet-view-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { P2PGuide } from "@/components/p2p-guide/p2p-guide"
import { P2PGuideIntro } from "@/components/p2p-guide/p2p-guide-intro"
import "./globals.css"

// Matches the vaul Drawer exit animation — the longest overlay fade in the
// app. Radix Dialog fades faster (~150ms), but the pending-flush effects below
// wait for the worst case so a leftover backdrop can't strand the next overlay
// (Ask Amy, the guide tour, or a queued intro) on top of it.
const OVERLAY_FADE_WAIT_MS = 500

export default function Main({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const setVerificationStatus = useUserDataStore((state) => state.setVerificationStatus)
  const setOnboardingStatus = useUserDataStore((state) => state.setOnboardingStatus)
  const userId = useUserDataStore((state) => state.userId)
  const { userData } = useUserDataStore()
  const { setIsWalletAccount } = useUserDataStore()
  const isOnboardingStatusRefreshing = useUserDataStore((state) => state.isOnboardingStatusRefreshing)
  const [isReady, setIsReady] = useState(false)
  const [onboardingProcessed, setOnboardingProcessed] = useState(false)
  // Set when we've decided to strip ?show_kyc_popup and open the guide intro
  // (brand-new user, or fully verified returning user). The render gate below
  // stays held until useSearchParams actually reflects the stripped URL, so
  // the page-level KYC auto-popup never fires on the stale searchParams value
  // that lingers for one render after router.replace before the hook updates.
  const [stripPending, setStripPending] = useState(false)
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { isChatVisible } = useChatVisibilityStore()
  const { isTransactionListVisible } = useWalletViewStore()
  const openIntro = useGuideStore((state) => state.openIntro)
  const pendingAskAmy = useGuideStore((state) => state.pendingAskAmy)
  const clearPendingAskAmy = useGuideStore((state) => state.clearPendingAskAmy)
  const isIntroOpen = useGuideStore((state) => state.isIntroOpen)
  const pendingStartGuideFromIntro = useGuideStore((state) => state.pendingStartGuideFromIntro)
  const clearPendingStartGuideFromIntro = useGuideStore((state) => state.clearPendingStartGuideFromIntro)
  const setPendingStartGuide = useGuideStore((state) => state.setPendingStartGuide)
  const pendingOpenIntro = useGuideStore((state) => state.pendingOpenIntro)
  const clearPendingOpenIntro = useGuideStore((state) => state.clearPendingOpenIntro)
  const startGuide = useGuideStore((state) => state.startGuide)
  const { hideAlert, isOpen: isAlertOpen } = useAlertDialog()
  const showMobileFooterNav = shouldShowMobileFooterNav(pathname, isChatVisible, isTransactionListVisible)
  const { data: onboardingStatus, isLoading: isOnboardingLoading } = useOnboardingStatus(
    isAuthenticated && !isMaintenanceActive,
  )

  const isDisabled = userData?.status === "disabled"

  const showMaintenanceBanner =
    isMaintenanceActive && shouldShowP2PMaintenanceBanner(pathname)

  useEffect(() => {
    const walletParam = searchParams.get("wallet")
    if (walletParam !== null) {
      setIsWalletAccount(walletParam === "true")
    }

  }, [searchParams, setIsWalletAccount])

  useEffect(() => {
    isMountedRef.current = true

    const PUBLIC_ROUTES = ["/login"]
    const isPublic = PUBLIC_ROUTES.includes(pathname)

    const fetchSessionData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        if (isMaintenanceActive && !isPublic) {
          setIsAuthenticated(true)
          return
        }

        const token = searchParams.get("token")
        if (token) {
          try {
            await AuthAPI.verifyToken(token)
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("token")
            window.history.replaceState({}, "", newUrl.toString())
          } catch (error) {
            if (!isPublic) {
              window.location.href = getLoginUrl(true)
            }
            return
          }
        }

        const sessionAuth = await AuthAPI.getSession()
        setIsAuthenticated(sessionAuth)

        if (abortController.signal.aborted || !isMountedRef.current) {
          return
        }

        if (!sessionAuth && !isPublic) {
          setIsHeaderVisible(false)
          window.location.href = getLoginUrl(useUserDataStore.getState().userData?.signup === "v1")
        } else if (sessionAuth && !useUserDataStore.getState().userData) {
          await AuthAPI.fetchUserIdAndStore()
        }
      } catch (error) {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return
        }
        console.error("Error fetching session data:", error)
      } finally {
        if (isMountedRef.current) {
          setIsReady(true)
        }
      }
    }

    fetchSessionData()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isMaintenanceActive, pathname, router, searchParams])

  useEffect(() => {
    // Maintenance skips onboarding entirely — nothing to decide, release the gate.
    if (isMaintenanceActive) {
      setOnboardingProcessed(true)
      return
    }
    if (!isAuthenticated || isOnboardingLoading || !onboardingStatus) {
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const processOnboardingData = async () => {
      try {
        const isPhoneVerified =
          onboardingStatus.p2p?.criteria?.find((c) => c.code === "phone_verified")?.passed || false
        const isKycVerified =
          onboardingStatus.kyc.poi_status === "approved" && onboardingStatus.kyc.poa_status === "approved"
        const isP2PAllowed = onboardingStatus.p2p?.allowed

        setVerificationStatus({
          phone_verified: isPhoneVerified,
          kyc_verified: isKycVerified,
          p2p_allowed: isP2PAllowed,
        })

        if (!isMounted || abortController.signal.aborted) {
          return
        }

        setOnboardingStatus(onboardingStatus)

        const currentUserId = useUserDataStore.getState().userId
        const isFullyVerified = Boolean(isP2PAllowed && isPhoneVerified && isKycVerified)

        // The guide intro is shown only to a newly registered P2P user (one
        // who has no P2P userId yet). Existing users never re-trigger it.
        // Open it *before* ensureP2PUser so the first paint after verification
        // is the intro, not a few-seconds-later second copy after the
        // create-user request returns. openIntro is once-per-session in the
        // store, so this re-run after ensureP2PUser is a no-op.
        if (!currentUserId && isP2PAllowed) {
          openIntro()

          await AuthAPI.ensureP2PUser()

          if (!isMounted || abortController.signal.aborted) {
            return
          }

          // Strip ?show_kyc_popup before releasing the render gate so the
          // page-level KYC auto-popup never fires (not even for a flash) —
          // the intro is the sole onboarding surface for a brand-new user.
          if (searchParams.get("show_kyc_popup") === "true") {
            const next = new URL(window.location.href)
            next.searchParams.delete("show_kyc_popup")
            setStripPending(true)
            router.replace(next.pathname + next.search, { scroll: false })
          }
        } else if (currentUserId && isFullyVerified && searchParams.get("show_kyc_popup") === "true") {
          // A returning, fully verified user arriving with ?show_kyc_popup:
          // verification is already complete, so the KYC onboarding popup must
          // not appear. Strip the param so the page-level KYC auto-popup never
          // fires, and surface the guide intro instead as the onboarding entry.
          const next = new URL(window.location.href)
          next.searchParams.delete("show_kyc_popup")
          setStripPending(true)
          router.replace(next.pathname + next.search, { scroll: false })

          openIntro()
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }
        console.error("Error processing onboarding data:", error)
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setOnboardingProcessed(true)
        }
      }
    }

    processOnboardingData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [isAuthenticated, isMaintenanceActive, onboardingStatus, isOnboardingLoading, setVerificationStatus, setOnboardingStatus, openIntro, searchParams, router])

  // Once router.replace has committed and useSearchParams no longer reports
  // show_kyc_popup, the gate has released (it short-circuits on the param) and
  // stripPending has done its job — clear it so it doesn't linger in memory.
  useEffect(() => {
    if (stripPending && searchParams.get("show_kyc_popup") !== "true") {
      setStripPending(false)
    }
  }, [stripPending, searchParams])

  // Ask Amy (Intercom messenger) is opened from Main — outside the intro's
  // Dialog/Drawer subtree — and only after that overlay has finished fading.
  // A single rAF (~16ms) is shorter than the intro fade (~150ms Dialog,
  // ~500ms Drawer), so Intercom used to open on top of a still-fading
  // backdrop. Closing livechat then left that leftover overlay on the page
  // (issue #1469). Wait out the fade before showing Intercom.
  useEffect(() => {
    // requestAskAmy() sets isIntroOpen=false and pendingAskAmy=true in one set,
    // so the two are never true simultaneously — pendingAskAmy implies the intro
    // is already dismissed. The isIntroOpen check is therefore a belt-and-
    // braces guard (and a contract assertion) rather than a reachable branch.
    if (!pendingAskAmy || isIntroOpen) return
    if (typeof window === "undefined") return

    const timeout = window.setTimeout(() => {
      clearPendingAskAmy()
      window.Intercom?.("show")
    }, OVERLAY_FADE_WAIT_MS)
    return () => window.clearTimeout(timeout)
  }, [pendingAskAmy, isIntroOpen, clearPendingAskAmy])

  // "Explore the marketplace" on the intro queues the markets tour via
  // requestStartGuide() (isIntroOpen=false + pendingStartGuideFromIntro=true
  // in one set). Starting the tour in that same tick mounted P2PGuide's
  // z-[60] overlay on top of the intro's still-fading portal, stranding a
  // backdrop so the tour's Next/Close CTAs could not be clicked. Wait out
  // the intro fade first. Off Markets the tour targets are not in the DOM,
  // so send the user to / and let Markets start the tour on mount.
  useEffect(() => {
    if (!pendingStartGuideFromIntro || isIntroOpen) return
    if (typeof window === "undefined") return

    const timeout = window.setTimeout(() => {
      if (pathname !== "/") {
        setPendingStartGuide(true)
        router.push("/")
      } else {
        startGuide("markets")
      }
      clearPendingStartGuideFromIntro()
    }, OVERLAY_FADE_WAIT_MS)
    return () => window.clearTimeout(timeout)
  }, [
    pendingStartGuideFromIntro,
    isIntroOpen,
    pathname,
    router,
    setPendingStartGuide,
    startGuide,
    clearPendingStartGuideFromIntro,
  ])

  // Create ad queues the intro (requestOpenIntro) when KYC is already
  // showing. Do not mount the intro until that AlertDialog has closed and
  // finished fading — opening it in the same tick stacks two DismissableLayers
  // and leaves the KYC overlay (bg-black/40, data-state="open") behind the
  // intro, then restores body pointer-events: none after both close.
  useEffect(() => {
    if (!pendingOpenIntro) return
    if (isAlertOpen) {
      hideAlert()
      return
    }
    if (typeof window === "undefined") return

    const timeout = window.setTimeout(() => {
      openIntro()
      clearPendingOpenIntro()
    }, OVERLAY_FADE_WAIT_MS)
    return () => window.clearTimeout(timeout)
  }, [pendingOpenIntro, isAlertOpen, hideAlert, openIntro, clearPendingOpenIntro])

  if (pathname === "/login") {
    return <div className="container mx-auto overflow-hidden max-w-7xl">{children}</div>
  }

  if (isDisabled) {
    return (
      <>
        <P2PAnnouncementController />
        <div className="hidden md:flex px-6 h-screen overflow-hidden m-auto relative max-w-[1232px]">
          {isHeaderVisible && <Sidebar className="hidden md:flex" />}
          <div className="flex-1 py-6">
            <div className="container mx-auto px-3">
              <P2PAccessRemoved />
            </div>
          </div>
        </div>
        <div className="md:hidden flex flex-col h-screen overflow-hidden">
          {isHeaderVisible && <Header className="flex-shrink-0" />}
          <main className="flex-1 overflow-hidden px-3">
            <P2PAccessRemoved />
          </main>
        </div>
      </>
    )
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  // Hold the app surface (and therefore the page-level ?show_kyc_popup auto-popup
  // effect) until Main has resolved the onboarding decision. This is what
  // prevents the KYC onboarding popup from flashing for a brand-new or fully
  // verified P2P user: once onboarding resolves, the strip branches delete the
  // param and open the intro before children ever mount. stripPending keeps the
  // gate held for the extra render it takes useSearchParams to reflect the
  // router.replace — without it, setOnboardingProcessed(true) would release the
  // gate one render early (while searchParams still carries show_kyc_popup) and
  // the page-level KYC auto-popup would fire on the stale value. For users who
  // genuinely need KYC, no strip happens and the gate releases so that popup can
  // show.
  const holdsForKycGate =
    searchParams.get("show_kyc_popup") === "true" &&
    isAuthenticated &&
    !isMaintenanceActive &&
    (!onboardingProcessed || stripPending)

  // P2PGuideIntro stays in the same parent slot across the KYC gate flip.
  // An early-return loader used to unmount it; after ensureP2PUser + the
  // ?show_kyc_popup strip, the shell remounted the Dialog/Drawer and Radix
  // re-animated the intro a few seconds later — the second post-verification
  // intro. Keeping one instance means the gate flip never remounts it.
  return (
    <>
      {holdsForKycGate ? (
        <div className="h-screen flex items-center justify-center">
          <LoadingIndicator />
        </div>
      ) : (
        <WebSocketProvider>
          {isOnboardingStatusRefreshing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <LoadingIndicator />
            </div>
          )}
          {process.env.NEXT_PUBLIC_INTERCOM_APP_ID && (
            <IntercomProvider appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID} />
          )}
          <P2PMaintenanceController />
          <P2PAnnouncementController />
          <div className="hidden md:flex px-6 h-screen overflow-hidden m-auto relative max-w-[1232px]">
            {isHeaderVisible && <Sidebar className="hidden md:flex" />}
            <div className="flex flex-1 flex-col min-h-0 py-6 overflow-hidden">
              <div className="container mx-auto flex flex-1 flex-col min-h-0 h-full">
                {showMaintenanceBanner && (
                  <div className="relative z-0 md:-mb-8 md:px-3 flex-shrink-0">
                    <P2PSystemMaintenanceBanner />
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
          <div className="md:hidden flex flex-col h-dvh overflow-hidden">
            {showMaintenanceBanner && <P2PSystemMaintenanceBanner embeddedInDarkHeader />}
            {isHeaderVisible && <Header className="flex-shrink-0" />}
            <main
              className={cn(
                "flex flex-col flex-1 min-h-0 w-full",
                pathname.startsWith("/profile") ? "overflow-y-auto overscroll-y-none" : "overflow-hidden",
              )}
            >
              {children}
            </main>
            {showMobileFooterNav && (
              <MobileFooterNav className="flex-shrink-0" />
            )}
          </div>
          <P2PGuide />
        </WebSocketProvider>
      )}
      <P2PGuideIntro />
    </>
  )
}
