"use client"

import { useRouter } from "next/navigation"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { StandaloneXmarkFillIcon } from "@deriv/quill-icons/Standalone"
import { NovuBellLink } from "@/components/novu-notifications"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

interface NavigationProps {
  className?: string
  isBackBtnVisible?: boolean
  isVisible?: boolean
  onBack?: () => void
  onClose?: () => void
  redirectUrl?: string
  title: string
  showNotificationIcon?: boolean
}

export default function Navigation({
  className = "",
  isBackBtnVisible = true,
  isVisible = true,
  onBack,
  onClose,
  redirectUrl = "/",
  title,
  showNotificationIcon = false,
}: NavigationProps) {
  const router = useRouter()
  const { t } = useTranslations()

  const getHeaderComponent = () => {
    if (isBackBtnVisible) {
      if (onBack && onClose) {
        return (
          <div className="flex items-center gap-4 w-full justify-between">
            <Button variant="icon-muted" onClick={onBack} className="!bg-neutral-100 hover:!bg-neutral-200">
              <BackArrowIcon alt={t("common.back")} width={24} height={24} />
            </Button>
            <h1 className="text-xl font-bold">{title}</h1>
            <Button variant="icon-muted" onClick={onClose} aria-label={t("common.close")} data-testid="ad-form-btn-close">
              <StandaloneXmarkFillIcon width={24} height={24} aria-hidden />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="icon-muted"
                onClick={() => router.push(redirectUrl)}
                className="!bg-neutral-100 hover:!bg-neutral-200"
              >
                <BackArrowIcon alt={t("common.back")} width={24} height={24} />
              </Button>
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            {showNotificationIcon && (
              <div className="text-slate-600 hover:text-slate-700">
                <NovuBellLink />
              </div>
            )}
          </div>
        )
      }
    }

    return (
      <>
        <h1 className="text-xl font-bold">{title}</h1>
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
