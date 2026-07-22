"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ModalHeaderRow } from "@/components/ui/modal-header-row"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { TranslationParams } from "@/lib/i18n/translation-tree"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTrackers } from "@/analytics/useTrackers"
import { editAdPath, type MyAdsTab } from "@/lib/ads/my-ads-tab"
import type { Ad } from "@/types"

interface VisibilityStatusDialogProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  reasons: string[]
  ad?: Ad | null
  fromTab?: MyAdsTab
  onActivateAd?: () => void
}

const REASON_KEY_MAP: Record<string, string> = {
  advert_inactive: "advertInactive",
  advert_remaining: "advertRemaining",
  advertiser_daily_limit: "advertiserDailyLimit",
  advertiser_balance: "advertiserBalance",
  advertiser_adverts_unlisted: "advertiserAdvertsUnlisted",
  advertiser_status: "advertiserStatus",
  advertiser_schedule_unavailable: "advertiserScheduleUnavailable",
  advertiser_temp_ban: "advertiserTempBan",
  advertiser_no_private_groups: "advertiserNoPrivateGroups",
  advert_float_rate_disabled: "advertFloatRateDisabled",
  advert_no_payment_methods: "advertNoPaymentMethods",
}

function getReasonKey(reason: string): string | undefined {
  return REASON_KEY_MAP[reason]
}

function formatAmount(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return ""
  return value.toFixed(2)
}

function getShortReasonText(reason: string, t: (key: string, params?: TranslationParams) => string): string {
  const reasonKey = getReasonKey(reason)
  if (reasonKey) {
    return t(`visibilityStatus.${reasonKey}.shortDescription`)
  }
  return t("visibilityStatus.unknownReason")
}

function getFullBodyText(
  reason: string,
  t: (key: string, params?: TranslationParams) => string,
  ad?: Ad | null,
): string {
  const reasonKey = getReasonKey(reason)
  if (!reasonKey) {
    return t("visibilityStatus.unknownReason")
  }

  const currency = ad?.account_currency ?? ad?.available?.currency ?? ""

  switch (reason) {
    case "advert_remaining":
      return t(`visibilityStatus.${reasonKey}.description`, {
        remainingAmount: formatAmount(ad?.available_amount ?? ad?.available?.current),
        currency,
      })
    case "advertiser_balance":
      return t(`visibilityStatus.${reasonKey}.description`, {
        minOrderAmount: formatAmount(ad?.minimum_order_amount),
        currency,
      })
    default:
      return t(`visibilityStatus.${reasonKey}.description`)
  }
}

type CtaConfig = {
  primaryLabel: string
  primaryAction: string
  secondaryLabel?: string
  secondaryAction?: string
}

function getCtaConfig(reason: string, t: (key: string) => string, isMultiple: boolean): CtaConfig {
  if (isMultiple) {
    return {
      primaryLabel: t("common.gotIt"),
      primaryAction: "got_it",
    }
  }

  switch (reason) {
    case "advert_inactive":
      return {
        primaryLabel: t("visibilityStatus.actions.activateAd"),
        primaryAction: "activate",
      }
    case "advert_remaining":
    case "advertiser_balance":
    case "advertiser_no_private_groups":
    case "advert_float_rate_disabled":
      return {
        primaryLabel: t("visibilityStatus.actions.editAd"),
        primaryAction: "edit",
      }
    case "advert_no_payment_methods":
      return {
        primaryLabel: t("visibilityStatus.actions.addPaymentMethod"),
        primaryAction: "edit",
      }
    case "advertiser_daily_limit":
      return {
        primaryLabel: t("visibilityStatus.actions.editAd"),
        primaryAction: "edit",
        secondaryLabel: t("visibilityStatus.actions.waitForLimitReset"),
        secondaryAction: "wait_for_limit_reset",
      }
    case "advertiser_adverts_unlisted":
      return {
        primaryLabel: t("myAds.manageAds"),
        primaryAction: "manage_ads",
      }
    case "advertiser_status":
      return {
        primaryLabel: t("order.openLiveChat"),
        primaryAction: "open_live_chat",
        secondaryLabel: t("order.maybeLater"),
        secondaryAction: "maybe_later",
      }
    case "advertiser_schedule_unavailable":
      return {
        primaryLabel: t("visibilityStatus.actions.updateBusinessHours"),
        primaryAction: "update_business_hours",
      }
    case "advertiser_temp_ban":
      return {
        primaryLabel: t("order.viewProfile"),
        primaryAction: "view_profile",
        secondaryLabel: t("order.maybeLater"),
        secondaryAction: "maybe_later",
      }
    default:
      return {
        primaryLabel: t("order.openLiveChat"),
        primaryAction: "open_live_chat",
        secondaryLabel: t("order.maybeLater"),
        secondaryAction: "maybe_later",
      }
  }
}

function getPrimaryActionTrackingName(action: string): string {
  switch (action) {
    case "activate":
      return "activate_ad"
    case "edit":
      return "update_ad"
    case "open_live_chat":
      return "open_live_chat"
    case "manage_ads":
      return "manage_ads"
    case "update_business_hours":
      return "update_business_hours"
    case "view_profile":
      return "view_profile"
    case "got_it":
      return "got_it"
    default:
      return action
  }
}

function getSecondaryActionTrackingName(action: string): string {
  switch (action) {
    case "wait_for_limit_reset":
      return "wait_for_limit_reset"
    case "maybe_later":
      return "maybe_later"
    default:
      return action
  }
}

function openLiveChat(): void {
  window.Intercom?.("show")
}

export function VisibilityStatusDialog({
  id,
  open,
  onOpenChange,
  reasons,
  ad,
  fromTab,
  onActivateAd,
}: VisibilityStatusDialogProps) {
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const { track } = useTrackers()

  const isMultiple = reasons.length > 1
  const primaryReason = reasons[0] ?? ""
  const cta = getCtaConfig(primaryReason, t, isMultiple)

  const handleAction = (actionType: string, isSecondary = false) => {
    if (isSecondary) {
      track("ek_visibility_secondary_action_ad_visibility_sheet", {
        visibility_secondary_action: getSecondaryActionTrackingName(actionType),
      })
    } else {
      track("ek_visibility_primary_action_ad_visibility_sheet", {
        visibility_primary_action: getPrimaryActionTrackingName(actionType),
      })
    }

    switch (actionType) {
      case "activate":
        onActivateAd?.()
        onOpenChange(false)
        break
      case "edit":
        router.push(editAdPath(id, fromTab))
        onOpenChange(false)
        break
      case "open_live_chat":
        openLiveChat()
        onOpenChange(false)
        break
      case "manage_ads":
      case "wait_for_limit_reset":
      case "maybe_later":
      case "got_it":
        onOpenChange(false)
        break
      case "update_business_hours":
        router.push("/profile")
        onOpenChange(false)
        break
      case "view_profile":
        router.push("/profile")
        onOpenChange(false)
        break
      default:
        onOpenChange(false)
    }
  }

  const content = (
    <div className="space-y-4">
      {isMultiple ? (
        <>
          <p className="text-base text-grayscale-600 mt-2">{t("myAds.visibilityStatusMultipleReasons")}</p>
          <div className="space-y-3">
            {reasons.map((reason, index) => (
              <p key={`${reason}-${index}`} className="text-base text-grayscale-600">
                {index + 1}. {getShortReasonText(reason, t)}
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className={cn("text-base text-grayscale-600 mt-2 whitespace-pre-line")}>
          {getFullBodyText(primaryReason, t, ad)}
        </p>
      )}

      <Button
        onClick={() => handleAction(cta.primaryAction)}
        className="w-full mt-8"
        variant="default"
      >
        {cta.primaryLabel}
      </Button>

      {cta.secondaryLabel && cta.secondaryAction && (
        <Button
          onClick={() => handleAction(cta.secondaryAction!, true)}
          className="w-full"
          variant="outline"
        >
          {cta.secondaryLabel}
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent dir={dir}>
          <DrawerHeader className="text-start">
            <DrawerTitle className="font-bold text-2xl text-slate-1200 text-start">
              {t("myAds.visibilityStatus")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 text-start">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="sm:max-w-md sm:rounded-[32px] p-6">
        <ModalHeaderRow
          asDialog
          title={t("myAds.visibilityStatus")}
          onClose={() => onOpenChange(false)}
          closeAriaLabel={t("common.close")}
          className="mb-4"
        />
        <div className="text-start">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
