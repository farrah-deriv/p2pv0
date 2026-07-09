"use client"

import { Inbox } from "@novu/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { getCoreUrl } from "@/lib/get-core-url"
import "../../styles/globals.css"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { p2pFetch } from "@/services/api/p2p-fetch"

const API = {
  notificationUrl: `${getCoreUrl()}/notifications/v1`,
}

const AUTH = {
  getNotificationHeader: () => ({
    "Content-Type": "application/json",
  }),
}

const NOTIFICATIONS = {
  applicationId: process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID,
}

async function fetchSubscriberHash() {
  try {
    const url = `${API.notificationUrl}/hash`
    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers: AUTH.getNotificationHeader(),
    })
    if (!response.ok) throw new Error(`Failed to fetch subscriber hash: ${response.status}`)
    const responseData = await response.json()
    const subscriberData = responseData.data?.subscriber || responseData.subscriber
    if (!subscriberData) throw new Error("Invalid response structure: missing subscriber data")
    return {
      subscriberHash: subscriberData.subscriberHash,
      subscriberId: subscriberData.subscriberId,
    }
  } catch (error) {
    return null
  }
}

interface NovuNotificationsProps {
  disabled?: boolean
}

export function NovuNotifications({ disabled = false }: NovuNotificationsProps) {
  const router = useRouter()
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const [mounted, setMounted] = useState(false)
  const [subscriberHash, setSubscriberHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscriberId, setSubscriberId] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const userId = useUserDataStore((state) => state.userId)
  const userIdFallback = userId || ""
  const applicationIdentifier = NOTIFICATIONS.applicationId
  const { t, locale } = useTranslations()
  const isDisabled = disabled || isMaintenanceActive

  useEffect(() => {
    setMounted(true)
  }, [])

  const appearance = {
    icons: {
      bell: () => (
        <Image
          src={isMobile ? "/icons/bell-sm.png" : "/icons/bell-desktop.png"}
          alt={t("notifications.title")}
          width={24}
          height={24}
          style={{ width: "24px", height: "24px", minWidth: "24px", minHeight: "24px" }}
        />
      ),
    },
    variables: {
      borderRadius: "8px",
      fontSize: "16px",
      colorShadow: "rgba(0, 0, 0, 0.1)",
      colorNeutral: "#1A1523",
      colorCounterForeground: "#ffffff",
      colorCounter: "#FF444F",
      colorSecondaryForeground: "#1A1523",
      colorPrimaryForeground: "#ffffff",
      colorPrimary: "#FF444F",
      colorForeground: "#181C25",
      colorBackground: "#ffffff",
    },
    elements: {
      "inbox__popoverTrigger": {
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        padding: 0,
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      bellIcon: {
        width: "24px",
        height: "24px",
        minWidth: "24px",
        minHeight: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      },
      bellDot: {
        top: "0px",
        right: "0px",
        width: "8px",
        height: "8px",
        border: "none",
      },
      notificationImage: { display: "none" },
      preferences__button: { display: "none" },
      "inbox__popoverContent": "novu-popover-content",
    },
  }

  useEffect(() => {
    if (isDisabled) {
      setIsLoading(false)
      return
    }

    if (!userIdFallback) {
      setError("No user ID available")
      setIsLoading(false)
      return
    }

    const getSubscriberHash = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchSubscriberHash()
        if (result) {
          setSubscriberHash(result.subscriberHash)
          setSubscriberId(result.subscriberId)
        } else {
          setError("Failed to retrieve subscriber data")
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    getSubscriberHash()
  }, [isDisabled, userIdFallback])

  if (isDisabled) {
    return (
      <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full opacity-50 pointer-events-none" aria-hidden="true">
        <Image
          src={isMobile ? "/icons/bell-sm.png" : "/icons/bell-desktop.png"}
          alt=""
          width={24}
          height={24}
        />
      </div>
    )
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <div className="relative inline-flex h-6 w-6 rounded-full bg-yellow-100">
          <span className="sr-only">{t("notifications.loading")}</span>
        </div>
      </div>
    )
  }

  if (error || !subscriberHash || !subscriberId) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <div
          className="relative inline-flex h-6 w-6 rounded-full bg-red-100"
          title={error || t("notifications.loadFailed")}
        >
          <span className="sr-only">{t("notifications.error")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center" style={{ position: "static" }}>
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriber={subscriberId || ""}
        subscriberHash={subscriberHash}
        localization={{ "inbox.filters.labels.default": t("notifications.title") }}
        colorScheme="light"
        i18n={{ lang: locale, poweredBy: t("notifications.poweredBy") }}
        onNotificationClick={(notification) => {
          if (notification.data?.order_id) {
            router.push(`/orders/${notification.data.order_id}`)
          }

          setTimeout(() => {
            const inboxElement = document.querySelector(".nv-popoverContent") as HTMLElement
            if (inboxElement) {
              const clickOutsideEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              })
              document.body.dispatchEvent(clickOutsideEvent)
            }
          }, 100)
        }}
        placement={isMobile ? "bottom-start" : "bottom-end"}
        appearance={appearance}
        styles={{
          bell: { root: { background: "transparent", color: "black" } },
          popover: { root: { zIndex: 9999 } },
        }}
      />
    </div>
  )
}
