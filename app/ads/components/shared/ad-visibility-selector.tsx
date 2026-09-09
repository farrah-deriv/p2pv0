"use client"

import { useTranslations } from "@/lib/i18n/use-translations"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import ClosedGroupTab from "@/app/profile/components/closed-group"
interface AdVisibilitySelectorProps {
  value: string
  onValueChange: (value: string) => void
  onEditClosedGroup?: () => void
  closedGroupDisabled?: boolean
}

export default function AdVisibilitySelector({ value, onValueChange, onEditClosedGroup, closedGroupDisabled = false }: AdVisibilitySelectorProps) {
  const { t } = useTranslations()
  const { showAlert } = useAdvertAlertDialog()

  const handleEditListClick = () => {
    showAlert({
      title: t("adForm.closedGroup"),
      content: <ClosedGroupTab isInAlert={true} />,
    })
    onEditClosedGroup?.()
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
    >
      <Label
        htmlFor="everyone"
        data-testid="ad-form-radio-visibility-everyone"
        className={`font-normal flex items-center justify-between p-4 gap-4 rounded-lg border cursor-pointer transition-colors bg-grayscale-500 ${value === "everyone"
          ? "border-black"
          : "border-grayscale-500"}`}
      >
        <Image src="/icons/global.svg" alt={t("adForm.visibilityEveryone")} width={32} height={32} />
        <div className="text-start flex-1">
          <div className="text-base mb-1 text-slate-1200">{t("adForm.visibilityEveryone")}</div>
          <div className="text-xs text-grayscale-text-muted">
            {t("adForm.visibilityEveryoneDesc")}
          </div>
        </div>
        <RadioGroupItem value="everyone" id="everyone" className="hidden mt-1 ms-4 h-6 w-6" />
      </Label>

      <Label
          htmlFor="closed-group"
          data-testid="ad-form-radio-visibility-closed-group"
          className={`font-normal flex items-center justify-between p-4 gap-4 rounded-lg border transition-colors bg-grayscale-500 ${value === "closed-group" ? "border-black" : "border-grayscale-500"} ${closedGroupDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
        >
          <Image src="/icons/closed-group.svg" alt={t("adForm.visibilityClosedGroup")} width={32} height={32} />
          <div className="text-start flex-1">
            <div className="text-base text-slate-1200 mb-1">{t("adForm.visibilityClosedGroup")}</div>
            <div className="text-xs text-grayscale-text-muted">
              {t("adForm.visibilityClosedGroupDesc")}{" "}
              {!closedGroupDisabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditListClick()
                  }}
                  className="font-normal p-0 h-auto text-xs text-grayscale-text-muted underline hover:opacity-100 hover:bg-transparent"
                >
                  {t("adForm.editList")}
                </Button>
              )}
            </div>
          </div>
          <RadioGroupItem value="closed-group" id="closed-group" disabled={closedGroupDisabled} className="hidden mt-1 ms-4 h-6 w-6" />
        </Label>
    </RadioGroup>
  )
}
