"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { maskAccountNumber } from "@/lib/utils"
import Image from "next/image"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomShimmer } from "./ui/custom-shimmer"
import EditPaymentMethodPanel from "./edit-payment-method-panel"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import EmptyState from "@/components/empty-state"
import { useUserDataStore } from "@/stores/user-data-store"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  PAYMENT_METHOD_INFO,
  PAYMENT_METHOD_ROW,
  PAYMENT_METHOD_SECTION_TITLE,
  PAYMENT_METHOD_TEXT,
} from "@/lib/rtl"
import {
  flattenUserPaymentMethodsPages,
  useUserPaymentMethods,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  isPaymentMethodElevationCancelled,
  type PaymentMethodError,
} from "@/hooks/use-api-queries"
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import { createPaymentMethodInvalidFieldValueAlertConfig } from "@/lib/payment-methods/create-payment-method-invalid-field-value-alert-config"
import { resolvePaymentMethodAccountFieldValue } from "@/lib/payment-methods/resolve-payment-method-account-field-value"
import { getPaymentMethodInUseRoute } from "@/lib/payment-methods/payment-method-error-routing"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface PaymentMethod {
  id: string
  name: string
  type: string
  category: "bank_transfer" | "e_wallet" | "other"
  details: Record<string, any>
  instructions?: string
  isDefault?: boolean
}

interface PaymentMethodsTabProps {
  onAddPaymentMethod?: () => void
  onPaymentMethodsCountChange?: (count: number) => void
}

export default function PaymentMethodsTab({ onAddPaymentMethod, onPaymentMethodsCountChange }: PaymentMethodsTabProps) {
  const { t, locale } = useTranslations()
  const router = useRouter()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const menuSide = isRtlLocale(locale) ? "right" : "left"
  const userId = useUserDataStore((state) => state.userId)
  const { toast } = useToast()
  const { showDeleteDialog, showAlert, hideAlert } = useAlertDialog()

  const [editPanel, setEditPanel] = useState({
    show: false,
    paymentMethod: null as PaymentMethod | null,
  })

  // Use React Query hooks
  const {
    data: methodsResponse,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPaymentMethods(!!userId)
  const updatePaymentMethod = useUpdatePaymentMethod()
  const deletePaymentMethod = useDeletePaymentMethod()
  const handleLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])
  const { sentinelRef } = useLoadMoreOnScroll(!!hasNextPage, handleLoadMore, isFetchingNextPage)

  // Transform API response to PaymentMethod format
  const paymentMethods = useMemo(() => {
    const methods = flattenUserPaymentMethodsPages(methodsResponse)
    if (methods.length === 0) return []

    return methods.map((method) => {
      const methodType = method.method || ""

      let category: "bank_transfer" | "e_wallet" | "other" = "other"

      if (method.type === "bank") {
        category = "bank_transfer"
      } else if (method.type === "ewallet") {
        category = "e_wallet"
      }

      let instructions = ""
      if (method.fields?.instructions?.value) {
        instructions = method.fields.instructions.value
      }

      const name = method.display_name || methodType.charAt(0).toUpperCase() + methodType.slice(1)

      return {
        id: String(method.id || ""),
        name: name,
        type: methodType,
        category: category,
        details: method.fields || {},
        instructions: instructions,
        isDefault: false,
      }
    })
  }, [methodsResponse])

  // Notify parent of count changes
  useEffect(() => {
    onPaymentMethodsCountChange?.(paymentMethods.length)
  }, [paymentMethods.length, onPaymentMethodsCountChange])

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    const transformedDetails: Record<string, { display_name: string; required: boolean; value: string }> = {}

    if (method.details) {
      Object.entries(method.details).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === "object" && "value" in value) {
          transformedDetails[key] = {
            display_name: value.display_name || key.charAt(0).toUpperCase() + key.slice(1),
            required: value.required || false,
            value: value.value || "",
          }
        }
      })
    }

    const cleanedMethod = {
      ...method,
      details: transformedDetails,
    }

    setEditPanel({
      show: true,
      paymentMethod: cleanedMethod,
    })
  }

  const handleSavePaymentMethod = async (id: string, fields: Record<string, string>) => {
    try {
      const paymentMethod = paymentMethods.find((m) => m.id === id)
      if (!paymentMethod) return

      const payload = {
        method: paymentMethod.type,
        fields: { ...fields },
      }

      await updatePaymentMethod.mutateAsync({ id, ...payload })

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
            <span>{t("profile.paymentMethodUpdated")}</span>
          </div>
        ),
        className: TOAST_SUCCESS_CLASS,
        duration: 2500,
      })

      setEditPanel({
        show: false,
        paymentMethod: null,
      })
    } catch (err) {
      const error = err as PaymentMethodError
      if (isPaymentMethodElevationCancelled(error)) return
      const errorMessages: Record<string, { title: string; description: string }> = {
        PaymentMethodInvalid: { title: t("paymentMethod.invalidMethod"), description: t("paymentMethod.invalidMethodDescription") },
        PaymentMethodInvalidField: { title: t("paymentMethod.invalidField"), description: t("paymentMethod.invalidFieldDescription") },
        PaymentMethodRequiredField: { title: t("paymentMethod.requiredField"), description: t("paymentMethod.requiredFieldDescription") },
      }

      const errorCode = error?.errors?.[0]?.code

      const paymentMethodInUseRoute = getPaymentMethodInUseRoute(errorCode)
      if (paymentMethodInUseRoute) {
        const isAdvert = paymentMethodInUseRoute === "/ads"
        showAlert({
          title: t("profile.cannotUpdatePaymentMethod"),
          description: isAdvert
            ? t("profile.paymentMethodLinkedToAd")
            : t("profile.paymentMethodInUseByOrder"),
          confirmText: isAdvert ? t("myAds.manageAds") : t("orders.title"),
          cancelText: t("common.cancel"),
          type: "warning",
          onConfirm: () => {
            setEditPanel({ show: false, paymentMethod: null })
            router.push(paymentMethodInUseRoute)
          },
          onCancel: () => setEditPanel({ show: false, paymentMethod: null }),
          onClose: () => setEditPanel({ show: false, paymentMethod: null }),
        })
        return
      }

      if (errorCode === "PaymentMethodDuplicate") {
        showAlert(
          createPaymentMethodDuplicateAlertConfig(t, {
            onManage: () => {
              hideAlert()
              setEditPanel({ show: false, paymentMethod: null })
            },
            onCancel: () => {
              setEditPanel({ show: false, paymentMethod: null })
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
              setEditPanel({ show: false, paymentMethod: null })
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
          onConfirm: () => setEditPanel({ show: false, paymentMethod: null }),
          onCancel: () => setEditPanel({ show: false, paymentMethod: null }),
          onClose: () => setEditPanel({ show: false, paymentMethod: null }),
        })
        return
      }

      const { title, description } = (typeof errorCode === 'string' ? errorMessages[errorCode] : undefined) ?? {
        title: t("profile.cannotUpdatePaymentMethod"),
        description: t("profile.unableToUpdatePaymentMethod"),
      }

      showAlert({
        title,
        description,
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const handleDeletePaymentMethod = (id: string) => {
    showDeleteDialog({
      title: t("profile.deletePaymentMethodTitle"),
      description: t("profile.deletePaymentMethodDescription"),
      cancelText: t("common.no"),
      confirmText: t("common.yes") + ", " + t("common.delete").toLowerCase(),
      confirmTestId: "profile-btn-confirm-delete-payment",
      cancelTestId: "profile-btn-cancel-delete-payment",
      onConfirm: () => {
        confirmDeletePaymentMethod(id)
      },
    })
  }

  const confirmDeletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethod.mutateAsync(id)

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
            <span>{t("profile.paymentMethodDeleted")}</span>
          </div>
        ),
        className: TOAST_SUCCESS_CLASS,
        duration: 2500,
      })
    } catch (caught) {
      const error = caught as PaymentMethodError
      if (isPaymentMethodElevationCancelled(error)) return
      let errorMessage = t("profile.unableToDeletePaymentMethod")

      if (error.errors && error.errors.length > 0) {
        const errorCode = error.errors[0].code

        if (errorCode === "PaymentMethodInUseByOrder") {
          errorMessage = t("profile.paymentMethodLinkedToOrder")
        } else if (errorCode === "PaymentMethodInUseByAdvert") {
          errorMessage = t("profile.paymentMethodLinkedToAd")
        } else if (error.errors[0].message) {
          errorMessage = error.errors[0].message
        }
      }

      const primaryRoute = getPaymentMethodInUseRoute(error.errors?.[0]?.code)

      showAlert({
        title: t("profile.cannotDeletePaymentMethod"),
        description: errorMessage,
        confirmText: primaryRoute === "/ads"
          ? t("myAds.manageAds")
          : primaryRoute === "/orders"
            ? t("orders.title")
            : t("orderDetails.gotIt"),
        cancelText: primaryRoute ? t("common.cancel") : undefined,
        type: "error",
        onConfirm: primaryRoute ? () => router.push(primaryRoute) : undefined,
      })
    }
  }

  const bankTransfers = paymentMethods.filter((method) => method.category === "bank_transfer")
  const eWallets = paymentMethods.filter((method) => method.category === "e_wallet")

  const getBankIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center">
      <Image src="/icons/bank-transfer-icon.png" alt={t("common.bank")} width={24} height={24} />
    </div>
  )

  const getEWalletIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center">
      <Image src="/icons/ewallet-icon-new.png" alt={t("common.eWallet")} width={24} height={24} />
    </div>
  )

  if (!userId) {
    return (
      <EmptyState
        className="h-full md:h-auto"
        title={t("profile.noPaymentMethodsYet")}
        description={t("profile.startAddingPaymentMethods")}
        redirectToAds={false}
        onAddPaymentMethod={onAddPaymentMethod}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <CustomShimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <CustomShimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        className="h-full md:h-auto"
        title={t("errors.loadPaymentMethodsFailedTitle")}
        description={t("errors.loadFailedDescription")}
        actionLabel={t("errors.retry")}
        onAction={() => refetch()}
      />
    )
  }

  if (bankTransfers.length == 0 && eWallets.length == 0) {
    return (
      <EmptyState
        className="h-full md:h-auto"
        title={t("profile.noPaymentMethodsYet")}
        description={t("profile.startAddingPaymentMethods")}
        redirectToAds={false}
        onAddPaymentMethod={onAddPaymentMethod}
      />
    )
  }

  return (
    <div dir={dir}>
      {bankTransfers.length > 0 && (
        <div className="mb-4">
          <h3 className={PAYMENT_METHOD_SECTION_TITLE}>{t("paymentMethod.bankTransfers")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankTransfers.map((method) => (
              <Card
                key={method.id}
                data-testid={`profile-card-payment-${method.id}`}
                variant="default"
                className="overflow-hidden shadow-none border-0 border-b rounded-none"
              >
                <CardContent className="p-2">
                  <div className={PAYMENT_METHOD_ROW}>
                    <div className={PAYMENT_METHOD_INFO}>
                      {getBankIcon()}
                      <div className={PAYMENT_METHOD_TEXT}>
                        <div className="text-neutral-10">{method.details.bank_name.value}</div>
                        <div className="text-neutral-7 tracking-wide text-xs">
                          {maskAccountNumber(method.details.account.value)}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button data-testid={`profile-btn-edit-payment-${method.id}`} variant="ghost" size="sm" className="!rounded-full !p-1 !min-w-0 !h-auto !bg-transparent hover:!bg-black/10 flex-shrink-0">
                          <Image src="/icons/vertical.svg" alt={t("common.options")} width={24} height={24} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side={menuSide} align="center" className="w-[160px]">
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-gray-700 focus-visible:text-gray-700 px-[16px] py-[8px] cursor-pointer"
                          onSelect={() => handleEditPaymentMethod(method)}
                        >
                          <Image src="/icons/edit-pencil-icon.png" alt={t("common.edit")} width={24} height={24} />
                          {t("profile.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`profile-btn-delete-payment-${method.id}`}
                          className="flex items-center gap-2 text-destructive focus-visible:text-destructive px-[16px] py-[8px]"
                          onSelect={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Image src="/icons/delete-trash-icon.png" alt={t("common.delete")} width={24} height={24} />
                          {t("profile.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {eWallets.length > 0 && (
        <div>
          <h3 className={PAYMENT_METHOD_SECTION_TITLE}>{t("paymentMethod.eWallets")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eWallets.map((method) => (
              <Card
                key={method.id}
                data-testid={`profile-card-payment-${method.id}`}
                variant="default"
                className="overflow-hidden shadow-none border-0 border-b rounded-none"
              >
                <CardContent className="p-2">
                  <div className={PAYMENT_METHOD_ROW}>
                    <div className={PAYMENT_METHOD_INFO}>
                      {getEWalletIcon()}
                      <div className={PAYMENT_METHOD_TEXT}>
                        <div className="text-neutral-10">{method.name}</div>
                        <div className="text-neutral-7 text-xs">
                          {method.details?.account?.value || `ID: ${method.id}`}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button data-testid={`profile-btn-edit-payment-${method.id}`} variant="ghost" size="sm" className="!rounded-full !p-1 !min-w-0 !h-auto !bg-transparent hover:!bg-black/10 flex-shrink-0">
                          <Image src="/icons/vertical.svg" alt={t("common.options")} width={24} height={24} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side={menuSide} align="center" className="w-[160px]">
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-gray-700 focus-visible:text-gray-700 px-[16px] py-[8px]"
                          onSelect={() => handleEditPaymentMethod(method)}
                        >
                          <Image src="/icons/edit-pencil-icon.png" alt={t("common.edit")} width={24} height={24} />
                          {t("profile.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`profile-btn-delete-payment-${method.id}`}
                          className="flex items-center gap-2 text-destructive focus-visible:text-destructive px-[16px] py-[8px]"
                          onSelect={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Image src="/icons/delete-trash-icon.png" alt={t("common.delete")} width={24} height={24} />
                          {t("profile.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {hasNextPage && (
        <div ref={sentinelRef} className="h-1 w-full" data-testid="profile-payment-methods-sentinel" />
      )}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}
      {editPanel.show && editPanel.paymentMethod && (
        <EditPaymentMethodPanel
          paymentMethod={editPanel.paymentMethod}
          onClose={() => setEditPanel({ show: false, paymentMethod: null })}
          onSave={handleSavePaymentMethod}
          isLoading={updatePaymentMethod.isPending}
        />
      )}
    </div>
  )
}
