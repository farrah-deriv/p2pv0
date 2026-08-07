"use client"

import Image from "next/image"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { cn } from "@/lib/utils"

function openLiveChat(): void {
  window.Intercom?.("show")
}

interface P2PSystemMaintenanceBannerProps {
  embeddedInDarkHeader?: boolean
}

export function P2PSystemMaintenanceBanner({
  embeddedInDarkHeader = false,
}: P2PSystemMaintenanceBannerProps) {
  const { t } = useTranslations()
  const { isActive } = useP2PSystemMaintenance()

  if (!isActive) return null

  const title = t("maintenance.title")
  const prefix = t("maintenance.descriptionPrefix")
  const linkLabel = t("maintenance.liveChatLink")
  const suffix = t("maintenance.descriptionSuffix")

  return (
    <Alert
      data-testid="maintenance-banner"
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3 rounded-none border-transparent px-4 pt-4 pb-4 md:flex-row md:items-center md:gap-4 md:rounded-2xl md:px-6 md:pt-6 md:pb-12",
        embeddedInDarkHeader
          ? "bg-warning-bg-dark text-white md:bg-warning-bg md:text-grayscale-100"
          : "bg-warning-bg text-grayscale-100",
      )}
    >
      <div className="flex items-start gap-3 md:flex-1 md:items-center md:gap-4">
        <Image
          src="/icons/ad-warning.svg"
          alt=""
          height={24}
          width={24}
          className="flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-sm font-bold leading-tight">{title}</div>
          <p
            className={cn(
              "text-sm leading-snug",
              embeddedInDarkHeader ? "text-white/70 md:text-grayscale-600" : "text-grayscale-600",
            )}
          >
            {prefix}
            <Button
              type="button"
              variant="ghost"
              data-testid="maintenance-link-livechat"
              onClick={openLiveChat}
              className={cn(
                "font-bold underline underline-offset-2 !p-0 !h-auto inline",
                embeddedInDarkHeader ? "text-white md:text-grayscale-100" : "text-grayscale-100",
              )}
              aria-label={linkLabel}
            >
              {linkLabel}
            </Button>
            {suffix}
          </p>
        </div>
      </div>
    </Alert>
  )
}
