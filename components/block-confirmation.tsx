"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"

interface BlockConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  nickname: string
  isLoading?: boolean
}

export default function BlockConfirmation({
  isOpen,
  onClose,
  onConfirm,
  nickname,
  isLoading = false,
}: BlockConfirmationProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslations()

  const content = (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-grayscale-100 text-base">{t("profile.blockDescription", { nickname })}</p>
      </div>

      <div className="space-y-3">
        <Button data-testid="block-confirm-btn-block" onClick={onConfirm} disabled={isLoading} className="w-full rounded-full">
          {t("profile.block")}
        </Button>
        <Button data-testid="block-confirm-btn-cancel" onClick={onClose} variant="ghost" disabled={isLoading} className="w-full rounded-full">
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent data-testid="block-confirm-modal" side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold text-start">{t("profile.blockUser", { nickname })}</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="block-confirm-modal" className="sm:max-w-md rounded-4xl">
        <DialogTitle className="text-start font-bold">{t("profile.blockUser", { nickname })}</DialogTitle>
        <div className="relative">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
