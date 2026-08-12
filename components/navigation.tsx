"use client"

import { useRouter } from "next/navigation"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { StandaloneXmarkFillIcon } from "@deriv/quill-icons/Standalone"
import { NovuBellLink } from "@/components/novu-notifications"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NavigationProps {
  className?: string
  isBackBtnVisible?: boolean
  isVisible?: boolean
  onBack?: () => void
  onClose?: () => void
  onGuide?: () => void
  redirectUrl?: string
  title: string
  /** Larger left-aligned title (create/edit ad wizard matches mobile headingLarge ~24px). */
  largeTitle?: boolean
  showNotificationIcon?: boolean
}

export default function Navigation({
  className = "",
  isBackBtnVisible = true,
  isVisible = true,
  onBack,
  onClose,
  onGuide,
  redirectUrl = "/",
  title,
  largeTitle = false,
  showNotificationIcon = false,
}: NavigationProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const titleClassName = cn(
    "font-bold text-start text-slate-1200",
    largeTitle ? "text-2xl leading-8" : "text-xl",
  )

  const getHeaderComponent = () => {
    if (isBackBtnVisible) {
      if (onBack && onClose) {
        return (
          <div className="flex items-center gap-3 w-full">
            <Button variant="icon-muted" onClick={onBack} aria-label={t("common.back")}>
              <BackArrowIcon alt="" width={24} height={24} aria-hidden />
            </Button>
            <h1 className={cn(titleClassName, "min-w-0 flex-1")}>{title}</h1>
            {onGuide && (
              <Button variant="icon-muted" onClick={onGuide} aria-label={t("guideIntro.openGuide")}>
                <Image src="/icons/ic-ad-guide.svg" alt="" width={20} height={20} aria-hidden />
              </Button>
            )}
            <Button variant="icon-muted" onClick={onClose} aria-label={t("common.close")} data-testid="ad-form-btn-close">
              <StandaloneXmarkFillIcon width={24} height={24} aria-hidden />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="icon-muted"
                onClick={() => router.push(redirectUrl)}
                aria-label={t("common.back")}
              >
                <BackArrowIcon alt="" width={24} height={24} aria-hidden />
              </Button>
              <h1 className={titleClassName}>{title}</h1>
            </div>
            {showNotificationIcon && (
              <NovuBellLink className="!text-white" />
            )}
          </div>
        )
      }
    }

    return (
      <>
        <h1 className={cn(titleClassName, "flex-1 min-w-0")}>{title}</h1>
        {onGuide && (
          <Button variant="icon-muted" onClick={onGuide} aria-label={t("guideIntro.openGuide")} className="me-2">
            <Image src="/icons/ic-ad-guide.svg" alt="" width={20} height={20} aria-hidden />
          </Button>
        )}
        <Button
          variant="icon-muted"
          onClick={() => {
            if (onClose) {
              onClose()
            } else {
              router.push(redirectUrl)
            }
          }}
          aria-label={t("common.close")}
          data-testid="ad-form-btn-close"
        >
          <StandaloneXmarkFillIcon width={24} height={24} aria-hidden />
        </Button>
      </>
    )
  }

  return (
    <div
      className={cn(
        "py-[12px] px-[16px] md:py-[4px] md:border-0 md:px-[24px]",
        showNotificationIcon && "bg-slate-1200 pr-[14px]",
        className,
      )}
    >
      <div className="flex items-center justify-between md:px-0">{getHeaderComponent()}</div>
    </div>
  )
}
