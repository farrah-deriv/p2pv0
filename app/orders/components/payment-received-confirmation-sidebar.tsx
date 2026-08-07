"use client"
import { useState, useEffect } from "react"
import { StandaloneArrowLeftFillIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { InputOTP } from "@/components/ui/input-otp"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useUserDataStore } from "@/stores/user-data-store"
import { OrdersAPI } from "@/services/api"
import { useTranslations } from "@/lib/i18n/use-translations"

const DEFAULT_RATE_LIMIT_SECONDS = 60

interface PaymentReceivedConfirmationSidebarProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderId: string
  isLoading?: boolean
  otpRequested: boolean,
  setOtpRequested: (value: boolean) => void
}

export const PaymentReceivedConfirmationSidebar = ({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  isLoading = false,
  otpRequested,
  setOtpRequested,
}: PaymentReceivedConfirmationSidebarProps) => {
  const { t } = useTranslations()
  const [otpValue, setOtpValue] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const { showAlert } = useAlertDialog()
  const userData = useUserDataStore((state) => state.userData)

  useEffect(() => {
    if (isOpen && resendTimer <= 0) {
      handleRequestOtp()
      setOtpValue("")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // resendTimer excluded to avoid auto-sending on every tick; handleRequestOtp excluded because it is recreated each render

  useEffect(() => {
    if (!isOpen || resendTimer <= 0 || !otpRequested) return

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, resendTimer, otpRequested])

  const handleConfirmOrder = async (value) => {
    try {
      const result = await OrdersAPI.completeOrder(orderId, value)

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0]

        if (error.code === "InvalidOrExpiredVerificationCode" || error.code === "OrderVerificationCodeInvalid") {
          const attemptsLeft = error.detail?.attempts_left || 0
          setError(
            t("orders.incorrectCode", {
              attempts: attemptsLeft,
              plural: attemptsLeft !== 1 ? "s" : "",
            }),
          )
        } else if (error.code === "OrderCompleteVerificationTempLock" || error.code === "OrderVerificationTempLock") {
          showAlert({
            title: t("order.verificationLockedTitle"),
            description: t("order.verificationLockedDescription"),
            cancelText: t("common.gotIt"),
            confirmText: t("common.close"),
            type: "warning",
            onCancel: () => {
              onClose()
            },
            onConfirm: () => {
              onClose()
            },
            onClose: () => {
              onClose()
            }
          })
        } else if (error.code === "OrderTempLocked") {
          showAlert({
            title: t("order.tempLockedTitle"),
            description: t("order.tempLockedDescription"),
            confirmText: t("order.tryAgain"),
            cancelText: t("order.goBack"),
            type: "warning",
            onCancel: () => onClose(),
          })
        } else {
          setError(error.message || "An error occurred. Please try again.")
        }
        setOtpValue("")
      } else {
        onConfirm()
        onClose()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setOtpValue("")
    }
  }

  const handleRequestOtp = async () => {
    try {
      const result = await OrdersAPI.requestOrderCompletionOtp(orderId)
      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0]
        if (error.code === "OrderVerificationTempLock") {
          setOtpRequested(false)
          showAlert({
            title: t("order.verificationLockedTitle"),
            description: t("order.verificationLockedDescription"),
            cancelText: t("common.gotIt"),
            confirmText: t("common.close"),
            type: "warning",
            onCancel: () => {
              onClose()
            },
            onConfirm: () => {
              onClose()
            },
            onClose: () => {
              onClose()
            }
          })
        } else if (error.code === "OrderVerificationRateLimit") {
          setOtpRequested(true)
          const nextRequestAt = error.detail?.next_request_at
          const timeRemaining = nextRequestAt
            ? Math.max(1, Math.ceil((nextRequestAt - Date.now()) / 1000))
            : DEFAULT_RATE_LIMIT_SECONDS
          setResendTimer(timeRemaining)
          setError(null)
        } else if (error.code === "OrderTempLocked") {
          setOtpRequested(false)
          showAlert({
            title: t("order.tempLockedTitle"),
            description: t("order.tempLockedDescription"),
            confirmText: t("order.tryAgain"),
            cancelText: t("order.goBack"),
            type: "warning",
            onCancel: () => onClose(),
          })
        } else {
          setOtpRequested(false)
          setError(error.message || "An error occurred. Please try again.")
        }
      } else {
        setOtpRequested(true)
        setResendTimer(59)
        setError(null)
      }
    } catch (err: any) {
      setOtpRequested(false)
      setError("An error occurred. Please try again.")
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    await handleRequestOtp()
  }

  const handleOtpChange = (value: string) => {
    setOtpValue(value)
    setError(null)
    if (value.length === 6) {
      handleConfirmOrder(value)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent data-testid="order-details-sheet-confirm-received" className="w-full p-0 sm:max-w-none" hideCloseButton>
        <div className="flex flex-col h-full sm:max-w-none md:max-w-xl md:mx-auto">
          <SheetHeader className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="icon-muted" onClick={onClose} className="!bg-neutral-100 hover:!bg-neutral-200" aria-label={t("common.back")}>
                <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 p-6 space-y-6">
            <div>
              <SheetTitle className="text-2xl font-bold mb-2 text-slate-1200">
                {t("orders.confirmPaymentReceived")}
              </SheetTitle>
              <p className="text-sm text-grayscale-600">
                {t("orders.otpSentTo", { email: userData?.email || "your email" })}
              </p>
            </div>

            <div className="space-y-4">
              <div data-testid="order-details-input-otp">
                <InputOTP
                  length={6}
                  value={otpValue}
                  onChange={handleOtpChange}
                  disabled={isVerifying || isLoading || !!warning}
                  status={error ? "error" : "neutral"}
                />
              </div>

              {error && <p className="text-error text-xs mx-4" data-testid="order-details-error-otp">{error}</p>}
              {warning && <p className="text-grayscale-600 text-sm">{warning}</p>}

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                  <span>{t("orders.verifying")}</span>
                </div>
              )}
            </div>

            {otpRequested && !warning && (
              <div className="space-y-2">
                <p className="text-sm text-grayscale-600">{t("orders.didntReceiveCode")}</p>
                {resendTimer > 0 ? (
                  <p className="text-sm text-grayscale-600">{t("orders.resendCodeTimer", { seconds: resendTimer })}</p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    className="p-0 hover:bg-transparent underline font-normal text-grayscale-600"
                    size="sm"
                  >
                    {t("orders.resendCode")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
