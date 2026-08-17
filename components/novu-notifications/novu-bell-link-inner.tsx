"use client"

import { useState, useCallback } from "react"
import { Inbox, Bell, Notifications } from "@novu/nextjs"
import { useRouter } from "next/navigation"
import { StandaloneBellRegularIcon } from "@deriv/quill-icons/Standalone"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useNovuSubscriber } from "@/hooks/use-novu-subscriber"
import type { UnreadCount } from "@novu/nextjs"
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { cn } from "@/lib/utils"
import { NovuUnreadBadge } from "./novu-unread-badge"
import { renderNovuAvatarNull } from "./novu-utils"

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
  // Defense-in-depth only — CSS hide does NOT stop the browser from
  // requesting the avatar URL. The real guard is `renderAvatar` below.
  notificationImage: { display: "none" },
  preferences__button: { display: "none" },
}

const APPLICATION_ID = process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID!

interface NovuBellLinkInnerProps {
  disabled?: boolean
  onClick?: () => void
  className?: string
}

function NovuBellLinkInner({ disabled = false, onClick, className }: NovuBellLinkInnerProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const { subscriberHash, subscriberId, isLoading, error } = useNovuSubscriber(disabled)
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(() => {
    onClick?.()
    setOpen(true)
  }, [onClick])

  const renderBell = useCallback((unreadCount: UnreadCount) => (
    <span className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        aria-label={t("notifications.title")}
        className={cn("!flex !h-8 !w-8 !min-w-0 !min-h-0 !items-center !justify-center !rounded-full !bg-header-icon !p-0 hover:!bg-header-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300", className)}
      >
        <StandaloneBellRegularIcon width={24} height={24} fill="currentColor" aria-hidden="true" />
      </Button>
      <NovuUnreadBadge
        count={unreadCount.total}
        aria-label={t("notifications.unreadCountA11y", { count: unreadCount.total })}
      />
    </span>
  ), [handleClick, t, className])

  if (disabled) {
    return (
      <div
        className={cn("relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-header-icon opacity-50 pointer-events-none", className)}
        aria-hidden="true"
      >
        <StandaloneBellRegularIcon width={24} height={24} fill="currentColor" aria-hidden="true" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-header-icon", className)}>
        <span className="sr-only">{t("notifications.loading")}</span>
      </div>
    )
  }

  if (error || !subscriberHash || !subscriberId) {
    return (
      <div
        className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-header-icon", className)}
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
      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center">
        <Bell renderBell={renderBell} />
      </span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm" hideCloseButton>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <SheetClose asChild>
              <Button variant="icon-muted" className="!bg-black/[0.04] hover:!bg-black/[0.08]" aria-label={t("common.back")}>
                <BackArrowIcon aria-hidden="true" alt="" width={24} height={24} />
              </Button>
            </SheetClose>
            <SheetTitle className="sr-only">{t("notifications.title")}</SheetTitle>
          </div>
          <Notifications
            renderAvatar={renderNovuAvatarNull}
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
