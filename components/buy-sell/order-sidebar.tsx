"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Alert } from "@/components/ui/alert"
import { InfoCircleIcon } from "@/components/icons/info-circle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { createOrder } from "@/services/api/api-orders"
import { ProfileAPI } from "@/services/api"
import { formatPaymentMethodName, cn, getHomeUrl } from "@/lib/utils"
import Image from "next/image"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { useUserDataStore } from "@/stores/user-data-store"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"
import { ALERT_INLINE_FLEX, ALERT_INLINE_TEXT } from "@/lib/rtl"
import { useWebSocketContext } from "@/contexts/websocket-context"
import {
  flattenUserPaymentMethodsPages,
  useAddPaymentMethod,
  useUserPaymentMethods,
  queryKeys,
  type PaymentMethodError,
  type UserPaymentMethodsPage,
} from "@/hooks/use-api-queries"
import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll"
import { useStablePaymentMethodOrder } from "@/hooks/use-stable-payment-method-order"
import { SelectedPaymentMethodsSection } from "@/components/payment-methods/selected-payment-methods-section"
import RateChangeConfirmation from "./rate-change-confirmation"
import AdUpdatedConfirmation from "./ad-updated-confirmation"
import { useTrackers } from "@/analytics/useTrackers"
import { mapOrderError } from "@/lib/orders/order-error-mapper"
import { createOrderErrorDispatcher } from "@/lib/orders/order-error-dispatcher"
import { OrderErrorAction } from "@/lib/orders/order-error-actions"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import { createPaymentMethodInvalidFieldValueAlertConfig } from "@/lib/payment-methods/create-payment-method-invalid-field-value-alert-config"
import { resolvePaymentMethodAccountFieldValue } from "@/lib/payment-methods/resolve-payment-method-account-field-value"
import {
  appendSelectedPaymentMethodId,
  filterPaymentMethodsForAdvert,
  getCreatedPaymentMethodId,
  getPaymentMethodSelectionLines,
  isPaymentMethodIdSelected,
  isUserPaymentMethodSelectionDisabled,
  mergeCreatedPaymentMethodIntoList,
  normalizePaymentMethodId,
  resolveSelectedUserPaymentMethodIds,
} from "@/lib/payment-methods/payment-method-selection-utils"

interface OrderSidebarProps {
  isOpen: boolean
  onClose: () => void
  onStartClose?: () => void
  ad: Advertisement | null
  orderType: "buy" | "sell"
  p2pBalance: number
}

interface PaymentMethod {
  id: string
  type: string
  display_name: string
  fields: Record<string, unknown>
  is_enabled: number
  method: string
}

interface SellerPaymentMethod {
  type: string
  method: string
}

const areStringArraysEqual = (first: string[] = [], second: string[] = []) => {
  if (first.length !== second.length) return false

  const sortedFirst = [...first].sort()
  const sortedSecond = [...second].sort()
  return sortedFirst.every((value, index) => value === sortedSecond[index])
}

const PaymentSelectionContent = ({
  userPaymentMethods,
  acceptedPaymentMethods,
  tempSelectedPaymentMethods,
  hideAlert,
  setSelectedPaymentMethods,
  setTempSelectedPaymentMethods,
  handleAddPaymentMethodClick,
  sellerPaymentMethods,
  onAddPaymentMethodWithType,
  scrollToPaymentMethodId,
}: {
  userPaymentMethods: PaymentMethod[]
  acceptedPaymentMethods?: string[]
  tempSelectedPaymentMethods: string[]
  hideAlert: () => void
  setSelectedPaymentMethods: (methods: string[]) => void
  setTempSelectedPaymentMethods: (methods: string[]) => void
  handleAddPaymentMethodClick: (currentSelection: string[]) => void
  sellerPaymentMethods: SellerPaymentMethod[]
  onAddPaymentMethodWithType?: (methodType: string) => void
  scrollToPaymentMethodId?: string
}) => {
  const { t } = useTranslations()
  const [selectedPMs, setSelectedPMs] = useState(tempSelectedPaymentMethods)
  /** Resets stable list order when the sheet selection source updates. */
  const [orderSessionKey, setOrderSessionKey] = useState(tempSelectedPaymentMethods)
  const lastScrolledPaymentMethodIdRef = useRef<string | null>(null)
  const {
    data: paymentMethodsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPaymentMethods()
  const handleLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])
  const { scrollRootRef, sentinelRef } = useLoadMoreOnScroll(
    !!hasNextPage,
    handleLoadMore,
    isFetchingNextPage,
  )

  useEffect(() => {
    setSelectedPMs(tempSelectedPaymentMethods)
    setOrderSessionKey(tempSelectedPaymentMethods)
  }, [tempSelectedPaymentMethods])

  // Live paginated list (alert props are a snapshot). Merge prop extras for just-created PMs.
  const compatibleMethods = useMemo(() => {
    const live = flattenUserPaymentMethodsPages(paymentMethodsPages) as PaymentMethod[]
    const filteredLive = filterPaymentMethodsForAdvert(live, acceptedPaymentMethods)
    const fromProps = userPaymentMethods
    if (filteredLive.length === 0) return fromProps

    const byId = new Map(
      filteredLive.map((method) => [normalizePaymentMethodId(method.id), method] as const),
    )
    for (const method of fromProps) {
      const id = normalizePaymentMethodId(method.id)
      if (!byId.has(id)) byId.set(id, method)
    }
    return Array.from(byId.values())
  }, [acceptedPaymentMethods, paymentMethodsPages, userPaymentMethods])

  const getMethodId = useCallback(
    (method: PaymentMethod) => normalizePaymentMethodId(method.id),
    [],
  )

  const sortedPaymentMethods = useStablePaymentMethodOrder(
    compatibleMethods,
    orderSessionKey,
    getMethodId,
    true,
  )

  useEffect(() => {
    if (!scrollToPaymentMethodId) return

    const normalizedId = normalizePaymentMethodId(scrollToPaymentMethodId)
    if (lastScrolledPaymentMethodIdRef.current === normalizedId) return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 30

    const tryScroll = () => {
      if (cancelled) return
      const root = scrollRootRef.current
      const target = root?.querySelector(
        `[data-payment-method-id="${normalizedId}"]`,
      ) as HTMLElement | null
      if (!root || !target) {
        if (attempts++ < maxAttempts) {
          window.requestAnimationFrame(tryScroll)
        }
        return
      }

      target.scrollIntoView({ block: "nearest" })
      lastScrolledPaymentMethodIdRef.current = normalizedId
    }

    window.requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
    }
  }, [scrollToPaymentMethodId, scrollRootRef, sortedPaymentMethods.length])

  const handlePaymentMethodToggle = (methodId: string | number) => {
    setSelectedPMs((prev) => {
      if (isPaymentMethodIdSelected(prev, methodId)) {
        return prev.filter((id) => !isPaymentMethodIdSelected([id], methodId))
      }
      if (isUserPaymentMethodSelectionDisabled(compatibleMethods, prev, methodId)) {
        return prev
      }
      return [...prev, normalizePaymentMethodId(methodId)]
    })
  }

  const handleAcceptedMethodClick = (method: SellerPaymentMethod) => {
    hideAlert()
    onAddPaymentMethodWithType?.(method.method)
  }

  return (
    <div
      data-testid="order-sidebar-modal-payment-methods"
      className="flex h-full min-h-0 w-full flex-1 flex-col"
    >
      {compatibleMethods.length > 0 && (
        <div className="shrink-0 pb-2 text-center text-grayscale-600 md:text-start">
          {t("paymentMethod.selectUpTo3")}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {compatibleMethods.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
            <div className="text-slate-1200">{t("paymentMethod.addCompatibleMethod")}</div>
            {sellerPaymentMethods && sellerPaymentMethods.length > 0 && (
              <div className="mt-4 space-y-3">
                {sellerPaymentMethods.map((method) => (
                  <Button
                    key={method.method}
                    type="button"
                    variant="ghost"
                    onClick={() => handleAcceptedMethodClick(method)}
                    className="h-auto w-full justify-start rounded-lg border border-grayscale-200 p-4 font-normal hover:bg-grayscale-300"
                  >
                    <span className="flex items-center gap-2">
                      <Image src="/icons/plus_icon.png" alt={t("common.plus")} width={14} height={24} />
                      <span className="text-base text-slate-1200">
                        {formatPaymentMethodName(method.method, t)}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
          <SelectedPaymentMethodsSection
            methods={compatibleMethods}
            selectedIds={selectedPMs}
            onRemove={handlePaymentMethodToggle}
          />
          {/* Mobile list gap: QuillSpacing.sm (8px) */}
          <div ref={scrollRootRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {sortedPaymentMethods.map((method) => {
            const methodId = normalizePaymentMethodId(method.id)
            const isSelected = isPaymentMethodIdSelected(selectedPMs, methodId)
            const isDisabled = isUserPaymentMethodSelectionDisabled(
              compatibleMethods,
              selectedPMs,
              methodId,
            )
            const lines = getPaymentMethodSelectionLines(method, t)

            return (
              <div
                key={methodId}
                data-payment-method-id={methodId}
                className={`bg-grayscale-500 rounded-lg ps-6 pe-6 py-4 cursor-pointer hover:bg-grayscale-300 transition-colors ${isSelected ? "border border-black" : ""
                  } ${isDisabled
                    ? "opacity-30 cursor-not-allowed hover:bg-grayscale-300"
                    : ""
                  }`}
                onClick={() => {
                  if (!isDisabled) {
                    handlePaymentMethodToggle(methodId)
                  }
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className={`h-3 w-3 shrink-0 rounded-full ${method.type === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                        }`}
                    />
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="truncate text-base leading-6 text-slate-1200">{lines.title}</span>
                      {lines.subtitle ? (
                        <span className="truncate text-xs leading-4 text-grayscale-text-muted">{lines.subtitle}</span>
                      ) : null}
                    </div>
                  </div>
                  <Checkbox
                    data-testid={`order-sidebar-checkbox-payment-${methodId}`}
                    checked={isSelected}
                    onCheckedChange={() => handlePaymentMethodToggle(methodId)}
                    disabled={isDisabled}
                    className="shrink-0 border-neutral-7 data-[state=checked]:bg-black data-[state=checked]:border-black w-[20px] h-[20px] rounded-sm border-[2px] disabled:opacity-30 disabled:cursor-not-allowed pointer-events-none"
                  />
                </div>
              </div>
            )
          })}

        {hasNextPage && (
          <div ref={sentinelRef} className="h-1 w-full" data-testid="order-sidebar-payment-methods-sentinel" />
        )}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-grayscale-400 border-t-slate-600" />
          </div>
        )}

        {compatibleMethods.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            data-testid="order-sidebar-link-add-payment"
            className="h-auto w-full justify-start rounded-lg border border-grayscale-200 p-4 font-normal"
            onClick={() => {
              handleAddPaymentMethodClick(selectedPMs)
            }}
          >
            <span className="flex items-center">
              <Image src="/icons/plus_icon.png" alt={t("common.plus")} width={14} height={24} className="me-2" />
              <span className="text-slate-1200 text-base font-normal">
                {t("paymentMethod.addPaymentMethod")}
              </span>
            </span>
          </Button>
        )}
          </div>
          </>
        )}
      </div>
      <div className="shrink-0 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <Button
          data-testid="order-sidebar-btn-confirm-payment"
          className="w-full"
          disabled={selectedPMs.length === 0}
          onClick={() => {
            const confirmedSelection = resolveSelectedUserPaymentMethodIds(
              selectedPMs,
              compatibleMethods,
            )
            setSelectedPaymentMethods(confirmedSelection)
            setTempSelectedPaymentMethods(confirmedSelection)
            hideAlert()
          }}
        >
          {t("common.confirm")}
        </Button>
      </div>
    </div>
  )
}

export default function OrderSidebar({ isOpen, onClose, onStartClose, ad, orderType, p2pBalance }: OrderSidebarProps) {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const isMobile = useIsMobile()
  const [amount, setAmount] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [userPaymentMethods, setUserPaymentMethods] = useState<PaymentMethod[]>([])
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState<SellerPaymentMethod[]>([])
  const [tempSelectedPaymentMethods, setTempSelectedPaymentMethods] = useState<string[]>([])
  const { hideAlert, showAlert } = useAlertDialog()
  const { toast } = useToast()
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string | undefined>()
  const userData = useUserDataStore((state) => state.userData)
  const {
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    requestExchangeRate,
    subscribe,
    isConnected
  } = useWebSocketContext()
  const [localAd, setLocalAd] = useState<Advertisement | null>(ad)
  const localAdRef = useRef(localAd)
  const [marketRate, setMarketRate] = useState<number | null>(null)
  const [showRateChangeConfirmation, setShowRateChangeConfirmation] = useState(false)
  const [lockedConfirmationRate, setLockedConfirmationRate] = useState<number | null>(null)
  const [hasAdvertUpdated, setHasAdvertUpdated] = useState(false)
  const [showAdUpdatedModal, setShowAdUpdatedModal] = useState(false)
  const { track } = useTrackers()
  const [pendingAdvertUpdate, setPendingAdvertUpdate] = useState<Advertisement | null>(null)
  const [pendingRateUpdate, setPendingRateUpdate] = useState<{ effective_rate: number; effective_rate_display: number; version: number } | null>(null)

  // Use React Query hooks
  const addPaymentMethod = useAddPaymentMethod()
  const { data: paymentMethodsResponse } = useUserPaymentMethods(isOpen)
  const queryClient = useQueryClient()

  const clearSelectedPaymentMethods = () => {
    setSelectedPaymentMethods([])
    setTempSelectedPaymentMethods([])
  }

  // Sync local ad copy with prop — keeps localAd current when parent updates the ad
  useEffect(() => {
    setLocalAd(ad)
  }, [ad])

  // Keep ref in sync so the WebSocket callback always reads the latest localAd
  useEffect(() => {
    localAdRef.current = localAd
  }, [localAd])

  const adId = ad?.id
  useEffect(() => {
    if (isOpen && ad && ad.payment_currency && ad.account_currency && isConnected) {
      let requestTimer: ReturnType<typeof setTimeout> | undefined

      if (ad.exchange_rate_type === "float") {
        joinExchangeRatesChannel(ad.account_currency, ad.payment_currency)
        requestTimer = setTimeout(() => {
          requestExchangeRate(ad.account_currency, ad.payment_currency)
        }, 400)
      }

      const unsubscribe = subscribe((data) => {
        const current = localAdRef.current
        if (!current) return

        if (current.exchange_rate_type === "float") {
          const expectedChannel = `exchange_rates/${current.account_currency}/${current.payment_currency}`
          if (data.options.channel === expectedChannel && data.payload?.rate) {
            setMarketRate(data.payload.rate * ((current.exchange_rate / 100) + 1))
          } else if (data.options.channel === expectedChannel && data.payload?.data?.rate) {
            const rawRate = data.payload.data.rate
            setLocalAd((prev) => {
              if (!prev) return null
              const computedRate = rawRate * ((prev.exchange_rate / 100) + 1)
              setMarketRate(computedRate)
              return { ...prev, effective_rate_display: computedRate }
            })
          }
        }

        if (data?.options?.channel?.startsWith("adverts/currency/")) {
          if (data?.payload?.data?.event === "update" && data?.payload?.data?.advert) {
            const updatedAdvert = data.payload.data.advert
            const updatedFields: string[] = data.payload.data.updated_fields || []
            if (current.id === updatedAdvert.id) {
              const rateFields = new Set(["exchange_rate", "effective_rate", "effective_rate_display"])
              const nonRateFields = new Set(["minimum_order_amount", "actual_maximum_order_amount", "description", "payment_methods", "payment_method_names", "order_expiry_period"])
              const hasRateChanges = updatedFields.some((f) => rateFields.has(f))
              const hasNonRateChanges = updatedFields.some((f) => nonRateFields.has(f))
              if (hasRateChanges) {
                setPendingRateUpdate({
                  effective_rate: updatedAdvert.effective_rate ?? updatedAdvert.exchange_rate,
                  effective_rate_display: updatedAdvert.effective_rate_display ?? updatedAdvert.exchange_rate,
                  version: updatedAdvert.version,
                })
              }
              if (hasNonRateChanges) {
                setPendingAdvertUpdate(updatedAdvert)
                setHasAdvertUpdated(true)
              }
            }
          }
        }
      })

      return () => {
        if (requestTimer) clearTimeout(requestTimer)
        if (ad.exchange_rate_type === "float") {
          leaveExchangeRatesChannel(ad.account_currency, ad.payment_currency)
        }
        unsubscribe()
      }
    }
  }, [isOpen, adId, isConnected])

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setOrderStatus(null)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (localAd && amount) {
      const numAmount = Number.parseFloat(amount)
      const exchangeRate = localAd.effective_rate_display || 0
      const total = numAmount * exchangeRate
      setTotalAmount(total)

      const minLimit = localAd.minimum_order_amount || "0.00"
      const maxLimit = localAd.actual_maximum_order_amount || "0.00"

      if (orderType === "buy" && numAmount > p2pBalance) {
        setValidationError(t("order.insufficientBalance"))
      } else if (numAmount < minLimit || numAmount > maxLimit) {
        setValidationError(t("order.orderLimitError", { min: minLimit, max: maxLimit, currency: localAd.account_currency }))
      } else {
        setValidationError(null)
      }
    }

    if (!amount) setTotalAmount(0)
  }, [amount, localAd, orderType, p2pBalance, t, marketRate])

  const handleAddPaymentMethodWithType = useCallback((methodType: string) => {
    setSelectedPaymentMethodType(methodType)
    setShowAddPaymentPanel(true)
  }, [])

  const handleAddPaymentMethodClick = useCallback((currentSelection: string[]) => {
    setTempSelectedPaymentMethods(currentSelection)
    setShowAddPaymentPanel(true)
    hideAlert()
  }, [hideAlert])

  const openPaymentSelection = useCallback(
    (
      selectionOverride?: string[],
      methodsOverride?: PaymentMethod[],
      scrollToPaymentMethodId?: string,
    ) => {
      const currentSelection = selectionOverride ?? tempSelectedPaymentMethods
      const methodsForSheet = methodsOverride ?? userPaymentMethods

      track("ek_select_payment_method_markets_advert_sheet")
      showAlert({
        title: t("paymentMethod.title"),
        titleAlign: "center",
        mobileSheetClassName:
          "!mt-0 h-[90dvh] max-h-[90dvh] z-[60]",
        mobileSheetFullHeight: true,
        mobileContentClassName:
          "flex min-h-0 flex-1 flex-col w-full min-w-0 max-w-full overflow-hidden",
        // Keep the desktop dialog body stable (empty / no selection).
        contentClassName: "h-[min(560px,60vh)]",
        content: (
          <PaymentSelectionContent
            userPaymentMethods={methodsForSheet}
            acceptedPaymentMethods={localAd?.payment_methods}
            tempSelectedPaymentMethods={currentSelection}
            setSelectedPaymentMethods={setSelectedPaymentMethods}
            hideAlert={hideAlert}
            handleAddPaymentMethodClick={handleAddPaymentMethodClick}
            setTempSelectedPaymentMethods={setTempSelectedPaymentMethods}
            sellerPaymentMethods={sellerPaymentMethods}
            onAddPaymentMethodWithType={handleAddPaymentMethodWithType}
            scrollToPaymentMethodId={scrollToPaymentMethodId}
          />
        ),
      })
    },
    [
      handleAddPaymentMethodClick,
      handleAddPaymentMethodWithType,
      hideAlert,
      localAd?.payment_methods,
      sellerPaymentMethods,
      showAlert,
      t,
      tempSelectedPaymentMethods,
      track,
      userPaymentMethods,
    ],
  )

  const handleShowPaymentSelection = () => {
    openPaymentSelection()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const handleSubmit = async () => {
    if (!localAd) return

    track("ek_place_order_markets_advert_sheet")

    if (hasAdvertUpdated) {
      setShowAdUpdatedModal(true)
      return
    }

    if (pendingRateUpdate) {
      setLockedConfirmationRate(pendingRateUpdate.effective_rate)
      setShowRateChangeConfirmation(true)
      return
    }

    if (localAd.exchange_rate_type === "float" && marketRate && marketRate !== localAd.effective_rate) {
      track("ek_order_rate_slippage_detected_markets_advert_sheet")
      setLockedConfirmationRate(marketRate)
      setShowRateChangeConfirmation(true)
      return
    }

    await proceedWithOrder()
  }

  const handleAdvertUpdateConfirm = () => {
    if (localAd && pendingAdvertUpdate) {
      const paymentMethodsChanged =
        !areStringArraysEqual(localAd.payment_methods, pendingAdvertUpdate.payment_methods) ||
        !areStringArraysEqual(localAd.payment_method_names, pendingAdvertUpdate.payment_method_names)

      if (paymentMethodsChanged) {
        clearSelectedPaymentMethods()
      }

      setLocalAd({
        ...localAd,
        minimum_order_amount: pendingAdvertUpdate.minimum_order_amount,
        actual_maximum_order_amount: pendingAdvertUpdate.actual_maximum_order_amount,
        description: pendingAdvertUpdate.description,
        payment_methods: pendingAdvertUpdate.payment_methods,
        payment_method_names: pendingAdvertUpdate.payment_method_names,
        order_expiry_period: pendingAdvertUpdate.order_expiry_period,
        version: pendingAdvertUpdate.version,
      })
    }
    setPendingAdvertUpdate(null)
    setHasAdvertUpdated(false)
    setShowAdUpdatedModal(false)
  }

  const proceedWithOrder = async () => {
    if (!localAd) return

    try {
      setIsSubmitting(true)
      setOrderStatus(null)
      setShowRateChangeConfirmation(false)

      const numAmount = Number.parseFloat(amount ?? "0")

      const rateToUse = lockedConfirmationRate || marketRate
      const confirmedVersion = pendingRateUpdate?.version ?? localAd.version
      if (lockedConfirmationRate) {
        setMarketRate(lockedConfirmationRate)
        setLocalAd((prev) => prev ? {
          ...prev,
          effective_rate: lockedConfirmationRate,
          effective_rate_display: lockedConfirmationRate,
          version: confirmedVersion,
        } : null)
        setLockedConfirmationRate(null)
        setPendingRateUpdate(null)
      }
      const order = await createOrder(localAd.id, rateToUse ?? 0, numAmount, selectedPaymentMethods, confirmedVersion)
      if (order.errors.length > 0) {
        const errorCode = order.errors[0].code
        track("ek_order_creation_failed_markets_advert_sheet", { error_code: errorCode, error_message: errorCode })

        // Special-case branches that don't fit the mapper's generic shape.
        if (errorCode === "OrderAdvertVersionChanged") {
          clearSelectedPaymentMethods()
          setShowAdUpdatedModal(true)
        } else if (errorCode === "OrderFloatRateSlippage" || errorCode === "OrderCreateFailRateSlippage") {
          track("ek_order_rate_slippage_server_markets_advert_sheet")
          setLockedConfirmationRate(marketRate ?? localAd.effective_rate ?? null)
          setShowRateChangeConfirmation(true)
        } else {
          // Mapper-driven path: every other code routes through mapOrderError +
          // dispatchOrderErrorAction. The dispatcher is the single place that
          // wires CTA actions (route, intercom, retry, list-invalidate, etc).
          const isV1Signup = userData?.signup === "v1"
          const existingOrderId = (order.errors[0]?.detail?.order_id as number | undefined)

          const dispatch = createOrderErrorDispatcher({
            queryClient,
            router,
            handleClose,
            track,
            retry: proceedWithOrder,
            isV1Signup,
            advertisementsQueryKey: queryKeys.buySell.advertisements(),
            getHomeUrl,
          })

          const err = mapOrderError(errorCode, t, {
            isBuyAdvert: orderType === "buy",
            accountCurrency: localAd.account_currency,
            paymentCurrency: localAd.payment_currency,
          })

          showAlert({
            title: err.title,
            description: err.message,
            confirmText: err.primaryCta,
            cancelText: err.secondaryCta,
            type: "warning",
            hideCloseButton: err.primaryAction === OrderErrorAction.GoToMarkets,
            preventOutsideClose: err.primaryAction === OrderErrorAction.GoToMarkets,
            onConfirm: () => dispatch(err.primaryAction, { orderId: existingOrderId }),
            onCancel: err.secondaryAction
              ? () => dispatch(err.secondaryAction!, { orderId: existingOrderId })
              : undefined,
          })
        }
      } else {
        track("ek_order_created_markets_advert_sheet")
        router.push("/orders/" + order.data.id)
      }
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "Unknown Error"
      track("ek_order_creation_failed_markets_advert_sheet", { error_code: "order_creation_error", error_message: errorCode })
      setOrderStatus({
        success: false,
        message: t("order.createOrderFailed", { code: errorCode }),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    track("ek_close_markets_advert_sheet")
    onStartClose?.()
    setIsAnimating(false)
    setTimeout(() => {
      setTotalAmount(0)
      setSelectedPaymentMethods([])
      setAmount(null)
      setValidationError(null)
      setTempSelectedPaymentMethods([])
      setShowRateChangeConfirmation(false)
      setLockedConfirmationRate(null)
      setPendingRateUpdate(null)
      setHasAdvertUpdated(false)
      setPendingAdvertUpdate(null)
      setShowAdUpdatedModal(false)
      onClose()
    }, 300)
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      const result = await addPaymentMethod.mutateAsync({ method, fields })

      setShowAddPaymentPanel(false)

      await queryClient.refetchQueries({ queryKey: queryKeys.auth.userPaymentMethods() })

      const created = result.data as PaymentMethod | undefined
      const createdId = getCreatedPaymentMethodId(created)
      const acceptedMethods = localAd?.payment_methods

      const refetchedMethods = flattenUserPaymentMethodsPages(
        queryClient.getQueryData<InfiniteData<UserPaymentMethodsPage>>(
          queryKeys.auth.userPaymentMethods(),
        ),
      ) as PaymentMethod[]

      const refetchedCompatible = filterPaymentMethodsForAdvert(refetchedMethods, acceptedMethods)
      const baseList = refetchedCompatible.length > 0 ? refetchedCompatible : userPaymentMethods

      const nextUserPaymentMethods = mergeCreatedPaymentMethodIntoList(
        baseList,
        created,
        acceptedMethods,
      )

      setUserPaymentMethods(nextUserPaymentMethods)

      let nextSelection = tempSelectedPaymentMethods

      if (createdId) {
        nextSelection = appendSelectedPaymentMethodId(
          tempSelectedPaymentMethods,
          createdId,
          3,
          nextUserPaymentMethods,
        )
        setSelectedPaymentMethods(nextSelection)
        setTempSelectedPaymentMethods(nextSelection)
      }

      openPaymentSelection(nextSelection, nextUserPaymentMethods, createdId)

      const createdMethodName = created?.display_name || formatPaymentMethodName(method, t)

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
            <span>{t("profile.paymentMethodAddedWithName", { methodName: createdMethodName })}</span>
          </div>
        ),
        className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
        duration: 2500,
      })
    } catch (err) {
      const error = err as PaymentMethodError
      const errorCode = error?.errors?.[0]?.code

      if (errorCode === "PaymentMethodDuplicate") {
        showAlert(
          createPaymentMethodDuplicateAlertConfig(t, {
            onManage: () => {
              hideAlert()
              setShowAddPaymentPanel(false)
              router.push("/profile?tab=payment")
            },
          }),
        )
        return
      }

      if (error.errors?.[0]?.code === "PaymentMethodInvalidFieldValue") {
        showAlert(
          createPaymentMethodInvalidFieldValueAlertConfig(t, {
            fieldValue: resolvePaymentMethodAccountFieldValue(fields, t),
            onEdit: () => hideAlert(),
            onCancel: () => {
              hideAlert()
              setShowAddPaymentPanel(false)
            },
          }),
        )
        return
      }

      showAlert({
        title: t("paymentMethod.unableToAdd"),
        description: t("paymentMethod.addError"),
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const getSelectedPaymentMethodsText = () => {
    if (selectedPaymentMethods.length === 0) return t("order.receivePaymentTo")
    if (selectedPaymentMethods.length === 1) {
      const method = userPaymentMethods.find((m) =>
        normalizePaymentMethodId(m.id) === normalizePaymentMethodId(selectedPaymentMethods[0]),
      )
      return method ? `${method.display_name}` : t("order.receivePaymentTo")
    }
    return t("order.selected") + ` (${selectedPaymentMethods.length})`
  }

  const isBuy = orderType === "buy"
  const title = isBuy ? `${t("common.sell")} USD` : `${t("common.buy")} USD`
  const youSendText = isBuy ? t("order.youReceive") : t("order.youPay")

  const minLimit = localAd?.minimum_order_amount || "0.00"
  const maxLimit = localAd?.actual_maximum_order_amount || "0.00"

  // Filter and transform user payment methods based on ad's accepted methods
  const filteredPaymentMethods = useMemo(() => {
    const allMethods = flattenUserPaymentMethodsPages(paymentMethodsResponse)
    if (allMethods.length === 0 || !localAd?.payment_methods) return []

    return filterPaymentMethodsForAdvert(allMethods, localAd.payment_methods)
  }, [paymentMethodsResponse, localAd?.payment_methods])

  // Set user payment methods and seller payment methods.
  // Always sync even when empty — clears stale choices when advert payment methods are removed.
  useEffect(() => {
    setUserPaymentMethods(filteredPaymentMethods)

    const buyerAcceptedMethods = localAd?.payment_methods || []
    const sellerMethods: SellerPaymentMethod[] = buyerAcceptedMethods.map((method: string) => ({
      type: method.toLowerCase().includes("bank") ? "bank" : "ewallet",
      method: method,
    }))
    setSellerPaymentMethods(sellerMethods)
  }, [filteredPaymentMethods, localAd?.payment_methods])

  // Prune any selected payment method IDs that are no longer compatible with the updated advert.
  // Uses functional setState so this effect only depends on filteredPaymentMethods,
  // avoiding the self-referential dependency loop that would occur if selectedPaymentMethods
  // or tempSelectedPaymentMethods were listed here.
  useEffect(() => {
    const compatiblePaymentMethodIds = new Set(filteredPaymentMethods.map((method: PaymentMethod) => method.id))

    setSelectedPaymentMethods((current: string[]) => {
      const next = current.filter((id: string) => compatiblePaymentMethodIds.has(id))
      return areStringArraysEqual(current, next) ? current : next
    })

    setTempSelectedPaymentMethods((current: string[]) => {
      const next = current.filter((id: string) => compatiblePaymentMethodIds.has(id))
      return areStringArraysEqual(current, next) ? current : next
    })
  }, [filteredPaymentMethods])

  if (!isOpen && !isAnimating) return null

  return (
    <>
      <div data-testid="order-sidebar-container" className="fixed inset-0 z-50 flex justify-end">
        <div
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
          onClick={handleClose}
        />
        <div
          className={`relative w-full bg-white h-full transform transition-transform duration-300 ease-in-out ${isOpen && isAnimating ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {localAd && (
            <div className="flex flex-col h-full max-w-xl mx-auto">
              <div className="flex items-center justify-end px-4 py-3">
                <Button data-testid="order-sidebar-btn-close" onClick={handleClose} variant="ghost" size="sm" className="bg-grayscale-300 px-1">
                  <Image src="/icons/close-circle.png" alt={t("common.close")} width={24} height={24} />
                </Button>
              </div>

              <div className="flex flex-col h-auto overflow-y-auto">
                <div className="p-4 pb-0">
                  <Alert variant="warning" className={ALERT_INLINE_FLEX} dir={dir}>
                    <InfoCircleIcon className="size-5 shrink-0 mt-0.5" />
                    <div className={ALERT_INLINE_TEXT}>
                      <h3 className="font-bold text-sm mb-1">
                        {t("order.secureTradeReminder.title")}
                      </h3>
                      <div className="text-sm">
                        {t("order.secureTradeReminder.description")}
                      </div>
                    </div>
                  </Alert>
                </div>
                <h2 className="text-xl font-bold p-4 pb-0">{title}</h2>
                <div className="p-4">
                  <div className="mb-4">
                    <Input
                      data-testid="order-sidebar-input-amount"
                      value={amount}
                      onChange={handleAmountChange}
                      type="number"
                      className={cn(
                        "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0",
                        validationError && "border-red-500 focus:border-red-500 focus-visible:ring-0",
                      )}
                      step="any"
                      inputMode="decimal"
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      placeholder="0.00"
                      variant="floatingCurrency"
                      currency={localAd.account_currency}
                      label={t("order.amount")}
                    />
                  </div>
                  {validationError && <p data-testid="order-sidebar-error-amount" className="text-sm text-red-500 mb-2">{validationError}</p>}
                  <div className="flex items-center">
                    <span className="text-grayscale-text-muted">{youSendText}:&nbsp;</span>
                    <span className="text-slate-1200 font-bold">
                      {Number.parseFloat(totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {localAd.payment_currency}
                    </span>
                  </div>
                </div>

                {isBuy && (
                  <div className="mx-4 mt-4 pb-6 border-b">
                    <Button
                      type="button"
                      variant="ghost"
                      data-testid="order-sidebar-btn-select-payment"
                      className="flex h-[56px] w-full items-center justify-between rounded-lg border border-gray-200 px-4 font-normal hover:bg-gray-50"
                      onClick={handleShowPaymentSelection}
                    >
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-[1px]">
                        {selectedPaymentMethods.length > 0 && (
                          <span className="text-xs font-normal text-black/[0.72]">
                            {t("order.receivePaymentTo")}
                          </span>
                        )}
                        <span
                          data-testid="order-sidebar-text-payment-method"
                          className="text-base font-normal text-black/[0.72]"
                        >
                          {getSelectedPaymentMethodsText()}
                        </span>
                      </span>
                      <Image
                        src="/icons/chevron-down.png"
                        alt={t("common.arrow")}
                        width={24}
                        height={24}
                        className="ms-2 shrink-0 transition-transform duration-200"
                      />
                    </Button>
                  </div>
                )}

                <div className="mx-4 mt-4 text-sm">
                  <div className="flex justify-between items-center gap-4 mb-2">
                    <span className="text-grayscale-text-muted shrink-0">{t("order.rateType")}</span>
                    <span className="bg-blue-50 text-blue-800 capitalize text-xs rounded-sm p-1 shrink-0">
                      {localAd.exchange_rate_type === "float" ? t("order.rateFloating") : t("order.rateFixed")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4 mb-2">
                    <span className="text-grayscale-text-muted shrink-0">{t("order.exchangeRate")}</span>
                    <ExchangeRateDisplay
                      className="text-slate-1200 shrink-0"
                      rate={localAd.effective_rate_display}
                      paymentCurrency={localAd.payment_currency}
                      accountCurrency={localAd.account_currency}
                      formatRate={false}
                    />
                  </div>
                  <div className="flex justify-between items-center gap-4 mb-2">
                    <span className="text-grayscale-text-muted shrink-0">{t("order.orderLimit")}</span>
                    <span className="text-slate-1200 shrink-0">
                      {minLimit} - {maxLimit} {localAd.account_currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4 mb-2">
                    <span className="text-grayscale-text-muted shrink-0">{t("order.paymentTime")}</span>
                    <span className="text-slate-1200 shrink-0">
                      <bdi dir="ltr">{localAd.order_expiry_period}</bdi> {t("market.min")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4 mb-2">
                    <span className="text-grayscale-text-muted shrink-0">
                      {isBuy ? t("order.buyer") : t("order.seller")}
                    </span>
                    <span className="text-slate-1200 shrink-0">{localAd.user?.nickname}</span>
                  </div>
                </div>

                <div className="border-t border-[#E9ECEF] m-4 mb-0 pt-4 text-sm">
                  <h3 className="text-grayscale-text-muted mb-2 text-start">
                    {isBuy ? t("order.buyersPaymentMethods") : t("order.sellersPaymentMethods")}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {localAd.payment_methods?.map((method) => (
                      <div key={method} className="flex items-center min-w-0">
                        <div
                          className={`h-2 w-2 shrink-0 rounded-full me-2 ${method.toLowerCase().includes("bank") ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                            }`}
                        />
                        <span className="text-slate-1200 text-start truncate">
                          {formatPaymentMethodName(method, t)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-4 mt-4 border-t border-[#E9ECEF] py-2 text-sm">
                  <h3 className="text-grayscale-text-muted">
                    {isBuy ? t("order.buyersInstructions") : t("order.sellersInstructions")}
                  </h3>
                  <p className="text-slate-1200 break-words mt-2">
                    {localAd.description || "-"}
                  </p>
                </div>

                <div className="mt-auto p-4 flex justify-end">
                  <Button
                    data-testid="order-sidebar-btn-place-order"
                    className="w-full md:w-auto"
                    variant="default"
                    onClick={handleSubmit}
                    disabled={
                      !amount || (isBuy && selectedPaymentMethods.length === 0) || !!validationError || isSubmitting
                    }
                  >
                    {isSubmitting ? (
                      <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
                    ) : (
                      t("order.placeOrder")
                    )}
                  </Button>
                  {orderStatus && !orderStatus.success && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{orderStatus.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={addPaymentMethod.isPending}
          allowedPaymentMethods={localAd?.payment_methods}
          onClose={() => {
            setShowAddPaymentPanel(false)
            setSelectedPaymentMethodType(undefined)
          }}
          selectedMethod={selectedPaymentMethodType}
        />
      )}

      <AdUpdatedConfirmation
        isOpen={showAdUpdatedModal}
        onConfirm={handleAdvertUpdateConfirm}
        onCancel={() => setShowAdUpdatedModal(false)}
      />

      {localAd && (
        <RateChangeConfirmation
          isOpen={showRateChangeConfirmation}
          onConfirm={() => { track("ek_confirm_rate_change_markets_advert_sheet"); proceedWithOrder() }}
          onCancel={() => {
            track("ek_cancel_rate_change_markets_advert_sheet")
            setShowRateChangeConfirmation(false)
            setLockedConfirmationRate(null)
          }}
          amount={amount || "0"}
          accountCurrency={localAd.account_currency}
          paymentCurrency={localAd.payment_currency}
          oldRate={localAd.effective_rate ?? localAd.exchange_rate ?? 0}
          newRate={lockedConfirmationRate ?? 0}
          isBuy={isBuy}
        />
      )}
    </>
  )
}
