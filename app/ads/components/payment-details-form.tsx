"use client"


import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import type { AdFormData } from "../types"
import { useIsMobile } from "@/hooks/use-mobile"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ModalHeaderRow } from "@/components/ui/modal-header-row"
import { isRtlLocale } from "@/lib/i18n/config"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { getCategoryDisplayName, formatPaymentMethodName } from "@/lib/utils"
import { ProfileAPI } from "@/services/api"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { usePaymentSelection } from "./payment-selection-context"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAddPaymentMethod, type PaymentMethodError } from "@/hooks/use-api-queries"
import { useRouter } from "next/navigation"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import {
  appendSelectedPaymentMethodId,
  filterPaymentMethodsForAdvert,
  formatPaymentMethodAccountLine,
  getCreatedPaymentMethodId,
  isPaymentMethodIdSelected,
  mergeCreatedPaymentMethodIntoList,
  normalizePaymentMethodId,
  resolveSelectedUserPaymentMethodIds,
  sortPaymentMethodsSelectedFirst,
  sortSelectableItemsSelectedFirst,
  toNumericPaymentMethodIds,
} from "@/lib/payment-methods/payment-method-selection-utils"

interface PaymentMethod {
  display_name: string
  method: string
  type: string
  fields: Record<string, any>
}

interface UserPaymentMethod {
  id: string
  type: string
  display_name: string
  fields: Record<string, any>
  is_enabled: number
  method: string
}

interface AvailablePaymentMethod {
  display_name: string
  type: string
  method: string
}

interface PaymentDetailsFormProps {
  initialData: Partial<AdFormData>
  onBottomSheetOpenChange?: (isOpen: boolean) => void
  userPaymentMethods: UserPaymentMethod[]
  availablePaymentMethods: AvailablePaymentMethod[]
  onRefetchPaymentMethods: () => Promise<void>
}

const FullPagePaymentSelection = ({
  isOpen,
  onClose,
  paymentMethods,
  selectedPaymentMethods,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  paymentMethods: (UserPaymentMethod | AvailablePaymentMethod)[]
  selectedPaymentMethods: string[]
  onConfirm: (methods: string[]) => void
}) => {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const isMobile = useIsMobile()
  const [localSelected, setLocalSelected] = useState<string[]>(selectedPaymentMethods)
  const [openStateSelection, setOpenStateSelection] = useState<string[]>(selectedPaymentMethods)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedPaymentMethods)
      setOpenStateSelection(selectedPaymentMethods)
      setSearchQuery("")
    }
  }, [isOpen, selectedPaymentMethods])

  const getMethodId = (method: UserPaymentMethod | AvailablePaymentMethod) => {
    return normalizePaymentMethodId("id" in method ? method.id : method.method)
  }

  const filteredMethods = useMemo(() => {
    const methods = Array.isArray(paymentMethods) ? paymentMethods : []
    const query = searchQuery.toLowerCase()

    return methods.filter((method) => method.display_name.toLowerCase().includes(query))
  }, [paymentMethods, searchQuery])

  const sortedFilteredMethods = useMemo(
    () =>
      sortSelectableItemsSelectedFirst(filteredMethods, openStateSelection, (method) =>
        getMethodId(method),
      ),
    [filteredMethods, openStateSelection],
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

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {isMobile && (
        <div className="shrink-0 px-4 pb-4 text-center">
          <p className="text-base text-grayscale-600">{t("paymentMethod.selectUpTo3")}</p>
        </div>
      )}
      <div className={`shrink-0 ${isMobile ? "px-4 pb-6" : ""}`}>
        <div className="relative">
          <Image
            src="/icons/search-icon-custom.png"
            alt={t("common.search")}
            width={24}
            height={24}
            className="absolute start-2 md:start-4 top-1/2 transform -translate-y-1/2 z-10"
          />
          <Input
            type="text"
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`text-base ps-[40px] md:ps-[48px] pe-10 h-8 md:h-14 bg-grayscale-500 focus:ring-0 rounded-lg placeholder:text-grayscale-text-placeholder placeholder:text-base placeholder:font-normal ${searchQuery.length > 0 && isSearchFocused ? "border border-black" : "border-0 focus:border-0"
              }`}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute end-2 md:end-4 top-1/2 transform -translate-y-1/2 hover:bg-transparent p-0 h-auto"
            >
              <Image src="/icons/clear-search-icon.png" alt={t("common.clearSearch")} width={24} height={24} />
            </Button>
          )}
        </div>
      </div>
      {!isMobile && sortedFilteredMethods.length > 0 && (
        <div className="shrink-0 my-0">
          <p className="text-base text-slate-1200">{t("paymentMethod.selectUpTo3")}</p>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-0 space-y-2">
        {sortedFilteredMethods.length === 0 ? (
          <div className="text-center pt-0 pb-4 md:pt-4 md:pb-8 flex flex-col items-center">
            <Image src="/icons/magnifier.png" alt={t("common.noResults")} width={88} height={88} className="mb-0" />
            <p className="text-slate-1200 text-base font-bold text-center mb-2">
              {t("paymentMethod.noMatchingPayment")}
            </p>
            <p className="text-grayscale-text-muted text-base text-center">
              {t("profile.noResultForPrefix")} &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          sortedFilteredMethods.map((method) => {
            const methodId = getMethodId(method)
            const isSelected = isPaymentMethodIdSelected(localSelected, methodId)
            const isDisabled = !isSelected && localSelected.length >= 3

            return (
              <div
                key={methodId}
                className={`bg-grayscale-500 rounded-lg p-4 flex items-center justify-between gap-3 min-w-0 cursor-pointer ${isSelected ? "border border-black" : "border border-transparent"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !isDisabled && handleToggle(methodId)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={`h-[10px] w-[10px] shrink-0 rounded-full mx-[11px] ${method.type === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"}`}
                  />
                  <span className={`text-base truncate ${isDisabled ? "text-gray-400" : "text-slate-1200"}`}>{method.display_name}</span>
                </div>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && handleToggle(methodId)}
                    className="w-[14px] h-[14px] data-[state=checked]:bg-black border-2 border-grayscale-text-muted rounded-[2px]"
                    data-testid={`ad-form-checkbox-payment-${methodId}`}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className={`shrink-0 ${isMobile ? "px-4 pt-4 pb-6" : "pt-4 pb-6"}`}>
        <Button onClick={handleConfirm} disabled={localSelected.length === 0} className="w-full">
          {t("common.confirm")}
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent dir={dir} className="max-h-[90vh] flex flex-col overflow-hidden" data-testid="ad-form-sheet-payment-methods">
          <DrawerHeader className="shrink-0 pb-[10px] text-start">
            <DrawerTitle className="text-[20px] font-bold text-start">{t("paymentMethod.title")}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={dir} className="max-w-xl max-h-[90vh] flex flex-col min-h-0 p-8 rounded-[32px]" data-testid="ad-form-sheet-payment-methods">
        <ModalHeaderRow
          asDialog
          title={t("paymentMethod.title")}
          onClose={onClose}
          closeAriaLabel={t("common.close")}
          titleClassName="text-2xl font-extrabold"
          closeIconSrc="/icons/button-close.png"
          closeIconSize={48}
          closeButtonClassName="hover:bg-transparent hover:opacity-80 px-0 min-w-[48px]"
          className="mb-4"
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
}: {
  paymentMethods: (UserPaymentMethod | PaymentMethod)[]
  tempSelectedPaymentMethods: string[]
  setTempSelectedPaymentMethods: (methods: string[]) => void
  hideAlert: () => void
  setSelectedPaymentMethods: (methods: string[]) => void
  handleAddPaymentMethodClick?: () => void
}) => {
  const { t } = useTranslations()
  const [selectedPMs, setSelectedPMs] = useState(tempSelectedPaymentMethods)
  const [openStateSelection] = useState(tempSelectedPaymentMethods)

  useEffect(() => {
    setSelectedPMs(tempSelectedPaymentMethods)
  }, [tempSelectedPaymentMethods])

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPMs((prev) => {
      if (isPaymentMethodIdSelected(prev, methodId)) {
        return prev.filter((id) => !isPaymentMethodIdSelected([id], methodId))
      }
      if (prev.length < 3) {
        return [...prev, normalizePaymentMethodId(methodId)]
      }
      return prev
    })
  }

  const getMethodId = (method: UserPaymentMethod | PaymentMethod) => {
    return normalizePaymentMethodId("id" in method ? method.id : method.method)
  }

  const getMethodType = (method: UserPaymentMethod | PaymentMethod) => {
    return method.type
  }

  const getMethodAccountInfo = (method: UserPaymentMethod | PaymentMethod) => {
    if ("fields" in method && method.fields?.account?.value) {
      return formatPaymentMethodAccountLine(
        method.display_name,
        String(method.fields.account.value),
        t,
      )
    }
    return formatPaymentMethodName(method.display_name, t)
  }

  const userMethods = useMemo(
    () => paymentMethods.filter((method): method is UserPaymentMethod => "id" in method),
    [paymentMethods],
  )
  const sortedPaymentMethods = useMemo(
    () => sortPaymentMethodsSelectedFirst(userMethods, openStateSelection),
    [userMethods, openStateSelection],
  )

  return (
    <div
      className="flex flex-col flex-1 min-h-0 h-full"
      data-testid="ad-form-sheet-payment-methods"
    >
      {paymentMethods.length > 0 && (
        <div className="shrink-0 pb-4 text-grayscale-600">{t("paymentMethod.selectUpTo3")}</div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{t("adForm.noPaymentMethodsFound")}</p>
          </div>
        ) : (
          sortedPaymentMethods.map((method) => {
            const methodId = getMethodId(method)
            const isSelected = isPaymentMethodIdSelected(selectedPMs, methodId)
            const isDisabled = !isSelected && selectedPMs.length >= 3

            return (
              <div
                key={methodId}
                className={`bg-grayscale-500 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-color ${isDisabled
                  ? "opacity-30 cursor-not-allowed hover:bg-white"
                  : ""
                  } ${isSelected ? "border border-black" : ""
                  }`}
                onClick={() => !isDisabled && handlePaymentMethodToggle(methodId)}
              >
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${getMethodType(method) === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                        }`}
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="text-base text-slate-1200">
                        {getCategoryDisplayName(getMethodType(method), t)}
                      </span>
                      <span className="text-base text-grayscale-text-muted truncate">
                        {getMethodAccountInfo(method)}
                      </span>
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !isDisabled && handlePaymentMethodToggle(methodId)}
                    disabled={isDisabled}
                    className="shrink-0 border-neutral-7 data-[state=checked]:bg-black data-[state=checked]:border-black w-[20px] h-[20px] rounded-sm border-[2px] disabled:opacity-30 disabled:cursor-not-allowed pointer-events-none"
                    data-testid={`ad-form-checkbox-payment-${methodId}`}
                  />
                </div>
              </div>
            )
          })
        )}

        {handleAddPaymentMethodClick && (
          <div
            className="bg-grayscale-500 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => {
              handleAddPaymentMethodClick()
            }}
            data-testid="ad-form-btn-add-payment"
          >
            <div className="flex items-center">
              <Image src="/icons/plus_icon.png" alt={t("common.plus")} width={14} height={24} className="me-2" />
              <span className="text-slate-1200 text-base">{t("paymentMethod.addPaymentMethod")}</span>
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 pt-4 pb-6 md:py-4">
        <Button
          className="w-full"
          disabled={selectedPMs.length == 0}
          onClick={() => {
            const confirmedSelection = resolveSelectedUserPaymentMethodIds(
              selectedPMs,
              userMethods,
            )
            setSelectedPaymentMethods(confirmedSelection)
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
}: PaymentDetailsFormProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { mutateAsync: addPaymentMethod, isPending: isAddingPaymentMethod } = useAddPaymentMethod()
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData.paymentMethods || [])
  const [instructions, setInstructions] = useState(initialData.instructions || "")
  const [instructionsError, setInstructionsError] = useState("")
  const [touched, setTouched] = useState(false)
  const [tempSelectedPaymentMethods, setTempSelectedPaymentMethods] = useState<string[]>([])
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const [showFullPageModal, setShowFullPageModal] = useState(false)
  const { hideAlert, showAlert } = useAlertDialog()
  const { selectedPaymentMethodIds, setSelectedPaymentMethodIds } = usePaymentSelection()

  const validateInstructions = (value: string) => {
    // Allow letters, numbers, spaces, and special chars: @ - . ! / % & , _ ( ) + : ;
    // Max 300 characters (enforced by maxLength on textarea)
    const allowedPattern = new RegExp('^[\\p{L}\\p{Nd}\\s@\\-\\.!\\/%&,_()+:;]{0,300}$', 'u')
    return allowedPattern.test(value)
  }

  const isFormValid = () => {
    return selectedPaymentMethodIds.length > 0 && validateInstructions(instructions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
  }

  const handleAddPaymentMethodClick = useCallback(() => {
    setShowAddPaymentPanel(true)
    hideAlert()
  }, [hideAlert])

  const openSellPaymentSelection = useCallback(
    (selectionOverride?: string[], methodsOverride?: UserPaymentMethod[]) => {
      const currentSelection = selectionOverride ?? selectedPaymentMethodIds
      const methodsForSheet = methodsOverride ?? userPaymentMethods

      showAlert({
        title: t("paymentMethod.paymentMethodsSheetTitle"),
        content: (
          <PaymentSelectionContent
            paymentMethods={methodsForSheet}
            tempSelectedPaymentMethods={currentSelection}
            setTempSelectedPaymentMethods={setSelectedPaymentMethodIds}
            setSelectedPaymentMethods={setSelectedPaymentMethodIds}
            hideAlert={hideAlert}
            handleAddPaymentMethodClick={handleAddPaymentMethodClick}
          />
        ),
      })
    },
    [
      handleAddPaymentMethodClick,
      hideAlert,
      selectedPaymentMethodIds,
      setSelectedPaymentMethodIds,
      showAlert,
      t,
      userPaymentMethods,
    ],
  )

  const handleShowPaymentSelection = () => {
    if (initialData.type === "buy") {
      setShowFullPageModal(true)
    } else {
      openSellPaymentSelection()
    }
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      const result = await addPaymentMethod({ method, fields })
      setShowAddPaymentPanel(false)
      await onRefetchPaymentMethods()

      if (initialData.type === "sell") {
        const created = result.data as UserPaymentMethod | undefined
        const createdId = getCreatedPaymentMethodId(created)
        const nextUserPaymentMethods = mergeCreatedPaymentMethodIntoList(
          userPaymentMethods,
          created,
        )
        let nextSelection = [...selectedPaymentMethodIds]

        if (createdId) {
          nextSelection = appendSelectedPaymentMethodId(nextSelection, createdId)
          setSelectedPaymentMethodIds(nextSelection)
        }

        openSellPaymentSelection(nextSelection, nextUserPaymentMethods)
      }
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
    const methods = initialData.type === "buy" ? availablePaymentMethods : userPaymentMethods

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
          payment_method_ids: toNumericPaymentMethodIds(selectedPaymentMethodIds),
          paymentMethods: paymentMethodNames,
          instructions,
        },
      },
      bubbles: true,
    })
    document.dispatchEvent(event)
  }, [paymentMethods, selectedPaymentMethodIds, instructions, userPaymentMethods, initialData.type])

  return (
    <>
      <div className="h-full flex flex-col">
        <form id="payment-details-form" onSubmit={handleSubmit} className="flex-1">
          <div className="max-w-[800px] mx-auto h-full flex flex-col">
            <div>
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full justify-between px-4 rounded-lg bg-transparent border-input hover:bg-transparent max-h-none h-[56px]"
                  onClick={() => handleShowPaymentSelection()}
                  type="button"
                >
                  <span className="text-left font-normal text-base text-black/[0.72]">
                    {getSelectedPaymentMethodsText()}
                  </span>
                  <Image src="/icons/chevron-down.png" alt={t("common.dropdown")} width={24} height={24} className="ms-2" />
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
                  className={`min-h-[120px] resize-none${instructionsError ? " border-red-500" : ""}`}
                  maxLength={300}
                />
                <div className="flex justify-between items-start mt-2 text-xs mx-4 gap-2">
                  {instructionsError ? (
                    <span className="text-red-500">{instructionsError}</span>
                  ) : (
                    <span className="text-gray-500">{t("adForm.instructionsDisclaimer")}</span>
                  )}
                  <span className="text-gray-500">{instructions.length}/300</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <FullPagePaymentSelection
        isOpen={showFullPageModal}
        onClose={() => setShowFullPageModal(false)}
        paymentMethods={initialData.type === "buy" ? availablePaymentMethods : userPaymentMethods}
        selectedPaymentMethods={selectedPaymentMethodIds}
        onConfirm={(methods) => setSelectedPaymentMethodIds(methods)}
      />

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={isAddingPaymentMethod}
          onClose={() => setShowAddPaymentPanel(false)}
        />
      )}
    </>
  )
}
