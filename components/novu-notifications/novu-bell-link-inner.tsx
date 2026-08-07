"use client"

import { useState, useCallback } from "react"
import { Inbox, Bell, Notifications } from "@novu/nextjs"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useNovuSubscriber } from "@/hooks/use-novu-subscriber"
import type { UnreadCount } from "@novu/nextjs"
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"

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
  notificationImage: { display: "none" },
  preferences__button: { display: "none" },
}

const APPLICATION_ID = process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID!

interface NovuBellLinkInnerProps {
  disabled?: boolean
  onClick?: () => void
}

function NovuBellLinkInner({ disabled = false, onClick }: NovuBellLinkInnerProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const { subscriberHash, subscriberId, isLoading, error } = useNovuSubscriber(disabled)
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(() => {
    onClick?.()
    setOpen(true)
  }, [onClick])

  const renderBell = useCallback((unreadCount: UnreadCount) => (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      aria-label={t("notifications.title")}
      className="relative flex h-8 w-8 min-w-0 min-h-0 items-center justify-center rounded-full bg-header-icon p-0 hover:!bg-header-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      <Image
        src={isMobile ? "/icons/bell-sm.png" : "/icons/bell-desktop.png"}
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        style={{ width: "24px", height: "24px" }}
      />
      {unreadCount.total > 0 && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-notification-badge" aria-hidden="true" />
      )}
    </Button>
  ), [handleClick, isMobile, t])

  if (disabled) {
    return (
      <div
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-header-icon opacity-50 pointer-events-none"
        aria-hidden="true"
      >
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
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-header-icon">
        <span className="sr-only">{t("notifications.loading")}</span>
      </div>
    )
  }

  if (error || !subscriberHash || !subscriberId) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-header-icon"
        title={error || t("notifications.loadFailed")}
      >
        <span className="sr-only">{t("notifications.error")}</span>
      </div>
    )
  }

  return (
    <Inbox
      applicationIdentifier={APPLICATION_ID}
      subscriber={subscriberId}
      subscriberHash={subscriberHash}
      localization={{ "inbox.filters.labels.default": t("notifications.title") }}
      colorScheme="light"
      appearance={{ variables: APPEARANCE_VARIABLES, elements: APPEARANCE_ELEMENTS }}
    >
      <Bell renderBell={renderBell} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm" hideCloseButton>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <SheetClose asChild>
              <Button variant="icon-muted" size="sm" className="px-1" aria-label={t("common.back")}>
                <BackArrowIcon aria-hidden="true" alt="" width={24} height={24} />
              </Button>
            </SheetClose>
            <SheetTitle className="sr-only">{t("notifications.title")}</SheetTitle>
          </div>
          <Notifications
            onNotificationClick={(notification) => {
              setOpen(false)
              const data = notification.data as Record<string, unknown>
              if (typeof data?.order_id === "string") {
                router.push(`/orders/${data.order_id}`)
              }
            }}
          />
        </SheetContent>
      </Sheet>
    </Inbox>
  )
}

export default NovuBellLinkInner
