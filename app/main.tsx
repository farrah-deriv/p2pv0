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
import { P2PBalanceWarning } from "@/components/p2p-balance-warning"
import { P2PSystemMaintenanceBanner } from "@/components/p2p-system-maintenance"
import { P2PMaintenanceController } from "@/components/p2p-maintenance-controller"
import { useOnboardingGate } from "@/hooks/use-onboarding-gate"
import { useP2PBalanceWarning } from "@/hooks/use-p2p-balance-warning"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { shouldShowP2PMaintenanceBanner } from "@/lib/p2p-maintenance-constants"
import { shouldShowMobileFooterNav } from "@/lib/mobile-footer-nav"
import { useWalletViewStore } from "@/stores/wallet-view-store"
import { useGuideStore } from "@/stores/guide-store"
import { P2PGuide } from "@/components/p2p-guide/p2p-guide"
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
  const [isReady, setIsReady] = useState(false)
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { isChatVisible } = useChatVisibilityStore()
  const { isTransactionListVisible } = useWalletViewStore()
  const showMobileFooterNav = shouldShowMobileFooterNav(pathname, isChatVisible, isTransactionListVisible)
  const { data: onboardingStatus, isLoading: isOnboardingLoading } = useOnboardingStatus(
    isAuthenticated && !isMaintenanceActive,
  )

  const isDisabled = userData?.status === "disabled"

  const balanceAmount = userData?.balances?.amount
  const isV2User = userData?.signup === "v2"
  const { isFullyOnboarded } = useOnboardingGate()
  const { shouldShow: shouldShowBalanceWarning } = useP2PBalanceWarning(balanceAmount, isFullyOnboarded, isV2User)
  const isMarketsPage = pathname === "/"
  const showBalanceWarning = isMarketsPage && shouldShowBalanceWarning && !isMaintenanceActive
  const showMaintenanceBanner =
    isMaintenanceActive && shouldShowP2PMaintenanceBanner(pathname)

  const hasSeenGuide = useGuideStore((state) => state.hasSeenGuide)
  const advertsSettled = useGuideStore((state) => state.advertsSettled)
  const startGuide = useGuideStore((state) => state.startGuide)

  useEffect(() => {
    if (isMarketsPage && isReady && isAuthenticated && !hasSeenGuide && !isMaintenanceActive && advertsSettled) {
      startGuide()
    }
  }, [isMarketsPage, isReady, isAuthenticated, hasSeenGuide, isMaintenanceActive, advertsSettled, startGuide])

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
    if (isMaintenanceActive || !isAuthenticated || isOnboardingLoading || !onboardingStatus) {
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const processOnboardingData = async () => {
      try {
        setVerificationStatus({
          phone_verified: onboardingStatus.p2p?.criteria?.find((c) => c.code === "phone_verified")?.passed || false,
          kyc_verified:
            onboardingStatus.kyc.poi_status === "approved" && onboardingStatus.kyc.poa_status === "approved",
          p2p_allowed: onboardingStatus.p2p?.allowed,
        })

        if (!isMounted || abortController.signal.aborted) {
          return
        }

        setOnboardingStatus(onboardingStatus)

        const currentUserId = useUserDataStore.getState().userId
        if (!currentUserId && onboardingStatus.p2p?.allowed) {
          await AuthAPI.createP2PUser()

          if (!isMounted || abortController.signal.aborted) {
            return
          }

          await AuthAPI.fetchUserIdAndStore()
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }
        console.error("Error processing onboarding data:", error)
      }
    }

    processOnboardingData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [isAuthenticated, isMaintenanceActive, onboardingStatus, isOnboardingLoading, setVerificationStatus, setOnboardingStatus])

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

  return (
    <WebSocketProvider>
      {process.env.NEXT_PUBLIC_INTERCOM_APP_ID && (
        <IntercomProvider appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID} />
      )}
      <P2PMaintenanceController />
      <P2PAnnouncementController />
      <div className="hidden md:flex px-6 h-screen overflow-hidden m-auto relative max-w-[1232px]">
        {isHeaderVisible && <Sidebar className="hidden md:flex" />}
        <div className="flex-1 py-6">
          <div className="container mx-auto">
            {showMaintenanceBanner && (
              <div className="relative z-0 md:-mb-8 md:px-3">
                <P2PSystemMaintenanceBanner />
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
      <div className="md:hidden flex flex-col h-dvh overflow-hidden">
        {showMaintenanceBanner && <P2PSystemMaintenanceBanner embeddedInDarkHeader />}
        {showBalanceWarning && <P2PBalanceWarning />}
        {isHeaderVisible && <Header className="flex-shrink-0" />}
        <main
          className={cn(
            "flex flex-col flex-1 min-h-0",
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
  )
}
