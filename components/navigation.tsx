"use client"

import { useRouter } from "next/navigation"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import Image from "next/image"
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
            <Button variant="ghost" onClick={onBack} size="sm" className="bg-grayscale-300 px-1">
              <BackArrowIcon alt={t("common.back")} width={24} height={24} />
            </Button>
            <h1 className="text-xl font-bold">{title}</h1>
            <Button variant="ghost" onClick={onClose} size="sm" className="bg-grayscale-300 px-1" data-testid="ad-form-btn-close">
              <Image src="/icons/close-circle.png" alt={t("common.close")} width={24} height={24} />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push(redirectUrl)}
                size="sm"
                className="bg-grayscale-300 px-1"
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
          variant="ghost"
          onClick={() => {
            if (onClose) {
              onClose()
            } else {
              router.push(redirectUrl)
            }
          }}
          size="sm"
          className="bg-grayscale-300 px-1"
          data-testid="ad-form-btn-close"
        >
          <Image src="/icons/close-circle.png" alt={t("common.close")} width={24} height={24} />
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
