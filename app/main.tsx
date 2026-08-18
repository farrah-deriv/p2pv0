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
import { P2PGuide } from "@/components/p2p-guide/p2p-guide"
import { P2PGuideIntro } from "@/components/p2p-guide/p2p-guide-intro"
import "./globals.css"

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
        if (!currentUserId && isP2PAllowed) {
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

          openIntro()
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

  if (holdsForKycGate) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  return (
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
      <P2PGuideIntro />
    </WebSocketProvider>
  )
}
