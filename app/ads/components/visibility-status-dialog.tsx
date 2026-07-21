"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ModalHeaderRow } from "@/components/ui/modal-header-row"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTrackers } from "@/analytics/useTrackers"

interface VisibilityStatusDialogProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  reasons: string[]
  onActivateAd?: () => void
  onEditAd?: () => void
  onAddPaymentMethod?: () => void
  onContactSupport?: () => void
}

const getReasonContent = (reason: string, t: (key: string) => string) => {
  const reasonKeyMap: Record<string, string> = {
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

  const reasonKey = reasonKeyMap[reason]

  if (reasonKey) {
    return {
      title: t(`visibilityStatus.${reasonKey}.title`),
      description: t(`visibilityStatus.${reasonKey}.description`),
    }
  }

  return {
    title: reason,
    description: t("visibilityStatus.unknownReason"),
  }
}

const getReasonAction = (reason: string, t: (key: string) => string) => {
  const actionMap: Record<string, { label: string; action: string }> = {
    advert_inactive: { label: t("visibilityStatus.actions.activateAd"), action: "activate" },
    advert_remaining: { label: t("visibilityStatus.actions.editAd"), action: "edit" },
    advertiser_daily_limit: { label: t("visibilityStatus.actions.editAd"), action: "edit" },
    advertiser_balance: { label: t("visibilityStatus.actions.editAd"), action: "edit" },
    advertiser_adverts_unlisted: { label: t("visibilityStatus.actions.editAd"), action: "edit" },
    advertiser_status: { label: t("visibilityStatus.actions.contactSupport"), action: "close" },
    advertiser_schedule_unavailable: { label: t("visibilityStatus.actions.editSchedule"), action: "view_profile" },
    advertiser_temp_ban: { label: t("visibilityStatus.actions.viewProfile"), action: "close" },
    advertiser_no_private_groups: { label: t("visibilityStatus.actions.editAd"), action: "edit_ad_visibility" },
    advert_float_rate_disabled: { label: t("visibilityStatus.actions.editAd"), action: "edit" },
    advert_no_payment_methods: { label: t("visibilityStatus.actions.addPaymentMethod"), action: "add_payment" },
  }

  return actionMap[reason]
}

export function VisibilityStatusDialog({
  id,
  open,
  onOpenChange,
  reasons,
  onActivateAd,
}: VisibilityStatusDialogProps) {
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const { track } = useTrackers()

  const handleAction = (actionType: string) => {
    track("ek_visibility_primary_action_ad_visibility_sheet", { visibility_primary_action: actionType })
    switch (actionType) {
      case "activate":
        onActivateAd?.()
        onOpenChange(false)
        break
      case "edit":
      case "edit_schedule":
      case "edit_ad_visibility":
        router.push(`/ads/edit/${id}`)
        onOpenChange(false)
        break
      case "view_profile":
        onOpenChange(false)
        break
      default:
         onOpenChange(false)
    }
  }

  const content = (
    <div className="space-y-4">
      {reasons.includes("advertiser_no_private_groups") ? (
        <div className="mt-2">
          <p className="text-base text-grayscale-600">{getReasonContent("advertiser_no_private_groups", t).description}</p>
          <Button onClick={() => handleAction(getReasonAction("advertiser_no_private_groups", t).action)} className="w-full mt-8" variant="default">
            {getReasonAction("advertiser_no_private_groups", t).label}
          </Button>
        </div>
      ) : (
        <>
          {reasons.length > 1 && (
            <p className="text-base text-grayscale-600 mt-2">{t("myAds.visibilityStatusMultipleReasons")}</p>
          )}
          <ol className={cn("space-y-3", reasons.length > 1 ? "list-decimal pl-8" : "")}>
            {reasons.map((reason, index) => {
              const reasonContent = getReasonContent(reason, t)
              const actionInfo = getReasonAction(reason, t)

              return (
                <li key={index} className={cn("text-base text-grayscale-600", reasons.length > 1 ? "" : "flex flex-col")}>
                  <span>{reasonContent.description}</span>
                  {reasons.length == 1 && actionInfo && (
                    <Button onClick={() => handleAction(actionInfo.action)} className="w-full mt-8" variant="default">
                      {actionInfo.label}
                    </Button>
                  )}
                </li>
              )
            })}
          </ol>
          {reasons.length > 1 && (
            <Button
              onClick={() => {
                track("ek_visibility_secondary_action_ad_visibility_sheet", { visibility_secondary_action: "got_it" })
                onOpenChange(false)
              }}
              className="w-full mt-8"
              variant="default"
            >
              {t("common.gotIt")}
            </Button>
          )}
        </>
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
