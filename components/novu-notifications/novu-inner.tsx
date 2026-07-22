"use client"

import { Inbox } from "@novu/nextjs"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"
import "../../styles/globals.css"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { useNovuSubscriber } from "@/hooks/use-novu-subscriber"

const NOTIFICATIONS = {
  applicationId: process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID,
}

const APPEARANCE_VARIABLES = {
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
}

const APPEARANCE_ELEMENTS = {
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
}

interface NovuNotificationsProps {
  disabled?: boolean
}

function NovuNotifications({ disabled = false }: NovuNotificationsProps) {
  const router = useRouter()
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const isMobile = useIsMobile()
  const applicationIdentifier = NOTIFICATIONS.applicationId
  const { t, locale } = useTranslations()
  const isDisabled = disabled || isMaintenanceActive

  const { subscriberHash, subscriberId, isLoading, error } = useNovuSubscriber(isDisabled)

  const appearance = useMemo(() => ({
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
    variables: APPEARANCE_VARIABLES,
    elements: APPEARANCE_ELEMENTS,
  }), [isMobile, t])

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

  if (isLoading) {
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
          className="relative inline-flex h-6 w-6 rounded-full bg-error-bg-secondary"
          title={error || t("notifications.loadFailed")}
        >
          <span className="sr-only">{t("notifications.error")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center static">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriber={subscriberId || ""}
        subscriberHash={subscriberHash}
        localization={{ "inbox.filters.labels.default": t("notifications.title") }}
        colorScheme="light"
        i18n={{ lang: locale, poweredBy: t("notifications.poweredBy") }}
        onNotificationClick={(notification) => {
          const data = notification.data as Record<string, unknown>
          if (typeof data?.order_id === "string") {
            router.push(`/orders/${data.order_id}`)
          }

          // FRAGILE: @novu/nextjs@3.17.0 exposes no imperative API to close the popover.
          // This dispatches a synthetic click on document.body to trigger Novu's
          // internal outside-click handler. It depends on the internal class
          // ".nv-popoverContent" and the body click-outside listener — both may
          // change in a future Novu version. If the popover stops auto-closing after
          // a notification click, check whether this class or the listener strategy
          // has changed in the installed @novu/nextjs version.
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

export default NovuNotifications
