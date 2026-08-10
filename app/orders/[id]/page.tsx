"use client"

export const runtime = "edge"

import { useState, useEffect, useCallback } from "react"
import { useParams } from 'next/navigation'
import { StandaloneChevronRightRegularIcon } from "@deriv/quill-icons/Standalone"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { OrdersAPI, AuthAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import OrderChat from "@/components/order-chat"
import OrderChatSkeleton from "@/components/order-chat-skeleton"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  cn,
  formatAmount,
  formatStatus,
  getPaymentMethodColour,
  getStatusBadgeStyle,
  copyToClipboard,
} from "@/lib/utils"
import OrderDetailsSidebar from "@/components/order-details-sidebar"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useUserDataStore } from "@/stores/user-data-store"
import Image from "next/image"
import { RatingSidebar } from "@/components/rating-filter"
import { ComplaintForm } from "@/components/complaint"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { OrderDetails } from "@/components/order-details"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { PaymentConfirmationSidebar } from "../components/payment-confirmation-sidebar"
import { PaymentReceivedConfirmationSidebar } from "../components/payment-received-confirmation-sidebar"
import { localeToBcp47 } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import InfoCircleIcon from "@/public/icons/info-circle-bold.svg"
import { useTrackers } from "@/analytics/useTrackers"
import { shouldDisableChatAttachments } from "@/lib/orders/order-chat-gating"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

export default function OrderDetailsPage() {
  const { t, locale } = useTranslations()
  const { track } = useTrackers()
  const params = useParams()
  const orderId = params.id as string
  const isMobile = useIsMobile()
  const { showAlert, showWarningDialog } = useAlertDialog()
  const { toast } = useToast()
  const { setIsChatVisible } = useChatVisibilityStore()
  const userId = useUserDataStore((state) => state.userId)

  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("--:--")
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showRatingSidebar, setShowRatingSidebar] = useState(false)
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [showPaymentReceivedConfirmation, setShowPaymentReceivedConfirmation] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(true)
  const [orderVerificationEnabled, setOrderVerificationEnabled] = useState<boolean>(true)
  const { isConnected, joinChannel, reconnect, subscribe, joinUsersOnlineChannel, leaveUsersOnlineChannel } = useWebSocketContext()
  const [otpRequested, setOtpRequested] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
    fetchSettings()

    if (!isConnected) {
      reconnect()
    }
  }, [orderId])

  useEffect(() => {
    if (isConnected) {
      joinChannel("orders", orderId)
      setIsChatLoading(false)
    }
  }, [isConnected, orderId])

  const handleUsersOnlineUpdate = useCallback((data: any) => {
    if (data?.options?.channel === "users_online") {
      const update: { user_id: number; is_online: boolean } | null = data?.payload?.data ?? null
      if (update) {
        setOrder((prev) => {
          if (!prev) return prev
          const updatedOrder = { ...prev }
          if (prev.user?.id === update.user_id) {
            updatedOrder.user = { ...prev.user, is_online: update.is_online }
          }
          if (prev.advert?.user?.id === update.user_id) {
            updatedOrder.advert = { ...prev.advert, user: { ...prev.advert.user, is_online: update.is_online } }
          }
          return updatedOrder
        })
      }
    }
  }, [])

  useEffect(() => {
    if (!isConnected) return

    joinUsersOnlineChannel()
    const unsubscribe = subscribe(handleUsersOnlineUpdate)

    return () => {
      unsubscribe()
      leaveUsersOnlineChannel()
    }
  }, [isConnected, handleUsersOnlineUpdate, joinUsersOnlineChannel, leaveUsersOnlineChannel])

  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (
        ["buyer_paid", "completed", "cancelled", "refunded", "disputed", "user_review", "advertiser_review"].includes(
          data.payload?.data?.event,
        ) &&
        data.payload?.data?.order?.id == orderId
      ) {
        setOrder(data.payload.data.order)
      }
    })

    return unsubscribe
  }, [orderId, subscribe])

  const showOrderDetails = () => {
    track("ek_view_order_info_order_details")
    if (isMobile) {
      setShowDetailsSidebar(true)
    } else {
      showAlert({
        title: t("orderDetails.title"),
        content: (
          <div className="overflow-auto max-h-[70vh]">
            <OrderDetails order={order} />
          </div>
        ),
        cancelText: t("orderDetails.gotIt"),
        hideCloseButton: true,
      })
    }
  }

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const order = await OrdersAPI.getOrderById(orderId)
      setOrder(order.data)
    } catch (err) {
      console.error("Error fetching order details:", err)
      setError(t("orderDetails.failedToLoadOrderDetails"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayOrder = async () => {
    setIsPaymentLoading(true)
    try {
      await OrdersAPI.payOrder(orderId)
      fetchOrderDetails()
      setShowPaymentConfirmation(false)
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
            <span>{t("orderDetails.proofOfTransferSubmitted")}</span>
          </div>
        ),
        className: TOAST_SUCCESS_CLASS,
        duration: 2500,
      })
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : "UnknownError"
      if (errorCode === "OrderTempLocked") {
        showAlert({
          title: t("order.tempLockedTitle"),
          description: t("order.tempLockedDescription"),
          confirmText: t("order.tryAgain"),
          cancelText: t("order.goBack"),
          type: "warning",
          onCancel: () => setShowPaymentConfirmation(false),
        })
      } else {
        console.error("Error marking payment as sent:", err)
      }
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleSubmitReview = () => {
    setShowRatingSidebar(false)
  }

  const handleSubmitComplaint = () => {
    setShowComplaintForm(false)
  }

  const formatRatingDeadline = (ratingDeadline) => {
    const deadline = new Date(ratingDeadline)

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "GMT",
      timeZoneName: "short",
    }

    return deadline.toLocaleString(localeToBcp47(locale), options)
  }

  const renderPaymentMethodFields = (method: any) => {
    const fields = []

    const copyableFields = ["account", "bank_code"]

    Object.entries(method).forEach(([key, val]) => {
      if (key === "method" || key === "type" || !val) return

      const translationKey = `paymentMethodFields.${key.toLowerCase()}`
      const displayKey = t(translationKey, {
        defaultValue: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      })
      const isCopyable = copyableFields.includes(key.toLowerCase())

      fields.push(
        <div key={key}>
          {val.value && <p className="text-xs text-slate-500 mb-1">{displayKey}</p>}
          {isCopyable ? (
            <div className="flex items-center justify-between">
              <p className="text-sm" data-testid={`order-details-text-${key}`}>{val.value}</p>
              <Button
                onClick={async () => {
                  const success = await copyToClipboard(String(val.value))
                  if (success) {
                    toast({
                      description: (
                        <div className="flex items-center gap-2">
                          <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                          <span>{t("orderDetails.textCopiedToClipboard")}</span>
                        </div>
                      ),
                      className: TOAST_SUCCESS_CLASS,
                      duration: 2500,
                    })
                  }
                }}
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                data-testid={`order-details-btn-copy-${key}`}
              >
                <Image src="/icons/copy-icon.png" alt={t("common.copy")} width={24} height={24} className="text-slate-500" />
              </Button>
            </div>
          ) : (
            <p className="text-sm" data-testid={`order-details-text-${key}`}>{val.value}</p>
          )}
        </div>,
      )
    })

    return fields
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Image
          key={i}
          src={i <= rating ? "/icons/star-active.png" : "/icons/star-custom.png"}
          alt={i <= rating ? "Filled star" : "Empty star"}
          width={32}
          height={32}
        />,
      )
    }
    return stars
  }

  useEffect(() => {
    if (!order || !order.expires_at) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const expiryTime = new Date(order.expires_at)
      const diff = expiryTime.getTime() - now.getTime() - 1000

      if (diff <= 0) {
        setTimeLeft("00:00")
        return false
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      return true
    }

    const hasTimeLeft = calculateTimeLeft()

    let intervalId: NodeJS.Timeout | null = null
    if (hasTimeLeft) {
      intervalId = setInterval(() => {
        const stillHasTime = calculateTimeLeft()
        if (!stillHasTime && intervalId) {
          clearInterval(intervalId)
          fetchOrderDetails()
        }
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [order])

  const handleShowPaymentConfirmation = () => {
    track("ek_ive_paid_order_details")
    setShowPaymentConfirmation(true)
  }

  const handleCancelOrder = () => {
    track("ek_cancel_order_order_details")
    showAlert({
      title: t("orderDetails.cancellingYourOrder"),
      description: t("orderDetails.dontCancelIfPaid"),
      confirmText: t("orderDetails.cancelOrder"),
      cancelText: t("orderDetails.keepOrder"),
      testId: "order-details-alert-cancel",
      confirmTestId: "order-details-btn-confirm-cancel",
      cancelTestId: "order-details-btn-keep-order",
      onCancel: () => {
        track("ek_keep_order_order_cancel_sheet")
      },
      onConfirm: async () => {
        track("ek_confirm_cancel_order_cancel_sheet")
        try {
          const result = await OrdersAPI.cancelOrder(orderId)
          if (result.success) {
            track("ek_order_cancelled_order_cancel_sheet")
            fetchOrderDetails()
          } else {
            track("ek_order_cancellation_failed_order_cancel_sheet", { error_code: "cancellation_failed", error_message: "Order cancellation failed" })
          }
        } catch (error) {
          const errorCode = error instanceof Error ? error.message : "UnknownError"
          track("ek_order_cancellation_failed_order_cancel_sheet", { error_code: errorCode, error_message: errorCode })
          if (errorCode === "OrderTempLocked") {
            showAlert({
              title: t("order.tempLockedTitle"),
              description: t("order.tempLockedDescription"),
              confirmText: t("order.tryAgain"),
              cancelText: t("order.goBack"),
              type: "warning",
            })
          } else {
            console.error("Failed to cancel order:", error)
          }
        }
      },
      type: "warning",
    })
  }

  const fetchSettings = async () => {
    try {
      const settings = await AuthAPI.getSettings()
      if (settings) {
        setOrderVerificationEnabled(settings.order_verification_enabled)
      }
    } catch (error) {
      setOrderVerificationEnabled(true)
    }
  }

  const handlePaymentReceived = async () => {
    track("ek_ive_received_payment_order_details")
    if (orderVerificationEnabled) {
      setShowPaymentReceivedConfirmation(true)
    } else {
      setIsConfirmLoading(true)
      try {
        const result = await OrdersAPI.completeOrder(orderId, null)

        if (result.errors && result.errors.length > 0) {
          showAlert({
            title: t("order.unableToCompleteOrder"),
            description: result.errors[0].message,
            confirmText: t("common.ok"),
            type: "warning",
          })
        } else {
          fetchOrderDetails()
        }
      } catch (error) {
        const errorCode = error instanceof Error ? error.message : "UnknownError"
        if (errorCode === "OrderTempLocked") {
          showAlert({
            title: t("order.tempLockedTitle"),
            description: t("order.tempLockedDescription"),
            confirmText: t("order.tryAgain"),
            cancelText: t("order.goBack"),
            type: "warning",
          })
        } else {
          console.error("Failed to complete order:", error)
        }
      } finally {
        setIsConfirmLoading(false)
      }
    }
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p>{error || t("orderDetails.orderNotFound")}</p>
          <Button onClick={fetchOrderDetails} className="mt-4 text-white">
            {t("orderDetails.tryAgain")}
          </Button>
        </div>
      </div>
    )
  }

  if (!isLoading && !order) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p>{t("orderDetails.orderNotFound")}</p>
          <Button onClick={fetchOrderDetails} className="mt-4 text-white">
            {t("orderDetails.tryAgain")}
          </Button>
        </div>
      </div>
    )
  }

  const currentUserRole = (order as { role?: "buyer" | "seller" } | null)?.role
  const orderUserId = order?.user?.id
  const advertUserId = order?.advert?.user?.id
  const userIdString = userId == null ? null : String(userId)
  const isCurrentUserOrderUser = orderUserId != null && userIdString != null && String(orderUserId) === userIdString
  const isCurrentUserAdvertUser = advertUserId != null && userIdString != null && String(advertUserId) === userIdString
  const isCurrentUserBuyer =
    currentUserRole === "buyer" ||
    (order?.type === "buy" && isCurrentUserOrderUser) ||
    (order?.type === "sell" && isCurrentUserAdvertUser)
  const isCurrentUserSeller =
    currentUserRole === "seller" ||
    (order?.type === "buy" && isCurrentUserAdvertUser) ||
    (order?.type === "sell" && isCurrentUserOrderUser)
  const counterpartyNickname = isCurrentUserAdvertUser
    ? order?.user?.nickname
    : (order?.advert?.user?.nickname ?? order?.counterparty_name)
  const counterpartyLabel = isCurrentUserBuyer ? t("orderDetails.seller") : t("orderDetails.buyer")
  const youPayReceiveLabel =
    isCurrentUserBuyer ? t("orderDetails.youPay") : t("orderDetails.youReceive")
  const complainType = isCurrentUserBuyer ? "buyer" : "seller"
  const isBuyer = isCurrentUserBuyer

  const renderOrderActionButtons = (isMobileFooter: boolean) => {
    if (!order) return null

    const footerWrapperClass = isMobileFooter
      ? "flex flex-col-reverse gap-2 w-full"
      : undefined

    return (
      <>
        {order.status === "pending_payment" && isCurrentUserBuyer && (
          <div
            className={cn(
              isMobileFooter
                ? footerWrapperClass
                : "py-4 flex flex-col-reverse md:flex-row gap-2 md:gap-4 sticky bottom-0 bg-white md:static md:bg-transparent",
            )}
          >
            <Button variant="secondary-outline" className="md:flex-1" onClick={handleCancelOrder} data-testid="order-details-btn-cancel">
              {t("orderDetails.cancelOrder")}
            </Button>
            <Button className="md:flex-1" onClick={handleShowPaymentConfirmation} data-testid="order-details-btn-paid">
              {t("orderDetails.ivePaid")}
            </Button>
          </div>
        )}
        {(order.status === "pending_release" || order.status === "disputed") &&
          isCurrentUserSeller && (
            <div
              className={cn(
                isMobileFooter ? "flex w-full" : "md:pl-4 pt-4 flex gap-4 md:float-right sticky bottom-0 bg-white md:static md:bg-transparent",
              )}
            >
              <Button className="flex-1" onClick={handlePaymentReceived} disabled={isConfirmLoading} data-testid="order-details-btn-received">
                {isConfirmLoading ? (
                  <Spinner size="xs" />
                ) : (
                  t("orderDetails.iveReceivedPayment")
                )}
              </Button>
            </div>
          )}
        {order.status === "timed_out" && (
          <div className={cn(isMobileFooter ? "flex flex-col gap-3 w-full" : "py-4 flex gap-4")}>
            {isCurrentUserSeller && (
              <Button className="md:flex-1" onClick={handlePaymentReceived} disabled={isConfirmLoading} data-testid="order-details-btn-received">
                {isConfirmLoading ? (
                  <Spinner size="xs" />
                ) : (
                  t("orderDetails.iveReceivedPayment")
                )}
              </Button>
            )}
            <Button
              variant="secondary-outline"
              className="md:flex-1"
              onClick={() => {
                track("ek_make_complaint_order_details")
                setShowComplaintForm(true)
              }}
              data-testid="order-details-btn-complaint"
            >
              {t("orderDetails.complain")}
            </Button>
          </div>
        )}
        {order.status === "completed" && order.is_reviewable && !order.disputed_at && !isMobileFooter && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-[16px] bg-blue-50 rounded-2xl mt-[24px]">
              <div className="flex-shrink-0">
                <Image src="/icons/info-custom.png" alt={t("common.info")} width={24} height={24} />
              </div>
              <p className="text-sm text-grayscale-100">
                {t("orderDetails.ratingDeadline", {
                  deadline: formatRatingDeadline(order.order_review_expires_at),
                })}
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  track("ek_rate_transaction_order_details")
                  setShowRatingSidebar(true)
                }}
                className="flex-auto md:flex-none"
              >
                {t("orderDetails.rateTransaction")}
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const hasStickyMobileOrderActions =
    isMobile &&
    order &&
    ((order.status === "pending_payment" && isCurrentUserBuyer) ||
      order.status === "timed_out" ||
      ((order.status === "pending_release" || order.status === "disputed") &&
        isCurrentUserSeller))

  if (isMobile && showChat && order) {
    const counterpartyOnlineStatus = isCurrentUserAdvertUser ? order.user?.is_online : order.advert?.user?.is_online
    const counterpartyLastOnlineAt = isCurrentUserAdvertUser
      ? order.user?.last_online_at
      : order.advert?.user?.last_online_at

    return (
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <OrderChat
          orderId={orderId}
          order={order}
          counterpartyName={counterpartyNickname || t("common.user")}
          counterpartyInitial={(counterpartyNickname || t("common.user")).charAt(0).toUpperCase()}
          isClosed={["cancelled", "completed", "refunded"].includes(order?.status)}
          isAttachmentUploadDisabled={shouldDisableChatAttachments(order, userId)}
          counterpartyOnlineStatus={counterpartyOnlineStatus}
          counterpartyLastOnlineAt={counterpartyLastOnlineAt}
          onNavigateToOrderDetails={() => {
            setShowChat(false)
            setIsChatVisible(false)
          }}
          onOpenProofOfTransfer={() => setShowPaymentConfirmation(true)}
        />
      </div>
    )
  }

  return (
    <div className="lg:absolute inset-x-0 top-0 bottom-0 bg-white flex flex-col flex-1 min-h-0 h-full overflow-hidden md:overflow-y-auto lg:pt-6">
      {order?.type && (
        <Navigation
          isBackBtnVisible={false}
          isVisible={false}
          title=""
          redirectUrl={"/orders"}
        />
      )}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden md:overflow-y-auto">
        <div className={cn("container mx-auto px-[24px] mt-4 pb-6 md:pb-6", isMobile && !isLoading && order && "flex flex-col flex-1 min-h-0 overflow-hidden mt-0 pb-0 px-0")}>
          {isLoading ? (
            <div className="flex flex-row gap-6">
              <div className="w-full lg:w-1/2 rounded-lg">
                <Skeleton className="h-[60px] w-full rounded-lg mb-6 bg-grayscale-500" />
                <div className="border rounded-lg p-4 mb-6">

                  <div className="mb-4">
                    <Skeleton className="h-[14px] w-[80px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[200px] bg-grayscale-500" />
                  </div>

                  <div className="mb-4">
                    <Skeleton className="h-[14px] w-[120px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[150px] bg-grayscale-500" />
                  </div>

                  <div className="mb-4">
                    <Skeleton className="h-[14px] w-[100px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[180px] bg-grayscale-500" />
                  </div>

                  <div className="mb-4">
                    <Skeleton className="h-[14px] w-[100px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[180px] bg-grayscale-500" />
                  </div>

                  <div className="mb-4">
                    <Skeleton className="h-[14px] w-[90px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[220px] bg-grayscale-500" />
                  </div>

                  <div>
                    <Skeleton className="h-[14px] w-[60px] mb-2 bg-grayscale-500" />
                    <Skeleton className="h-[20px] w-[140px] bg-grayscale-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Skeleton className="h-[24px] w-[200px] bg-grayscale-500" />
                  <Skeleton className="h-[80px] w-full rounded-2xl bg-grayscale-500" />
                  <Skeleton className="h-[120px] w-full rounded-lg bg-grayscale-500" />
                </div>
              </div>
              <div className="hidden lg:flex w-full lg:w-1/2 border rounded-lg overflow-hidden flex-col h-[600px]">
                <OrderChatSkeleton />
              </div>
            </div>
          ) : (
            <div className={cn("flex flex-col", isMobile && "flex-1 min-h-0")}>
              <div className={cn("flex flex-row gap-6", isMobile && "flex-1 min-h-0")}>
                <div className={cn("w-full lg:w-1/2 rounded-lg", isMobile && "flex flex-col flex-1 min-h-0 overflow-hidden")}>
                  <div
                    className={cn(
                      `${getStatusBadgeStyle(order.status, isBuyer)} p-4 flex justify-between items-center rounded-none lg:rounded-lg mb-[24px] mt-[-16px] lg:mt-[0] z-10`,
                      isMobile ? "mx-0 flex-shrink-0 mb-0 mt-0" : "mx-[-24px] lg:mx-[0] sticky top-0",
                      order.status === "pending_release" && isBuyer && isMobile ? "flex-col items-start" :
                        order.status === "pending_payment" || order.status === "pending_release"
                          ? "justify-between"
                          : "justify-center",
                    )}
                    data-testid="order-details-badge-status"
                  >
                    <div className="flex items-center">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{formatStatus(true, order.status, isBuyer, t)}</span>
                        {order.status === "pending_payment" && !isBuyer && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`ms-1 inline-flex cursor-pointer ${getStatusBadgeStyle(order.status, isBuyer)}`}
                                  aria-label="Info"
                                  role="img"
                                >
                                  <InfoCircleIcon className="h-6 w-6 [&>path]:fill-current" aria-hidden />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className='p-3' side="bottom" avoidCollisions={false}>
                                <p className="text-white">{t("orderDetails.awaitingPaymentTooltip")}</p>
                                <TooltipArrow className="fill-black" />
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    {(order.status === "pending_payment" || order.status === "pending_release") && (
                      <div className={cn("flex items-center", order.status === "pending_release" && "text-sm")}>
                        <span>{t("orderDetails.timeLeft")}&nbsp;</span>
                        <span className="font-bold" data-testid="order-details-text-time-remaining">{timeLeft}</span>
                      </div>
                    )}
                  </div>
                  <div className={cn(isMobile && "flex-1 min-h-0 overflow-y-auto px-[24px] pt-6 pb-4")}>
                    {(order.status === "timed_out" || (order.status === "refunded" && order.disputed_at)) && !isBuyer && (
                      <Alert variant="info" className="mb-[24px]">
                        <AlertDescription>{t("orderDetails.fundsWillBeCredited")}</AlertDescription>
                      </Alert>
                    )}
                    <div className="p-4 border rounded-lg mb-[24px]">
                      {order.status === "completed" ? (
                        <OrderDetails order={order} setShowChat={setShowChat} />
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-slate-500 text-sm">{youPayReceiveLabel}</p>
                              <p className="font-bold text-sm">
                                {formatAmount(order.payment_amount)} {order?.payment_currency}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={showOrderDetails} data-testid="order-details-btn-view-details">
                              <span className="flex items-center gap-1">
                                {t("orderDetails.viewOrderDetails")}
                                <StandaloneChevronRightRegularIcon iconSize="xs" />
                              </span>
                            </Button>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-slate-500 text-sm">{counterpartyLabel}</p>
                              <p className="font-bold text-sm">{counterpartyNickname}</p>
                            </div>
                            {isMobile && (
                              <Button
                                onClick={() => {
                                  track("ek_chat_order_details")
                                  setShowChat(true)
                                  setIsChatVisible(true)
                                }}
                                className="text-slate-500 hover:text-slate-700 pr-0"
                                variant="ghost"
                                size="sm"
                              >
                                <Image src="/icons/chat-icon.png" alt={t("common.chat")} width={20} height={20} />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {order.status !== "completed" && (
                      <div className="space-y-6 mt-4">
                        <div className="space-y-4">
                          {isCurrentUserAdvertUser ? (
                            <h2 className="text-lg font-bold">{t("orderDetails.myPaymentDetails")}</h2>
                          ) : (
                            <h2 className="text-lg font-bold">{t("orderDetails.sellerPaymentDetails")}</h2>
                          )}
                          <Alert variant="warning">
                            <AlertDescription>{t("orderDetails.cashTransactionWarning")}</AlertDescription>
                          </Alert>

                          {order?.payment_method_details && order.payment_method_details.length > 0 && (
                            <div className="bg-white border rounded-lg mt-6">
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                                defaultValue={order.payment_method_details.length === 1 ? "payment-method-0" : undefined}
                                data-testid="order-details-accordion-payment"
                              >
                                {order.payment_method_details.map((method, index) => (
                                  <div key={index}>
                                    <AccordionItem value={`payment-method-${index}`} className="border-b-0">
                                      <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-2 h-2 ${getPaymentMethodColour(method.type)} rounded-full`}
                                          ></div>
                                          <span className="text-sm">{method.display_name}</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-4">{renderPaymentMethodFields(method.fields)}</div>
                                      </AccordionContent>
                                    </AccordionItem>
                                    {index !== order.payment_method_details.length - 1 && <div className="mx-4 border-b border-grayscale-200"></div>}
                                  </div>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="hidden md:block">{renderOrderActionButtons(false)}</div>
                    {order.status === "completed" && order.is_reviewable && !order.disputed_at && (
                      <div className="space-y-4 md:hidden">
                        <div className="flex items-center gap-2 p-[16px] bg-blue-50 rounded-2xl mt-[24px]">
                          <div className="flex-shrink-0">
                            <Image src="/icons/info-custom.png" alt={t("common.info")} width={24} height={24} />
                          </div>
                          <p className="text-sm text-grayscale-100">
                            {t("orderDetails.ratingDeadline", {
                              deadline: formatRatingDeadline(order.order_review_expires_at),
                            })}
                          </p>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="secondary-outline"
                            onClick={() => {
                              track("ek_rate_transaction_order_details")
                              setShowRatingSidebar(true)
                            }}
                            className="flex-auto md:flex-none"
                            data-testid="order-details-btn-rate"
                          >
                            {t("orderDetails.rateTransaction")}
                          </Button>
                        </div>
                      </div>
                    )}
                    {order.status === "completed" && !order.is_reviewable && order.rating && (
                      <div className="space-y-1 mt-[24px]">
                        <h2 className="text-base font-bold">{t("orderDetails.yourTransactionRating")}</h2>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                          <div className="flex items-center gap-1">{renderStars(order.rating)}</div>
                          {order.recommend && (
                            <div className="flex items-center gap-2">
                              <Image src="/icons/thumbs-up-green.png" alt={t("common.recommended")} width={16} height={16} />
                              <span className="text-sm">{t("orderDetails.recommended")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {hasStickyMobileOrderActions && (
                    <div className="flex-shrink-0 border-t border-grayscale-200 bg-white px-6 py-4">
                      {renderOrderActionButtons(true)}
                    </div>
                  )}
                </div>
                <div className="hidden lg:flex w-full lg:w-1/2 border rounded-lg overflow-hidden flex-col h-[600px]">

                  <OrderChat
                    orderId={orderId}
                    order={order}
                    counterpartyName={counterpartyNickname || t("common.user")}
                    counterpartyInitial={(counterpartyNickname || t("common.user")).charAt(0).toUpperCase()}
                    isClosed={["cancelled", "completed", "refunded"].includes(order?.status)}
                    isAttachmentUploadDisabled={shouldDisableChatAttachments(order, userId)}
                    counterpartyOnlineStatus={
                      isCurrentUserAdvertUser ? order?.user?.is_online : order?.advert?.user?.is_online
                    }
                    counterpartyLastOnlineAt={
                      isCurrentUserAdvertUser ? order?.user?.last_online_at : order?.advert?.user?.last_online_at
                    }
                    onOpenProofOfTransfer={() => setShowPaymentConfirmation(true)}
                  />

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComplaintForm
        isOpen={showComplaintForm}
        onClose={() => setShowComplaintForm(false)}
        onSubmit={handleSubmitComplaint}
        orderId={orderId}
        type={complainType}
      />
      <RatingSidebar
        isOpen={showRatingSidebar}
        onClose={() => setShowRatingSidebar(false)}
        orderId={orderId}
        onSubmit={handleSubmitReview}
        recommendLabel={t("orders.wouldYouRecommend", { role: counterpartyLabel.toLowerCase() })}
      />
      {isMobile && (
        <OrderDetailsSidebar isOpen={showDetailsSidebar} onClose={() => setShowDetailsSidebar(false)} order={order} />
      )}
      <PaymentConfirmationSidebar
        isOpen={showPaymentConfirmation}
        onClose={() => setShowPaymentConfirmation(false)}
        onConfirm={handlePayOrder}
        order={order}
        isLoading={isPaymentLoading}
      />
      <PaymentReceivedConfirmationSidebar
        isOpen={showPaymentReceivedConfirmation}
        onClose={() => setShowPaymentReceivedConfirmation(false)}
        onConfirm={() => {
          fetchOrderDetails()
          setShowPaymentReceivedConfirmation(false)
        }}
        orderId={orderId}
        isLoading={isConfirmLoading}
        otpRequested={otpRequested}
        setOtpRequested={setOtpRequested}
      />
    </div>
  )
}
