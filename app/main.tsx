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
import { getLoginUrl } from "@/lib/utils"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
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
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const setVerificationStatus = useUserDataStore((state) => state.setVerificationStatus)
  const setOnboardingStatus = useUserDataStore((state) => state.setOnboardingStatus)
  const userId = useUserDataStore((state) => state.userId)
  const { userData } = useUserDataStore()
  const { setIsWalletAccount } = useUserDataStore()

  const isDisabled = userData?.status === "disabled"

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

        const isAuthenticated = await AuthAPI.getSession()

        if (abortController.signal.aborted || !isMountedRef.current) {
          return
        }

        if (!isAuthenticated && !isPublic) {
          setIsHeaderVisible(false)
          window.location.href = getLoginUrl(userData?.signup === "v1")
        } else if (isAuthenticated) {
          const userIdResult = await AuthAPI.fetchUserIdAndStore()

          if (abortController.signal.aborted || !isMountedRef.current) {
            return
          }

          try {
            const onboardingStatus = await AuthAPI.getOnboardingStatus()

            if (isMountedRef.current && !abortController.signal.aborted) {
              setVerificationStatus({
                email_verified: onboardingStatus.verification.email_verified,
                phone_verified: onboardingStatus.verification.phone_verified,
                kyc_verified:
                  onboardingStatus.kyc.poi_status === "approved" && onboardingStatus.kyc.poa_status === "approved",
                p2p_allowed: onboardingStatus.p2p?.allowed,
              })

              setOnboardingStatus(onboardingStatus)

              const currentUserId = useUserDataStore.getState().userId
              if (!currentUserId && onboardingStatus.p2p?.allowed) {
                try {
                  await AuthAPI.createP2PUser()
                  await AuthAPI.fetchUserIdAndStore()
                } catch (error) {
                  console.error("Error creating P2P user:", error)
                }
              }

              if (isMountedRef.current && !abortController.signal.aborted) {
                router.push(pathname)
              }
            }
          } catch (error) {
            console.error("Error fetching onboarding status:", error)
            if (isMountedRef.current && !abortController.signal.aborted) {
              router.push(pathname)
            }
          }
        }
      } catch (error) {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return
        }
        console.error("Error fetching session data:", error)
      }
    }

    fetchSessionData()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [pathname, router, searchParams, setVerificationStatus, setOnboardingStatus])

  if (pathname === "/login") {
    return <div className="container mx-auto overflow-hidden max-w-7xl">{children}</div>
  }

  if (isDisabled) {
    return (
      <>
        <div className="hidden md:flex p-6 h-screen overflow-hidden m-auto relative max-w-[1232px]">
          {isHeaderVisible && <Sidebar className="hidden md:flex" />}
          <div className="flex-1">
            <div className="container mx-auto px-3">
              <P2PAccessRemoved />
            </div>
          </div>
        </div>
        <div className="md:hidden container mx-auto h-[calc(100%-2rem)] relative">
          {isHeaderVisible && <Header className="flex-shrink-0" />}
          <main className="flex-1 overflow-hidden px-3">
            <P2PAccessRemoved />
          </main>
        </div>
      </>
    )
  }

  return (
    <WebSocketProvider>
      <div className="hidden md:flex p-6 h-screen overflow-hidden m-auto relative max-w-[1232px]">
        {isHeaderVisible && <Sidebar className="hidden md:flex" />}
        <div className="flex-1">
          <div className="container mx-auto">{children}</div>
        </div>
      </div>
      <div className="md:hidden container mx-auto h-[calc(100%-2rem)] relative">
        {isHeaderVisible && <Header className="flex-shrink-0" />}
        <main className="flex-1 overflow-hidden">{children}</main>
        <MobileFooterNav className="flex-shrink-0" />
      </div>
    </WebSocketProvider>
  )
}
