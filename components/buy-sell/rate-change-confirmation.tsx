"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { buildRateChangeCopyParams } from "@/lib/buy-sell/rate-change-copy"
import { useTranslations } from "@/lib/i18n/use-translations"

interface RateChangeConfirmationProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  amount: string
  accountCurrency: string
  paymentCurrency: string
  oldRate: number
  newRate: number
  isBuy: boolean
}

export default function RateChangeConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  accountCurrency,
  paymentCurrency,
  oldRate,
  newRate,
  isBuy,
}: RateChangeConfirmationProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslations()

  const rateChangeCopy = buildRateChangeCopyParams({ amount, oldRate, newRate })
  const buySellLabel = isBuy ? "selling" : "buying"

  const content = (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <p className="text-grayscale-100 text-base">
          {t("order.rateChangeIntro")}
        </p>
        <p className="text-grayscale-100 text-base">
          {t("order.rateChangeDetails", {
            action: buySellLabel,
            amount,
            accountCurrency,
            total: rateChangeCopy.oldTotal,
            paymentCurrency,
            oldRate: rateChangeCopy.oldRate,
            newRate: rateChangeCopy.newRate,
          })}
        </p>
        <p className="text-grayscale-100 text-base">
          {t("order.rateChangeContinue")}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          data-testid="rate-change-btn-confirm"
          onClick={onConfirm}
          className="w-full"
        >
          {t("order.confirmAndContinue")}
        </Button>
        <Button
          data-testid="rate-change-btn-cancel"
          onClick={onCancel}
          variant="outline"
          className="w-full hover:bg-slate-50"
        >
          {t("order.goBack")}
        </Button>
      </div>
    </div>
  )

  if(!isOpen) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent data-testid="rate-change-modal" className="px-6 pb-8">
          <DrawerTitle className="text-2xl font-bold my-4">{t("order.rateUpdatedTitle")}</DrawerTitle>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="rate-change-modal" className="p-[32px] sm:rounded-[32px]">
        <DialogTitle className="font-bold text-2xl mb-4">{t("order.rateUpdatedTitle")}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  )
}
