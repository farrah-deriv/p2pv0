"use client"


import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import { CurrencyInput } from "./ui/currency-input"
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll"
import { useStablePaymentMethodOrder } from "@/hooks/use-stable-payment-method-order"
import { SelectedPaymentMethodsSection } from "@/components/payment-methods/selected-payment-methods-section"
import Image from "next/image"
import { StandaloneChevronDownRegularIcon, StandaloneSearchRegularIcon } from "@deriv/quill-icons/Standalone"
import type { AdFormData } from "../types"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ModalHeaderRow } from "@/components/ui/modal-header-row"
import { isRtlLocale } from "@/lib/i18n/config"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { getDecimalConstraints, getDecimalPlaces } from "@/lib/currency-decimal"
import { formatPaymentMethodName } from "@/lib/utils"
import { ProfileAPI } from "@/services/api"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { usePaymentSelection } from "./payment-selection-context"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  flattenUserPaymentMethodsPages,
  useAddPaymentMethod,
  useUserPaymentMethods,
  type PaymentMethodError,
} from "@/hooks/use-api-queries"
import { useRouter } from "next/navigation"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import { createPaymentMethodInvalidFieldValueAlertConfig } from "@/lib/payment-methods/create-payment-method-invalid-field-value-alert-config"
import { resolvePaymentMethodAccountFieldValue } from "@/lib/payment-methods/resolve-payment-method-account-field-value"
import { getPaymentMethodFieldValidationIssue } from "@/lib/payment-method-validation"
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
  toNumericPaymentMethodIds,
} from "@/lib/payment-methods/payment-method-selection-utils"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface PaymentMethod {
  display_name: string
  method: string
  type: string
  fields: Record<string, unknown>
}

interface UserPaymentMethod {
  id: string
  type: string
  display_name: string
  fields: Record<string, unknown>
  is_enabled: number
  method: string
}

interface AvailablePaymentMethod {
  display_name: string
  type: string
  method: string
}

interface AmountValidationErrors {
  totalAmount?: string
  minAmount?: string
  maxAmount?: string
}

interface PaymentDetailsFormProps {
  initialData: Partial<AdFormData>
  onBottomSheetOpenChange?: (isOpen: boolean) => void
  userPaymentMethods: UserPaymentMethod[]
  availablePaymentMethods: AvailablePaymentMethod[]
  onRefetchPaymentMethods: () => Promise<void>
  isEditMode?: boolean
}

/**
 * Buy-ad catalogue picker only. Rows are unique `AvailablePaymentMethod` templates
 * (one per `method` key), so same-key e-wallet disable is N/A here.
 * Sell ads / user account instances use `PaymentSelectionContent` instead.
 */
const FullPagePaymentSelection = ({
  isOpen,
  onClose,
  paymentMethods,
  selectedPaymentMethods,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  paymentMethods: AvailablePaymentMethod[]
  selectedPaymentMethods: string[]
  onConfirm: (methods: string[]) => void
}) => {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const isMobile = useIsMobile()
  const [localSelected, setLocalSelected] = useState<string[]>(selectedPaymentMethods)
  /** Frozen at open — session key for stable row order (no pin-to-top). */
  const [orderSessionKey, setOrderSessionKey] = useState<string[]>(selectedPaymentMethods)
  const [searchQuery, setSearchQuery] = useState("")
  const listScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedPaymentMethods)
      setOrderSessionKey(selectedPaymentMethods)
      setSearchQuery("")
    }
  }, [isOpen, selectedPaymentMethods])

  const getMethodId = useCallback((method: AvailablePaymentMethod) => {
    return normalizePaymentMethodId(method.method)
  }, [])

  const filteredMethods = useMemo(() => {
    const methods = Array.isArray(paymentMethods) ? paymentMethods : []
    const query = searchQuery.toLowerCase()

    return methods.filter((method) => method.display_name.toLowerCase().includes(query))
  }, [paymentMethods, searchQuery])

  const sortedFilteredMethods = useStablePaymentMethodOrder(
    filteredMethods,
    orderSessionKey,
    getMethodId,
    isOpen,
  )

  const handleToggle = (methodId: string) => {
    setLocalSelected((prev) => {
      if (isPaymentMethodIdSelected(prev, methodId)) {
        return prev.filter((id) => !isPaymentMethodIdSelected([id], methodId))
      } else if (prev.length < 3) {
        return [...prev, normalizePaymentMethodId(methodId)]
      }
      return prev
    })
  }

  const handleConfirm = () => {
    onConfirm(localSelected)
    onClose()
  }

  // Fixed body height so empty search / no chips don't collapse the modal.
  const listBodyClass = isMobile
    ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4"
    : "flex h-[min(480px,50vh)] min-h-0 flex-col overflow-hidden"

  const content = (
    <div className="box-border flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden">
      <div className={`shrink-0 pb-2 ${isMobile ? "px-4" : ""}`}>
        <p className="text-center text-sm text-slate-1200 md:text-start">
          {t("paymentMethod.selectUpTo3")}
        </p>
      </div>
      <div className={`shrink-0 pb-2 ${isMobile ? "px-4" : ""}`}>
        <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 h-10">
          <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search")}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            data-testid="ad-form-input-payment-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="hover:!bg-transparent !p-0 !h-auto !w-auto !min-w-0"
              aria-label={t("common.clearSearch")}
            >
              <Image src="/icons/clear-search-icon.png" alt="" aria-hidden width={20} height={20} />
            </Button>
          )}
        </div>
      </div>
      <div className={listBodyClass}>
        <SelectedPaymentMethodsSection
          methods={(Array.isArray(paymentMethods) ? paymentMethods : []).map((method) => ({
            id: method.method,
            display_name: method.display_name,
            type: method.type,
            method: method.method,
          }))}
          selectedIds={localSelected}
          onRemove={(methodId) => {
            setLocalSelected((prev) =>
              prev.filter((id) => !isPaymentMethodIdSelected([id], methodId)),
            )
          }}
        />
        <div
          ref={listScrollRef}
          className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto"
        >
          {sortedFilteredMethods.length === 0 ? (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
              <p className="mb-2 text-center text-base font-bold text-slate-1200">
                {t("paymentMethod.noMatchingPayment")}
              </p>
              <p className="text-center text-base text-grayscale-text-muted">
                {t("profile.noResultForPrefix")} &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFilteredMethods.map((method) => {
                const methodId = getMethodId(method)
                const isSelected = isPaymentMethodIdSelected(localSelected, methodId)
                const isDisabled = !isSelected && localSelected.length >= 3

                return (
                  <div
                    key={methodId}
                    className={`box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg bg-grayscale-500 p-4 flex cursor-pointer items-center justify-between gap-4 ${isSelected ? "border border-black" : "border border-transparent"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isDisabled && handleToggle(methodId)}
                  >
                    <div className="flex min-w-0 max-w-full flex-1 items-center gap-4 overflow-hidden">
                      <div
                        className={`h-3 w-3 shrink-0 rounded-full ${method.type === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"}`}
                      />
                      <span className={`block min-w-0 max-w-full flex-1 truncate text-base leading-6 ${isDisabled ? "text-grayscale-text-muted" : "text-slate-1200"}`}>
                        {method.display_name}
                      </span>
                    </div>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && handleToggle(methodId)}
                        className="w-[14px] h-[14px] rounded-[2px]"
                        data-testid={`ad-form-checkbox-payment-${methodId}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div
        className={`box-border w-full min-w-0 max-w-full shrink-0 ${isMobile
          ? "px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          : "pt-2"
          }`}
      >
        <Button
          onClick={handleConfirm}
          disabled={localSelected.length === 0}
          className="w-full max-w-full min-w-0 min-h-[48px] h-[48px]"
        >
          {t("common.confirm")}
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent
          dir={dir}
          hideHandle
          className="!mt-0 flex h-[90dvh] max-h-[90dvh] flex-col overflow-hidden z-[60]"
          data-testid="ad-form-sheet-payment-methods"
        >
          <ModalHeaderRow
            title={t("paymentMethod.title")}
            onClose={onClose}
            closeAriaLabel={t("common.close")}
            centerTitle
            titleClassName="text-xl font-extrabold"
            closeIconSrc="/icons/button-close.png"
            closeIconSize={48}
            closeButtonClassName="hover:bg-transparent hover:opacity-80 px-0 min-w-[48px]"
            className="shrink-0 px-4 pt-4 pb-0"
          />
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        dir={dir}
        className="!flex min-h-0 min-w-0 w-full max-w-xl flex-col gap-0 overflow-hidden rounded-[32px] px-8 pt-6 pb-8"
        data-testid="ad-form-sheet-payment-methods"
      >
        <ModalHeaderRow
          asDialog
          title={t("paymentMethod.title")}
          onClose={onClose}
          closeAriaLabel={t("common.close")}
          titleClassName="text-2xl font-extrabold"
          closeButtonClassName="hover:!bg-transparent hover:!opacity-80"
          className="mb-2 shrink-0"
        />
        {content}
      </DialogContent>
    </Dialog>
  )
}

const PaymentSelectionContent = ({
  paymentMethods,
  tempSelectedPaymentMethods,
  setTempSelectedPaymentMethods,
  hideAlert,
  setSelectedPaymentMethods,
  handleAddPaymentMethodClick,
  scrollToPaymentMethodId,
}: {
  paymentMethods: (UserPaymentMethod | PaymentMethod)[]
  tempSelectedPaymentMethods: string[]
  setTempSelectedPaymentMethods: (methods: string[]) => void
  hideAlert: () => void
  setSelectedPaymentMethods: (methods: string[]) => void
  handleAddPaymentMethodClick?: (currentSelection: string[]) => void
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
  const userMethods = useMemo(() => {
    const live = flattenUserPaymentMethodsPages(paymentMethodsPages) as UserPaymentMethod[]
    const fromProps = paymentMethods.filter(
      (method): method is UserPaymentMethod => "id" in method,
    )
    if (live.length === 0) return fromProps

    const byId = new Map(
      live.map((method) => [normalizePaymentMethodId(method.id), method] as const),
    )
    for (const method of fromProps) {
      const id = normalizePaymentMethodId(method.id)
      if (!byId.has(id)) byId.set(id, method)
    }
    return Array.from(byId.values())
  }, [paymentMethods, paymentMethodsPages])

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPMs((prev) => {
      if (isPaymentMethodIdSelected(prev, methodId)) {
        return prev.filter((id) => !isPaymentMethodIdSelected([id], methodId))
      }
      if (isUserPaymentMethodSelectionDisabled(userMethods, prev, methodId)) {
        return prev
      }
      return [...prev, normalizePaymentMethodId(methodId)]
    })
  }

  const getMethodId = useCallback((method: UserPaymentMethod | PaymentMethod) => {
    return normalizePaymentMethodId("id" in method ? method.id : method.method)
  }, [])

  const getMethodType = (method: UserPaymentMethod | PaymentMethod) => {
    return method.type
  }

  const sortedPaymentMethods = useStablePaymentMethodOrder(
    userMethods,
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

      // Scroll to the created row in-place (no jump-to-top).
      target.scrollIntoView({ block: "nearest" })
      lastScrolledPaymentMethodIdRef.current = normalizedId
    }

    window.requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
    }
  }, [scrollToPaymentMethodId, scrollRootRef, sortedPaymentMethods.length])

  return (
    <div className="box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
      {userMethods.length > 0 && (
        <div className="shrink-0 pb-2 text-center text-grayscale-600 md:text-start">
          {t("paymentMethod.selectUpTo3")}
        </div>
      )}
      <div
        ref={scrollRootRef}
        className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto"
      >
        {userMethods.length === 0 ? (
          <div className="flex flex-col items-start">
            {handleAddPaymentMethodClick && (
              <Button
                type="button"
                variant="secondary-outline"
                className="box-border h-auto w-full max-w-full min-w-0 justify-start p-4 font-normal"
                onClick={() => {
                  handleAddPaymentMethodClick(selectedPMs)
                }}
                data-testid="ad-form-btn-add-payment"
              >
                <span className="flex items-center">
                  <Image src="/icons/plus_icon.png" alt={t("common.plus")} width={14} height={24} className="me-2" />
                  <span className="text-base font-normal text-slate-1200">
                    {t("paymentMethod.addPaymentMethod")}
                  </span>
                </span>
              </Button>
            )}
          </div>
        ) : (
          <>
            <SelectedPaymentMethodsSection
              methods={userMethods}
              selectedIds={selectedPMs}
              onRemove={handlePaymentMethodToggle}
            />
            {/* Mobile list gap: QuillSpacing.sm (8px) */}
            <div className="space-y-2">
              {sortedPaymentMethods.map((method) => {
                const methodId = getMethodId(method)
                const isSelected = isPaymentMethodIdSelected(selectedPMs, methodId)
                const isDisabled = isUserPaymentMethodSelectionDisabled(
                  userMethods,
                  selectedPMs,
                  methodId,
                )
                const lines = getPaymentMethodSelectionLines(method, t)

                return (
                  <div
                    key={methodId}
                    data-payment-method-id={methodId}
                    className={`box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg bg-grayscale-500 ps-6 pe-6 py-4 cursor-pointer transition-colors ${isDisabled
                      ? "opacity-30 cursor-not-allowed hover:bg-grayscale-300"
                      : "hover:bg-grayscale-300"
                      } ${isSelected ? "border border-black" : ""
                      }`}
                    onClick={() => !isDisabled && handlePaymentMethodToggle(methodId)}
                  >
                    <div className="flex w-full min-w-0 max-w-full items-center gap-4">
                      <div className="flex min-w-0 max-w-full flex-1 items-center gap-4 overflow-hidden">
                        <div
                          className={`h-3 w-3 shrink-0 rounded-full ${getMethodType(method) === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                            }`}
                        />
                        <div className="flex min-w-0 max-w-full flex-1 flex-col gap-0.5 overflow-hidden">
                          <span className="block truncate text-base leading-6 text-slate-1200">
                            {lines.title}
                          </span>
                          {lines.subtitle ? (
                            <span className="block truncate text-xs leading-4 text-grayscale-text-muted">
                              {lines.subtitle}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => !isDisabled && handlePaymentMethodToggle(methodId)}
                        disabled={isDisabled}
                        className="pointer-events-none h-[20px] w-[20px] shrink-0 rounded-sm border-[2px] border-neutral-7 disabled:cursor-not-allowed disabled:opacity-30 data-[state=checked]:border-black data-[state=checked]:bg-black"
                        data-testid={`ad-form-checkbox-payment-${methodId}`}
                      />
                    </div>
                  </div>
                )
              })}

              {hasNextPage && (
                <div ref={sentinelRef} className="h-1 w-full" data-testid="ad-form-payment-methods-sentinel" />
              )}
              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Spinner size="md" />
                </div>
              )}

              {handleAddPaymentMethodClick && (
                <Button
                  type="button"
                  variant="secondary-outline"
                  className="box-border h-auto w-full max-w-full min-w-0 justify-start p-4 font-normal"
                  onClick={() => {
                    handleAddPaymentMethodClick(selectedPMs)
                  }}
                  data-testid="ad-form-btn-add-payment"
                >
                  <span className="flex items-center">
                    <Image src="/icons/plus_icon.png" alt={t("common.plus")} width={14} height={24} className="me-2" />
                    <span className="text-base font-normal text-slate-1200">
                      {t("paymentMethod.addPaymentMethod")}
                    </span>
                  </span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <div className="box-border w-full min-w-0 max-w-full shrink-0 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:py-4">
        <Button
          className="w-full max-w-full min-w-0"
          disabled={selectedPMs.length === 0}
          onClick={() => {
            const confirmedSelection = resolveSelectedUserPaymentMethodIds(
              selectedPMs,
              userMethods,
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

export default function PaymentDetailsForm({
  initialData,
  onBottomSheetOpenChange,
  userPaymentMethods,
  availablePaymentMethods,
  onRefetchPaymentMethods,
  isEditMode = false,
}: PaymentDetailsFormProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const { accountCurrencies } = useAccountCurrencies()
  const { mutateAsync: addPaymentMethod, isPending: isAddingPaymentMethod } = useAddPaymentMethod()
  const buyCurrency = initialData.buyCurrency || "USD"

  const [totalAmount, setTotalAmount] = useState(initialData.totalAmount?.toString() || "")
  const [minAmount, setMinAmount] = useState(initialData.minAmount?.toString() || "")
  const [maxAmount, setMaxAmount] = useState(initialData.maxAmount?.toString() || "")
  const [amountErrors, setAmountErrors] = useState<AmountValidationErrors>({})
  const [amountTouched, setAmountTouched] = useState({
    totalAmount: false,
    minAmount: false,
    maxAmount: false,
  })

  const [instructions, setInstructions] = useState(initialData.instructions || "")
  const [instructionsError, setInstructionsError] = useState("")
  const [tempSelectedPaymentMethods, setTempSelectedPaymentMethods] = useState<string[]>([])
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const [showFullPageModal, setShowFullPageModal] = useState(false)
  // When true, Drawer/Dialog onOpenChange from programmatic hideAlert (add-PM
  // transition) must not wipe the draft selection back to last confirmed.
  const isTransitioningToAddPanelRef = useRef(false)
  // When true, the add-payment panel was opened from within the selection sheet,
  // so closing it without adding should reopen the sheet.
  const addPanelOpenedFromSelectionRef = useRef(false)
  const { hideAlert, showAlert } = useAdvertAlertDialog()
  const { toast } = useToast()
  const { selectedPaymentMethodIds, setSelectedPaymentMethodIds } = usePaymentSelection()

  const adType = initialData.type || "buy"

  const validateInstructions = (value: string) => {
    return getPaymentMethodFieldValidationIssue("bank_transfer", "instructions", value) === null
  }

  const areAmountsValid = () => {
    return (
      !!totalAmount &&
      !!minAmount &&
      !!maxAmount &&
      Object.keys(amountErrors).length === 0
    )
  }

  const isFormValid = () => {
    return selectedPaymentMethodIds.length > 0 && validateInstructions(instructions) && areAmountsValid()
  }

  useEffect(() => {
    if (initialData.totalAmount !== undefined) setTotalAmount(initialData.totalAmount.toString())
    if (initialData.minAmount !== undefined) setMinAmount(initialData.minAmount.toString())
    if (initialData.maxAmount !== undefined) setMaxAmount(initialData.maxAmount.toString())
    if (initialData.instructions !== undefined) setInstructions(initialData.instructions || "")
  }, [initialData.totalAmount, initialData.minAmount, initialData.maxAmount, initialData.instructions])

  useEffect(() => {
    const errors: AmountValidationErrors = {}
    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)

    if (amountTouched.totalAmount) {
      if (!totalAmount) {
        errors.totalAmount = t("adForm.totalAmountRequired")
      } else if (total <= 0) {
        errors.totalAmount = t("adForm.totalAmountGreaterThanZero")
      }
    }

    if (minAmount && totalAmount && min > total) {
      errors.minAmount = t("adForm.minAmountLessThanTotal")
    }

    if (maxAmount && totalAmount && max > total) {
      errors.maxAmount = t("adForm.maxAmountLessThanTotal")
    }

    if (amountTouched.minAmount) {
      if (!minAmount) {
        errors.minAmount = t("adForm.minAmountRequired")
      } else if (min <= 0) {
        errors.minAmount = t("adForm.minAmountGreaterThanZero")
      }
    }

    if (amountTouched.minAmount && amountTouched.maxAmount && min > max) {
      errors.minAmount = t("adForm.minAmountLessThanMax")
      errors.maxAmount = t("adForm.maxAmountGreaterThanMin")
    }

    if (amountTouched.maxAmount) {
      if (!maxAmount) {
        errors.maxAmount = t("adForm.maxAmountRequired")
      } else if (max <= 0) {
        errors.maxAmount = t("adForm.maxAmountGreaterThanZero")
      }
    }

    setAmountErrors(errors)
  }, [totalAmount, minAmount, maxAmount, amountTouched, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAmountTouched({ totalAmount: true, minAmount: true, maxAmount: true })
  }

  const handleAddPaymentMethodClick = useCallback((currentSelection: string[]) => {
    setTempSelectedPaymentMethods(currentSelection)
    isTransitioningToAddPanelRef.current = true
    addPanelOpenedFromSelectionRef.current = true
    setShowAddPaymentPanel(true)
    hideAlert()
  }, [hideAlert])

  // Confirm-button close (PaymentSelectionContent) bypasses config.onClose,
  // so the sheet-open notification is bundled with hideAlert here.
  const hideSellPaymentSelection = useCallback(() => {
    onBottomSheetOpenChange?.(false)
    hideAlert()
  }, [hideAlert, onBottomSheetOpenChange])

  const openSellPaymentSelection = useCallback(
    (
      selectionOverride?: string[],
      methodsOverride?: UserPaymentMethod[],
      scrollToPaymentMethodId?: string,
    ) => {
      const currentSelection =
        selectionOverride ??
        (tempSelectedPaymentMethods.length > 0
          ? tempSelectedPaymentMethods
          : selectedPaymentMethodIds)
      const methodsForSheet = methodsOverride ?? userPaymentMethods

      showAlert({
        title: t("paymentMethod.paymentMethodsSheetTitle"),
        titleAlign: "center",
        mobileSheetClassName:
          "!mt-0 h-[90dvh] max-h-[90dvh] z-[60]",
        mobileSheetFullHeight: true,
        mobileContentClassName:
          "flex min-h-0 flex-1 flex-col w-full min-w-0 max-w-full overflow-hidden",
        // Keep the desktop dialog body stable (empty / no selection).
        contentClassName: "h-[min(560px,60vh)] w-full min-w-0 max-w-full overflow-hidden",
        content: (
          <PaymentSelectionContent
            paymentMethods={methodsForSheet}
            tempSelectedPaymentMethods={currentSelection}
            setTempSelectedPaymentMethods={setTempSelectedPaymentMethods}
            setSelectedPaymentMethods={setSelectedPaymentMethodIds}
            hideAlert={hideSellPaymentSelection}
            handleAddPaymentMethodClick={handleAddPaymentMethodClick}
            scrollToPaymentMethodId={scrollToPaymentMethodId}
          />
        ),
        // Dismissing without confirming (X, Escape, backdrop) discards the
        // draft back to the last confirmed selection, so reopening later
        // doesn't reseed from a stale, never-confirmed draft. Skipped when
        // transitioning to the add-payment panel so draft selections survive.
        onClose: () => {
          if (isTransitioningToAddPanelRef.current) {
            isTransitioningToAddPanelRef.current = false
            return
          }
          onBottomSheetOpenChange?.(false)
          setTempSelectedPaymentMethods(selectedPaymentMethodIds)
        },
      })
    },
    [
      handleAddPaymentMethodClick,
      hideSellPaymentSelection,
      onBottomSheetOpenChange,
      selectedPaymentMethodIds,
      setSelectedPaymentMethodIds,
      showAlert,
      t,
      tempSelectedPaymentMethods,
      userPaymentMethods,
    ],
  )

  const handleShowPaymentSelection = () => {
    onBottomSheetOpenChange?.(true)
    if (initialData.type === "buy") {
      setShowFullPageModal(true)
    } else if (userPaymentMethods.length === 0) {
      addPanelOpenedFromSelectionRef.current = false
      setShowAddPaymentPanel(true)
    } else {
      openSellPaymentSelection()
    }
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      const result = await addPaymentMethod({ method, fields })
      await onRefetchPaymentMethods()

      if (initialData.type === "sell") {
        const created = result.data as UserPaymentMethod | undefined
        const createdId = getCreatedPaymentMethodId(created)
        const nextUserPaymentMethods = mergeCreatedPaymentMethodIntoList(
          userPaymentMethods,
          created,
        )
        let nextSelection = [...tempSelectedPaymentMethods]

        if (createdId) {
          nextSelection = appendSelectedPaymentMethodId(
            tempSelectedPaymentMethods,
            createdId,
            3,
            nextUserPaymentMethods,
          )
          setTempSelectedPaymentMethods(nextSelection)
        }

        // Reopen the selection popup and close the add-new panel in the same
        // synchronous tick (React batches these) so there is no frame where
        // neither overlay is mounted and the wizard's own Back/Close become
        // reachable underneath.
        openSellPaymentSelection(nextSelection, nextUserPaymentMethods, createdId)

        const createdMethodName = created?.display_name || formatPaymentMethodName(method, t)

        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
              <span>{t("profile.paymentMethodAddedWithName", { methodName: createdMethodName })}</span>
            </div>
          ),
          className: TOAST_SUCCESS_CLASS,
          duration: 2500,
        })
      }

      setShowAddPaymentPanel(false)
    } catch (err) {
      const error = err as PaymentMethodError
      const errorCode = error?.errors?.[0]?.code

      if (errorCode === "PaymentMethodDuplicate") {
        showAlert(
          createPaymentMethodDuplicateAlertConfig(t, {
            onManage: () => {
              hideAlert()
              setShowAddPaymentPanel(false)
              onBottomSheetOpenChange?.(false)
              router.push("/profile?tab=payment")
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
              onBottomSheetOpenChange?.(false)
            },
          }),
        )
        return
      }

      const errorMessages: Record<string, { title: string; description: string }> = {
        PaymentMethodInvalid: { title: t("paymentMethod.invalidMethod"), description: t("paymentMethod.invalidMethodDescription") },
        PaymentMethodInvalidField: { title: t("paymentMethod.invalidField"), description: t("paymentMethod.invalidFieldDescription") },
        PaymentMethodNotFound: { title: t("paymentMethod.notFound"), description: t("paymentMethod.notFoundDescription") },
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

  const getSelectedPaymentMethodsText = () => {
    const selectedIds = selectedPaymentMethodIds

    if (selectedIds.length === 0) return t("adForm.selectPayment")
    return t("adForm.selected", { count: selectedIds.length })
  }

  useEffect(() => {
    let paymentMethodNames: string[] = []

    if (initialData.type === "buy") {
      paymentMethodNames = selectedPaymentMethodIds
    } else {
      paymentMethodNames = selectedPaymentMethodIds
        .map((id) => {
          const method = userPaymentMethods.find(
            (m) => normalizePaymentMethodId(m.id) === normalizePaymentMethodId(id),
          )
          return method?.method || ""
        })
        .filter(Boolean)
    }

    const event = new CustomEvent("paymentFormValidationChange", {
      detail: {
        isValid: isFormValid(),
        formData: {
          totalAmount: Number.parseFloat(totalAmount) || 0,
          minAmount: Number.parseFloat(minAmount) || 0,
          maxAmount: Number.parseFloat(maxAmount) || 0,
          payment_method_ids: toNumericPaymentMethodIds(selectedPaymentMethodIds),
          paymentMethods: paymentMethodNames,
          instructions,
        },
      },
      bubbles: true,
    })
    document.dispatchEvent(event)
  }, [
    selectedPaymentMethodIds,
    instructions,
    userPaymentMethods,
    initialData.type,
    totalAmount,
    minAmount,
    maxAmount,
    amountErrors,
  ])

  return (
    <>
      <div className="h-full flex flex-col">
        <form id="payment-details-form" onSubmit={handleSubmit} className="flex-1">
          <div className="max-w-[800px] mx-auto h-full flex flex-col">
            <div data-guide-id="ad-guide-amount" className="mb-8">
              <div className="mb-2">
                <h3 className="text-sm font-normal leading-5 tracking-normal text-start text-slate-1200">
                  {t("adForm.amountAndOrderLimit")}
                </h3>
              </div>
              <div className="mb-4">
                <CurrencyInput
                  data-testid="ad-form-input-total-amount"
                  value={totalAmount}
                  onValueChange={(value) => {
                    if (value === "") {
                      setTotalAmount("")
                      setAmountTouched((prev) => ({ ...prev, totalAmount: true }))
                      return
                    }

                    const decimalConstraints = getDecimalConstraints(buyCurrency, accountCurrencies)
                    if (decimalConstraints) {
                      const decimalPlaces = getDecimalPlaces(value)
                      if (decimalPlaces > decimalConstraints.maximum) {
                        return
                      }
                    }

                    setTotalAmount(value)
                    setAmountTouched((prev) => ({ ...prev, totalAmount: true }))
                  }}
                  onBlur={() => setAmountTouched((prev) => ({ ...prev, totalAmount: true }))}
                  placeholder={adType === "sell" ? t("adForm.sellQuantity") : t("adForm.buyQuantity")}
                  isEditMode={isEditMode}
                  error={amountTouched.totalAmount && !!amountErrors.totalAmount}
                  currency={buyCurrency}
                />
                {amountTouched.totalAmount && amountErrors.totalAmount && (
                  <p className="text-destructive text-xs mt-1 ms-4">{amountErrors.totalAmount}</p>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline gap-4">
                <div className="flex-1">
                  <CurrencyInput
                    data-testid="ad-form-input-min-amount"
                    value={minAmount}
                    onValueChange={(value) => {
                      if (value === "") {
                        setMinAmount("")
                        setAmountTouched((prev) => ({ ...prev, minAmount: true }))
                        return
                      }

                      const decimalConstraints = getDecimalConstraints(buyCurrency, accountCurrencies)
                      if (decimalConstraints) {
                        const decimalPlaces = getDecimalPlaces(value)
                        if (decimalPlaces > decimalConstraints.maximum) {
                          return
                        }
                      }

                      setMinAmount(value)
                      setAmountTouched((prev) => ({ ...prev, minAmount: true }))
                    }}
                    onBlur={() => setAmountTouched((prev) => ({ ...prev, minAmount: true }))}
                    placeholder={t("adForm.minimumOrder")}
                    error={amountTouched.minAmount && !!amountErrors.minAmount}
                    currency={buyCurrency}
                  />
                  {amountTouched.minAmount && amountErrors.minAmount && (
                    <p className="text-destructive text-xs mt-1 ms-4" data-testid="ad-form-error-amount">
                      {amountErrors.minAmount}
                    </p>
                  )}
                </div>
                <div className="text-xl hidden md:block">~</div>
                <div className="flex-1">
                  <CurrencyInput
                    data-testid="ad-form-input-max-amount"
                    value={maxAmount}
                    onValueChange={(value) => {
                      if (value === "") {
                        setMaxAmount("")
                        setAmountTouched((prev) => ({ ...prev, maxAmount: true }))
                        return
                      }

                      const decimalConstraints = getDecimalConstraints(buyCurrency, accountCurrencies)
                      if (decimalConstraints) {
                        const decimalPlaces = getDecimalPlaces(value)
                        if (decimalPlaces > decimalConstraints.maximum) {
                          return
                        }
                      }

                      setMaxAmount(value)
                      setAmountTouched((prev) => ({ ...prev, maxAmount: true }))
                    }}
                    onBlur={() => setAmountTouched((prev) => ({ ...prev, maxAmount: true }))}
                    placeholder={t("adForm.maximumOrder")}
                    error={amountTouched.maxAmount && !!amountErrors.maxAmount}
                    currency={buyCurrency}
                  />
                  {amountTouched.maxAmount && amountErrors.maxAmount && (
                    <p className="text-destructive text-xs mt-1 ms-4" data-testid="ad-form-error-amount">
                      {amountErrors.maxAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div data-guide-id="ad-guide-payment">
              <h3 className="text-sm font-normal leading-5 tracking-normal mb-2 text-start text-slate-1200">
                {t("adForm.paymentDetails")}
              </h3>
              {/* Match CurrencyInput spacing (mb-4) + border-gray-200 outline. */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  className="!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !font-normal focus:!ring-1 focus:!ring-black hover:!bg-white [&>span]:!w-full"
                  onClick={() => handleShowPaymentSelection()}
                  type="button"
                >
                  <span className="flex w-full flex-row items-center justify-between">
                    <span
                      className={`truncate text-start text-sm font-normal ${
                        selectedPaymentMethodIds.length > 0 ? "text-slate-1200" : "text-neutral-400"
                      }`}
                    >
                      {getSelectedPaymentMethodsText()}
                    </span>
                    <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
                  </span>
                </Button>
              </div>

              <div>
                <Textarea
                  value={instructions}
                  onChange={(e) => {
                    const value = e.target.value
                    setInstructions(value)
                    if (value && !validateInstructions(value)) {
                      setInstructionsError(t("adForm.instructionsInvalidCharsMessage"))
                    } else {
                      setInstructionsError("")
                    }
                  }}
                  placeholder={initialData.type === "buy" ? t("adForm.sellerInstructions") : t("adForm.buyerInstructions")}
                  className={`min-h-[120px] resize-none border-gray-200 bg-transparent text-base font-normal placeholder:text-base placeholder:font-normal placeholder:text-black/70 focus:border-gray-200${instructionsError ? " border-error focus:border-error" : ""}`}
                  maxLength={300}
                />
                <div className="flex justify-between items-start mt-2 text-xs mx-4 gap-2">
                  {instructionsError ? (
                    <span className="text-error">{instructionsError}</span>
                  ) : (
                    <span className="text-grayscale-text-muted">{t("adForm.instructionsDisclaimer")}</span>
                  )}
                  <span className="text-grayscale-text-muted">{instructions.length}/300</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <FullPagePaymentSelection
        isOpen={showFullPageModal}
        onClose={() => {
          setShowFullPageModal(false)
          onBottomSheetOpenChange?.(false)
        }}
        paymentMethods={availablePaymentMethods}
        selectedPaymentMethods={selectedPaymentMethodIds}
        onConfirm={(methods) => setSelectedPaymentMethodIds(methods)}
      />

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={isAddingPaymentMethod}
          onClose={() => {
            const fromSelection = addPanelOpenedFromSelectionRef.current
            addPanelOpenedFromSelectionRef.current = false
            setShowAddPaymentPanel(false)
            if (fromSelection) {
              // Came from the selection sheet — reopen it so the user can still pick.
              openSellPaymentSelection()
            } else {
              onBottomSheetOpenChange?.(false)
            }
          }}
        />
      )}
    </>
  )
}
