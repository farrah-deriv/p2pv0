"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { useStablePaymentMethodOrder } from "@/hooks/use-stable-payment-method-order"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomShimmer } from "@/app/profile/components/ui/custom-shimmer"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { getPaymentMethodColour } from "@/lib/utils"
import { getPaymentMethodSelectionLines } from "@/lib/payment-methods/payment-method-selection-utils"
import Image from "next/image"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { usePaymentSelection } from "./payment-selection-context"
import {
  flattenUserPaymentMethodsPages,
  useAddPaymentMethod,
  isPaymentMethodElevationCancelled,
  useUserPaymentMethods,
  type PaymentMethodError,
} from "@/hooks/use-api-queries"
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll"
import { useTranslations } from "@/lib/i18n/use-translations"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import { createPaymentMethodInvalidFieldValueAlertConfig } from "@/lib/payment-methods/create-payment-method-invalid-field-value-alert-config"
import { resolvePaymentMethodAccountFieldValue } from "@/lib/payment-methods/resolve-payment-method-account-field-value"
import {
  isPaymentMethodIdSelected,
  isUserPaymentMethodSelectionDisabled,
  normalizePaymentMethodId,
} from "@/lib/payment-methods/payment-method-selection-utils"

interface PaymentMethod {
  id: number
  method: string
  type: string
  display_name: string
  fields: Record<string, unknown>
  created_at?: number
  is_default?: boolean
}

const AdPaymentMethods = () => {
  const { selectedPaymentMethodIds, togglePaymentMethod } = usePaymentSelection()
  const { hideAlert, showAlert } = useAdvertAlertDialog()
  const { t } = useTranslations()
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)

  // Use React Query hooks
  const addPaymentMethod = useAddPaymentMethod()
  const {
    data: paymentMethodsResponse,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPaymentMethods(true)
  const handleLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])
  const { sentinelRef } = useLoadMoreOnScroll(!!hasNextPage, handleLoadMore, isFetchingNextPage)
  const horizontalListRef = useRef<HTMLDivElement | null>(null)

  // Transform API response to PaymentMethod format
  const paymentMethods = useMemo(
    () => flattenUserPaymentMethodsPages(paymentMethodsResponse) as PaymentMethod[],
    [paymentMethodsResponse],
  )

  // Session key frozen on mount / step entry — stable order, no pin-to-top.
  const [orderPinIds] = useState(selectedPaymentMethodIds)
  const getMethodId = useCallback(
    (method: PaymentMethod) => normalizePaymentMethodId(method.id),
    [],
  )
  const sortedPaymentMethods = useStablePaymentMethodOrder(
    paymentMethods,
    orderPinIds,
    getMethodId,
    true,
  )

  const handleCheckboxChange = (methodId: number, checked: boolean) => {
    if (
      checked &&
      isUserPaymentMethodSelectionDisabled(paymentMethods, selectedPaymentMethodIds, methodId)
    ) {
      return
    }

    togglePaymentMethod(normalizePaymentMethodId(methodId))
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      const result = await addPaymentMethod.mutateAsync({ method, fields })
      const created = result.data as PaymentMethod | undefined
      if (
        created &&
        !isPaymentMethodIdSelected(selectedPaymentMethodIds, created.id) &&
        !isUserPaymentMethodSelectionDisabled(
          [...paymentMethods, created],
          selectedPaymentMethodIds,
          created.id,
        )
      ) {
        togglePaymentMethod(normalizePaymentMethodId(created.id))
      }
      setShowAddPaymentPanel(false)
      // Newly added methods sort to the selected/top group after refetch; reset scroll.
      requestAnimationFrame(() => {
        horizontalListRef.current?.scrollTo({ left: 0, behavior: "smooth" })
      })
    } catch (err) {
      const error = err as PaymentMethodError
      if (isPaymentMethodElevationCancelled(error)) return
      const errorCode = error?.errors?.[0]?.code

      if (errorCode === "PaymentMethodDuplicate") {
        showAlert(
          createPaymentMethodDuplicateAlertConfig(t, {
            onManage: () => {
              setShowAddPaymentPanel(false)
            },
            onCancel: () => {
              setShowAddPaymentPanel(false)
            },
          }),
        )
        return
      }

      if (errorCode === "PaymentMethodInvalidFieldValue") {
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

      if (errorCode === "PaymentMethodNotFound") {
        showAlert({
          title: t("paymentMethod.notFound"),
          description: t("paymentMethod.notFoundDescription"),
          confirmText: t("paymentMethod.addPaymentMethod"),
          cancelText: t("common.cancel"),
          type: "warning",
          onConfirm: () => setShowAddPaymentPanel(false),
          onCancel: () => setShowAddPaymentPanel(false),
          onClose: () => setShowAddPaymentPanel(false),
        })
        return
      }

      const errorMessages: Record<string, { title: string; description: string }> = {
        PaymentMethodInvalid: { title: t("paymentMethod.invalidMethod"), description: t("paymentMethod.invalidMethodDescription") },
        PaymentMethodInvalidField: { title: t("paymentMethod.invalidField"), description: t("paymentMethod.invalidFieldDescription") },
        PaymentMethodRequiredField: { title: t("paymentMethod.requiredField"), description: t("paymentMethod.requiredFieldDescription") },
      }

      const { title, description } = (typeof errorCode === "string" ? errorMessages[errorCode] : undefined) ?? {
        title: t("paymentMethod.unableToAdd"),
        description: t("paymentMethod.addError"),
      }

      showAlert({
        title,
        description,
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const handleShowAddPaymentMethod = () => {
    setShowAddPaymentPanel(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <CustomShimmer className="h-6 w-48" />
          <CustomShimmer className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CustomShimmer className="h-24 w-full" />
          <CustomShimmer className="h-24 w-full" />
          <CustomShimmer className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{t("paymentMethod.selectPaymentMethod")}</h3>
        <p className="text-neutral-7 mb-4">{t("paymentMethod.selectUpTo3")}</p>

        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          <div
            ref={horizontalListRef}
            className="flex gap-4 overflow-x-auto pb-2 md:contents"
          >
            {sortedPaymentMethods.map((method) => {
              const isSelected = isPaymentMethodIdSelected(selectedPaymentMethodIds, method.id)
              const lines = getPaymentMethodSelectionLines(method, t)
              const isDisabled = isUserPaymentMethodSelectionDisabled(
                paymentMethods,
                selectedPaymentMethodIds,
                method.id,
              )

              return (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all duration-200 flex-shrink-0 w-64 md:w-auto ${
                    isSelected ? "border-2 rounded-lg border-black" : "border-0"
                  } ${
                    isDisabled ? "bg-grayscale-700 opacity-50 cursor-not-allowed" : "bg-grayscale-300"
                  } hover:shadow-md`}
                  onClick={() => !isDisabled && handleCheckboxChange(method.id, !isSelected)}
                >
                  <CardContent className="ps-6 pe-6 py-4 cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className={`${getPaymentMethodColour(method.type)} shrink-0 rounded-full h-2 w-2`} />
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="truncate text-base leading-6 font-normal text-neutral-10">{lines.title}</span>
                          {lines.subtitle ? (
                            <span className="truncate text-xs leading-4 text-grayscale-text-muted">{lines.subtitle}</span>
                          ) : null}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto shrink-0">
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          className="rounded-[2px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 w-64 md:w-auto border border-grayscale-400 bg-white"
              onClick={handleShowAddPaymentMethod}
            >
              <CardContent className="p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <Image
                    src="/icons/plus_icon.png"
                    alt={t("paymentMethod.addPaymentMethod")}
                    width={14}
                    height={24}
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm text-neutral-10">{t("paymentMethod.addPaymentMethod")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {hasNextPage && (
          <div ref={sentinelRef} className="h-1 w-full" data-testid="ad-payment-methods-sentinel" />
        )}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Spinner size="md" />
          </div>
        )}

        {paymentMethods.length === 0 && <p className="text-grayscale-text-muted italic">{t("paymentMethod.noPaymentMethodsAddedYet")}</p>}
      </div>

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={addPaymentMethod.isPending}
          onClose={() => setShowAddPaymentPanel(false)}
        />
      )}
    </>
  )
}

export default AdPaymentMethods
