"use client"

import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ModalHeaderRow } from "@/components/ui/modal-header-row"
import { isRtlLocale } from "@/lib/i18n/config"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { FeedbackSurvey } from "./feedback-survey"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { useSubmitFeedback } from "@/hooks/use-api-queries"
import { useUserDataStore } from "@/stores/user-data-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { FeedbackError } from "@/services/api/api-auth"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
}

function FeedbackDialogContent({
  onClose,
  title,
}: {
  onClose: () => void
  title: string
}) {
  const { t } = useTranslations()
  const { toast } = useToast()
  const { showAlert } = useAlertDialog()
  const userId = useUserDataStore((state) => state.userId)
  const feedbackExist = useUserDataStore((state) => state.userData?.feedback_exist)
  const submitFeedback = useSubmitFeedback()

  const handleSubmit = async (npsScore: number, reviewText: string) => {
    if (!userId) return
    if (feedbackExist) {
      onClose()
      return
    }
    try {
      await submitFeedback.mutateAsync({ userId, nps_score: npsScore, review_text: reviewText })
      onClose()
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt="" width={24} height={24} />
            <span>{t("nps.successToast")}</span>
          </div>
        ),
        className: TOAST_SUCCESS_CLASS,
        duration: 2500,
      })
    } catch (err) {
      const error = err as FeedbackError
      const rawCode = error?.errors?.[0]?.code ?? "unknown"
      const SAFE_CODE_RE = /^[a-zA-Z0-9_-]{1,64}$/
      const errorCode = SAFE_CODE_RE.test(rawCode) ? rawCode : "unknown"
      showAlert({
        title: t("nps.errorTitle"),
        description: t("nps.errorMessage", { errorCode }),
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  return (
    <>
      <p className="px-6 pb-2 text-base font-bold">{title}</p>
      <FeedbackSurvey
        onSubmit={handleSubmit}
        onClose={onClose}
        isSubmitting={submitFeedback.isPending}
      />
    </>
  )
}

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const { t, locale } = useTranslations()
  const isMobile = useIsMobile()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const title = t("nps.title")

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DrawerContent data-testid="feedback-dialog" dir={dir} className="max-h-[90vh] rounded-t-2xl pb-safe">
          <DrawerHeader className="pb-0 text-start">
            <DrawerTitle className="text-xl font-bold text-start">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <FeedbackDialogContent onClose={onClose} title="" />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent data-testid="feedback-dialog" dir={dir} className="sm:max-w-[580px] sm:rounded-[32px] p-0">
        <ModalHeaderRow
          asDialog
          title={title}
          onClose={onClose}
          closeAriaLabel={t("common.close")}
          titleClassName="tracking-normal"
          className="px-8 pt-6 pb-0"
          closeButtonTestId="feedback-btn-close"
        />
        <FeedbackDialogContent onClose={onClose} title="" />
      </DialogContent>
    </Dialog>
  )
}
