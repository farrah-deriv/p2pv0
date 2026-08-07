"use client"

import type React from "react"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

interface PanelWrapperProps {
  onBack?: () => void
  onClose: () => void
  children: React.ReactNode
}

export function PanelWrapper({ onBack, onClose, children }: PanelWrapperProps) {
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80" onClick={onClose} />
      <div
        className={`fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col ${isMobile ? "inset-0 w-full" : "w-full"
          }`}
      >
        <div dir={dir} className="max-w-xl mx-auto flex flex-col w-full h-full text-start">
          <div className={cn("flex items-center justify-end px-4 py-3 shrink-0", onBack && "justify-between")}>
            {onBack && <Button variant="icon-muted" onClick={onBack} className="!bg-neutral-100 hover:!bg-neutral-200">
              <BackArrowIcon alt={t("common.back")} width={24} height={24} />
            </Button>}
            <Button variant="icon-muted" onClick={onClose} aria-label={t("common.close")}>
              <StandaloneXmarkRegularIcon width={24} height={24} aria-hidden />
            </Button>
          </div>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
        </div>
      </div>
    </>
  )
}
