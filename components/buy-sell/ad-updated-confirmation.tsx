"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"

interface AdUpdatedConfirmationProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function AdUpdatedConfirmation({ isOpen, onConfirm, onCancel }: AdUpdatedConfirmationProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslations()

  const content = (
    <div className="flex flex-col gap-8">
      <p className="text-grayscale-100 text-base">
        {t("order.adUpdatedDuringOrderMessage")}
      </p>
      <Button data-testid="ad-updated-btn-confirm" onClick={onConfirm} className="w-full">
        {t("order.reviewChanges")}
      </Button>
    </div>
  )

  if (!isOpen) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent data-testid="ad-updated-modal" className="px-6 pb-8">
          <DrawerTitle className="text-2xl font-bold my-4">{t("order.adUpdatedTitle")}</DrawerTitle>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="ad-updated-modal" className="p-[32px] sm:rounded-[32px]">
        <DialogTitle className="font-bold text-2xl mb-4">{t("order.adUpdatedTitle")}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  )
}
