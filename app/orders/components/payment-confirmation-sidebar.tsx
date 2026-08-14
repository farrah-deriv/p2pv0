"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { StandaloneXmarkFillIcon } from "@deriv/quill-icons/Standalone"
import { formatAmount } from "@/lib/utils"
import type { Order } from "@/services/api/api-orders"
import { Input } from "@/components/ui/input"
import { OrdersAPI } from "@/services/api"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { PaymentAmountRecipientCard } from "./payment-amount-recipient-card"
import { ProofChecklistRow } from "./proof-checklist-row"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"

interface PaymentConfirmationSidebarProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  order: Order | null
  isLoading?: boolean
}

export const PaymentConfirmationSidebar = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  isLoading = false,
}: PaymentConfirmationSidebarProps) => {
  const { t } = useTranslations()
  const { showAlert } = useAlertDialog()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadLoading, setIsUploadLoading] = useState<boolean>(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [attachmentsRemaining, setAttachmentsRemaining] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isConnected, getChatHistory, subscribe } = useWebSocketContext()
  const isChatModerationEnabled = isP2POrderChatModerationEnabled()

  useEffect(() => {
    if (!isChatModerationEnabled) {
      return
    }

    const unsubscribe = subscribe((data) => {
      if (data?.options?.channel !== "orders") {
        return
      }

      if (typeof data?.payload?.data?.chat_attachments_limit === "number") {
        setAttachmentsRemaining(data.payload.data.chat_attachments_limit)
      }
    })

    return unsubscribe
  }, [subscribe, isChatModerationEnabled])

  useEffect(() => {
    if (!isChatModerationEnabled) {
      return
    }

    if (isOpen && isConnected && order) {
      getChatHistory("orders", order.id)
    }
  }, [isOpen, isConnected, order?.id, getChatHistory, isChatModerationEnabled])

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setIsUploadLoading(false)
      setFileError(null)
      setConfirmed(false)
      setPreviewDataUrl(null)
      setAttachmentsRemaining(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [isOpen])

  if (!order) return null

  const handleFileSelect = (file: File) => {
    setFileError(null)

    if (isChatModerationEnabled && attachmentsRemaining !== null && attachmentsRemaining <= 0) {
      return
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setFileError(t("orders.invalidFileType"))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError(t("orders.fileTooLarge"))
      return
    }

    // Use FileReader.readAsDataURL for image preview — produces a data: URL
    // that is not traced as DOM-tainted by CodeQL (unlike URL.createObjectURL).
    if (!file.type.startsWith("application/pdf")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewDataUrl(e.target?.result as string ?? null)
      reader.readAsDataURL(file)
    } else {
      setPreviewDataUrl(null)
    }
    setSelectedFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleRemoveFile = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedFile(null)
    setFileError(null)
    setPreviewDataUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return

    try {
      setIsUploadLoading(true)
      const base64 = await fileToBase64(selectedFile)
      await OrdersAPI.sendChatMessage(order.id, "", base64, true)

      onConfirm()
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "UnknownError"
      if (errorCode === "OrderTempLocked") {
        showAlert({
          title: t("order.tempLockedTitle"),
          description: t("order.tempLockedDescription"),
          confirmText: t("order.tryAgain"),
          cancelText: t("order.goBack"),
          type: "warning",
          onCancel: () => onClose(),
        })
      } else if (errorCode === "ChatAttachmentCorrupted") {
        showAlert({
          title: t("chat.attachmentCorruptedTitle"),
          description: t("chat.attachmentCorruptedDescription"),
          confirmText: t("common.gotIt"),
          type: "warning",
          onConfirm: () => handleRemoveFile(),
        })
      } else if (errorCode === "OrderChatAttachmentRejected") {
        showAlert({
          title: t("orders.attachmentRejectedTitle"),
          description: t("orders.attachmentRejected"),
          confirmText: t("common.gotIt"),
          type: "warning",
          onConfirm: () => handleRemoveFile(),
        })
      } else if (errorCode === "ChatAttachmentLimitReached") {
        showAlert({
          title: t("orders.attachmentLimitReachedTitle"),
          description: t("orders.attachmentLimitReached"),
          confirmText: t("common.gotIt"),
          type: "warning",
          onConfirm: () => handleRemoveFile(),
        })
      } else if (errorCode === "BothChatMessageAndAttachmentPresent") {
        showAlert({
          title: t("chat.oneItemAtATimeTitle"),
          description: t("chat.oneItemAtATimeDescription"),
          confirmText: t("common.gotIt"),
          type: "warning",
        })
      } else {
        console.error("Error uploading file to chat:", error)
        showAlert({
          title: t("common.error"),
          description: t("common.somethingWentWrong"),
          confirmText: t("common.gotIt"),
          type: "warning",
        })
      }
    } finally {
      setIsUploadLoading(false)
    }
  }

  const counterpartyName =
    order.counterparty_name ??
    (order.type === "buy" ? order.advert?.user?.nickname : order.user?.nickname)
  const amountValue = `${formatAmount(order.payment_amount)} ${order.payment_currency}`
  const isPdf = selectedFile?.type === "application/pdf"

  if (!isOpen) return null

  return (
    <div
      data-testid="order-details-sheet-confirm-payment"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <div className="mx-auto flex h-full w-full max-w-[600px] flex-col">
        {/* Close button */}
        <div className="flex items-center justify-end px-4 md:px-0 py-3">
          <Button
            variant="icon-muted"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <StandaloneXmarkFillIcon width={24} height={24} aria-hidden />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-4 space-y-6">
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-1200">
            {t("orders.confirmPayment")}
          </h2>

          {/* Warning banner + Amount/Recipient card (overlapping) */}
          <div className="relative">
            <Alert
              variant="warning"
              className="rounded-b-none border-0 pb-10"
            >
              <AlertDescription>
                <div className="pb-4">
                  {t("orders.fraudWarningStart")}
                  <strong className="font-bold">{t("orders.fraudWarningBold")}</strong>
                  {t("orders.fraudWarningEnd")}
                </div>
              </AlertDescription>
            </Alert>
            {/* Card elevated above the warning via z-10, pulled up 20px */}
            <div className="relative -mt-5 z-10">
              <PaymentAmountRecipientCard
                amountLabel={t("orders.amountLabel")}
                amountValue={amountValue}
                recipientLabel={t("orders.recipientLabel")}
                recipientValue={counterpartyName ?? ""}
              />
            </div>
          </div>

          {/* Receipt checklist — single column on mobile, 2×2 grid on desktop */}
          <div className="space-y-2">
            <p className="text-sm text-slate-1200">{t("orders.receiptMustShow")}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ProofChecklistRow
                label={t("orders.checklistRecipient")}
                value={counterpartyName ?? ""}
              />
              <ProofChecklistRow label={t("orders.checklistAmount")} value={amountValue} />
              <ProofChecklistRow label={t("orders.checklistDate")} />
              <ProofChecklistRow label={t("orders.checklistSender")} />
            </div>
          </div>

          {/* Upload box */}
          <div>
            <div
              className={cn(
                "relative h-[200px] overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
                fileError ? "border-error" : "border-grayscale-800",
              )}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.png,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />

              {selectedFile ? (
                <>
                  {isPdf ? (
                    <div className="flex h-full items-center justify-center gap-2 px-4">
                      <Image
                        src="/icons/upload-icon.png"
                        alt=""
                        aria-hidden="true"
                        width={24}
                        height={24}
                      />
                      <p className="truncate text-sm font-medium text-slate-1200">
                        {selectedFile.name}
                      </p>
                    </div>
                  ) : previewDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewDataUrl}
                      alt={t("orders.uploadProof")}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {/* Remove button — end-2 is RTL-safe */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="absolute end-2 top-2 !h-7 !w-7 !rounded-full !bg-black/50 !text-white !p-0 !min-w-0 hover:!bg-black/70"
                    aria-label={t("orders.removeFile")}
                  >
                    <StandaloneXmarkFillIcon width={16} height={16} aria-hidden />
                  </Button>
                </>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="flex h-full cursor-pointer flex-col items-center justify-center gap-1 px-4"
                >
                  <Image
                    src="/icons/upload-icon.png"
                    alt=""
                    aria-hidden="true"
                    width={48}
                    height={48}
                  />
                  <span className="text-sm font-bold text-slate-1200">
                    {t("orders.uploadProof")}
                  </span>
                  <p className="text-xs text-grayscale-text-muted">{t("orders.fileTypes")}</p>
                </label>
              )}
            </div>
            {fileError && <p className="mt-1 text-xs text-error">{fileError}</p>}
            {isChatModerationEnabled && attachmentsRemaining !== null && (
              <p
                className={cn(
                  "mt-2 text-xs text-center",
                  attachmentsRemaining <= 0 ? "text-error-text" : "text-grayscale-text-muted",
                )}
              >
                {t("chat.attachmentsRemaining", { count: attachmentsRemaining })}
              </p>
            )}
          </div>

          {/* Confirmation checkbox + submit */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="flex items-start gap-3 md:flex-1">
              <Checkbox
                id="confirm-payment"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="mt-0.5 shrink-0"
              />
              <label
                htmlFor="confirm-payment"
                className="cursor-pointer text-sm leading-relaxed text-slate-1200"
              >
                {t("orders.confirmGenuineCheckbox")}
              </label>
            </div>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={!selectedFile || !confirmed || isLoading || isUploadLoading}
              className="w-full md:w-auto md:shrink-0"
              data-testid="order-details-btn-confirm-payment"
            >
              {isLoading || isUploadLoading ? (
                <Spinner size="xs" />
              ) : (
                t("orders.submit")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
