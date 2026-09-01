"use client"

import { useState, useMemo } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { OrdersAPI } from "@/services/api"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { cn } from "@/lib/utils"
import { type ComplaintProps, COMPLAINT_OPTIONS } from "./types"

export function ComplaintForm({ isOpen, onClose, onSubmit, orderId, type }: ComplaintProps) {
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { showAlert } = useAlertDialog()

  const canSubmit = !!selectedOption && confirmed

  const handleSubmit = async () => {
    if (canSubmit && !isSubmitting) {
      setIsSubmitting(true)
      try {
        const result = await OrdersAPI.disputeOrder(orderId, selectedOption)
        if (result.errors?.length === 0 || result.success) {
          onSubmit?.()
        }
        setSelectedOption("")
        setConfirmed(false)
        onClose()
      } catch (error) {
        const errorCode = error instanceof Error ? error.message : "UnknownError"
        if (errorCode === "OrderTempLocked") {
          showAlert({
            title: t("order.tempLockedTitle"),
            description: t("order.tempLockedDescription"),
            confirmText: t("order.tryAgain"),
            cancelText: t("order.goBack"),
            type: "warning",
            onCancel: () => handleClose(),
          })
        } else {
          setApiError(error instanceof Error ? error.message : t("order.genericMessage"))
          console.error("Error submitting complaint:", error)
          onClose()
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setSelectedOption("")
    setConfirmed(false)
    setApiError(null)
    onClose()
  }

  const filteredOptions = useMemo(
    () => COMPLAINT_OPTIONS.filter((option) => option.type === type),
    [type]
  )

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80" onClick={handleClose} />
      <div
        className={`fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col ${isMobile ? "inset-0 w-full" : "w-full"
          }`}
        data-testid="complaint-form-container"
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      >
        <div className="max-w-xl mx-auto flex flex-col w-full h-full">
          {/* Back button */}
          <div className="flex items-center px-4 py-3">
            <Button variant="icon-muted" onClick={handleClose} className="!bg-black/[0.04] hover:!bg-black/[0.08]" data-testid="complaint-btn-back">
              <BackArrowIcon alt={t("order.goBack")} width={24} height={24} />
            </Button>
          </div>

          {/* Title + subtitle */}
          <div className="px-4 pb-4 pt-6">
            <h2 className="text-2xl font-bold">{t("complaint.title")}</h2>
            <p className="text-sm text-grayscale-600 mt-1">{t("complaint.subtitle")}</p>
          </div>

          {/* Scrollable content */}
          <div className="px-4 space-y-4 overflow-y-auto">
            {/* Warning card */}
            <Alert variant="warning">
              <AlertTitle className="font-bold text-slate-1200 mb-1">{t("complaint.warningTitle")}</AlertTitle>
              <AlertDescription className="text-sm text-slate-1200">
                {t("complaint.warningBodyPrefix")}
                <strong>{t("complaint.warningBodyBold")}</strong>
                {t("complaint.warningBodySuffix")}
              </AlertDescription>
            </Alert>

            {/* Reason tiles */}
            <div className="space-y-2">
              <p className="text-slate-1200">{t("complaint.whatWentWrong")}</p>
              {/* Using native <button> instead of <Button> because Quill's QuillButton
                  wraps children in a label span with overflow:hidden, which truncates
                  multi-line complaint reason text. */}
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.value === selectedOption ? "" : option.value)}
                  className={cn(
                    "w-full text-left rounded-lg p-4 transition-colors bg-grayscale-500 flex flex-col items-start",
                    selectedOption === option.value
                      ? "border border-slate-1400"
                      : "border border-transparent",
                  )}
                  aria-pressed={selectedOption === option.value}
                  data-testid={`complaint-btn-reason-${option.id}`}
                >
                  <p className="text-slate-1200">{t(`complaint.${option.labelKey}`)}</p>
                  <p className="text-xs text-grayscale-text-muted mt-0.5">{t(`complaint.${option.hintKey}`)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom: checkbox + label + submit */}
          <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            {apiError && <p className="text-error text-xs w-full" data-testid="complaint-error-api">{apiError}</p>}
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                id="complaint-confirm"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="shrink-0 mt-0.5 rounded-sm border border-grayscale-600 data-[state=checked]:bg-transparent data-[state=checked]:text-grayscale-600"
                data-testid="complaint-checkbox-confirm"
              />
              <Label htmlFor="complaint-confirm" className="font-normal text-grayscale-600 text-sm cursor-pointer leading-snug">
                {t("complaint.confirmCheckbox")}
              </Label>
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="w-full md:w-auto shrink-0" data-testid="complaint-btn-submit">
              {isSubmitting ? (
                <Spinner size="xs" />
              ) : (
                t("complaint.submit")
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
