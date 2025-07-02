"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AdDetailsForm from "../components/ad-details-form"
import PaymentDetailsForm from "../components/payment-details-form"
import StatusModal from "../components/ui/status-modal"
import StatusBottomSheet from "../components/ui/status-bottom-sheet"
import type { AdFormData, StatusModalState } from "../types"
import { createAd, updateAd } from "../api/api-ads"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { X, ArrowLeft } from "lucide-react"
import { ProgressSteps } from "../components/ui/progress-steps"

export default function CreateAdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("mode") === "edit"
  const adId = searchParams.get("id")
  const isMobile = useIsMobile()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<AdFormData>>({})
  const [statusModal, setStatusModal] = useState<StatusModalState>({
    show: false,
    type: "success",
    title: "",
    message: "",
    subMessage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [adFormValid, setAdFormValid] = useState(false)
  const [paymentFormValid, setPaymentFormValid] = useState(false)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [hasSelectedPaymentMethods, setHasSelectedPaymentMethods] = useState(false)

  const formDataRef = useRef<Partial<AdFormData>>({})

  const steps = [
    { title: "Set Type and Price", completed: currentStep > 0 },
    { title: "Set payment details", completed: currentStep > 1 },
    { title: "Set ad conditions", completed: currentStep > 2 },
  ]

  interface SuccessData {
    type?: string
    id?: string
  }

  const convertToSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  }

  useEffect(() => {
    const loadEditData = async () => {
      if (isEditMode) {
        try {
          setIsLoading(true)
          const editData = localStorage.getItem("editAdData")
          if (editData) {
            const parsedData = JSON.parse(editData)

            let rateValue = 0
            if (parsedData.rate && parsedData.rate.value) {
              const rateMatch = parsedData.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
              if (rateMatch && rateMatch[2]) {
                rateValue = Number.parseFloat(rateMatch[2])
              }
            }

            let minAmount = 0
            let maxAmount = 0

            if (typeof parsedData.limits === "string") {
              const limitsMatch = parsedData.limits.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)\s+-\s+(\d+(?:\.\d+)?)/)
              if (limitsMatch) {
                minAmount = Number.parseFloat(limitsMatch[2])
                maxAmount = Number.parseFloat(limitsMatch[3])
              }
            } else if (parsedData.limits && typeof parsedData.limits === "object") {
              minAmount = parsedData.limits.min || 0
              maxAmount = parsedData.limits.max || 0
            }

            let paymentMethodNames: string[] = []
            let paymentMethodIds: number[] = []

            if (parsedData.paymentMethods && Array.isArray(parsedData.paymentMethods)) {
              if (parsedData.type?.toLowerCase() === "buy") {
                paymentMethodNames = parsedData.paymentMethods.map((methodName: string) => {
                  if (methodName.includes("_") || methodName === methodName.toLowerCase()) {
                    return methodName
                  }
                  return convertToSnakeCase(methodName)
                })
              } else {
                paymentMethodIds = parsedData.paymentMethods
                  .map((id: any) => Number(id))
                  .filter((id: number) => !isNaN(id))

                if (typeof window !== "undefined") {
                  ; (window as any).adPaymentMethodIds = paymentMethodIds
                }
              }
            }

            const formattedData: Partial<AdFormData> = {
              type: parsedData.type?.toLowerCase() === "sell" ? "sell" : "buy",
              totalAmount: parsedData.available?.current || 0,
              fixedRate: rateValue,
              minAmount: minAmount,
              maxAmount: maxAmount,
              paymentMethods: paymentMethodNames,
              payment_method_ids: paymentMethodIds,
              instructions: parsedData.description || "",
            }

            setFormData(formattedData)
            formDataRef.current = formattedData
          }
        } catch (error) {
          console.log(error);
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadEditData()
  }, [isEditMode])

  useEffect(() => {
    const checkSelectedPaymentMethods = () => {
      if (formData.type === "sell" && typeof window !== "undefined") {
        const selectedIds = (window as any).adPaymentMethodIds || []
        setHasSelectedPaymentMethods(selectedIds.length > 0)
      }
    }

    checkSelectedPaymentMethods()
    const interval = setInterval(checkSelectedPaymentMethods, 100)

    return () => clearInterval(interval)
  }, [formData.type])

  useEffect(() => {
    const handleAdFormValidation = (e: any) => {
      setAdFormValid(e.detail.isValid)
      if (e.detail.isValid) {
        const updatedData = { ...formData, ...e.detail.formData }
        formDataRef.current = updatedData
      }
    }

    const handlePaymentFormValidation = (e: any) => {
      setPaymentFormValid(e.detail.isValid)
      if (e.detail.isValid) {
        const updatedData = { ...formData, ...e.detail.formData }
        formDataRef.current = updatedData
      }
    }

    document.addEventListener("adFormValidationChange", handleAdFormValidation)
    document.addEventListener("paymentFormValidationChange", handlePaymentFormValidation)

    return () => {
      document.removeEventListener("adFormValidationChange", handleAdFormValidation)
      document.removeEventListener("paymentFormValidationChange", handlePaymentFormValidation)
    }
  }, [formData])

  useEffect(() => {
    const checkForSuccessData = () => {
      try {
        const creationDataStr = localStorage.getItem("adCreationSuccess")
        if (creationDataStr) {
          const successData = JSON.parse(creationDataStr) as SuccessData

          setStatusModal({
            show: true,
            type: "success",
            title: "Ad created",
            message: "If your ad doesn't receive an order within 3 days, it will be deactivated.",
            adType: successData.type?.toUpperCase(),
            adId: successData.id,
          })

          localStorage.removeItem("adCreationSuccess")
        }

        const updateDataStr = localStorage.getItem("adUpdateSuccess")
        if (updateDataStr) {
          localStorage.removeItem("adUpdateSuccess")
        }
      } catch { }
    }

    checkForSuccessData()
  }, [])

  const handleAdDetailsNext = (data: Partial<AdFormData>, errors?: Record<string, string>) => {
    const updatedData = { ...formData, ...data }
    setFormData(updatedData)
    formDataRef.current = updatedData

    if (!errors || Object.keys(errors).length === 0) {
      setCurrentStep(1)
    }
  }

  const formatErrorMessage = (errors: any[]): string => {
    if (!errors || errors.length === 0) {
      return "An unknown error occurred"
    }

    if (errors[0].code === "AdvertExchangeRateDuplicate") {
      const error = new Error(
        "You have another active ad with the same rate for this currency pair and order type. Set a different rate.",
      )
      error.name = "AdvertExchangeRateDuplicate"
      throw error
    }

    if (errors[0].code === "AdvertOrderRangeOverlap") {
      const error = new Error(
        "Change the minimum and/or maximum order limit for this ad. The range between these limits must not overlap with another active ad you created for this currency pair and order type.",
      )
      error.name = "AdvertOrderRangeOverlap"
      throw error
    }

    if (errors[0].message) {
      return errors[0].message
    }

    if (errors[0].code) {
      const errorCodeMap: Record<string, string> = {
        AdvertLimitReached: "You've reached the maximum number of ads allowed.",
        InvalidExchangeRate: "The exchange rate you provided is invalid.",
        InvalidOrderAmount: "The order amount limits are invalid.",
        InsufficientBalance: "You don't have enough balance to create this ad.",
        AdvertTotalAmountExceeded: "The total amount exceeds your available balance. Please enter a smaller amount.",
      }

      if (errorCodeMap[errors[0].code]) {
        const error = new Error(errorCodeMap[errors[0].code])
        error.name = errors[0].code
        throw error
      }

      return `Error: ${errors[0].code}. Please try again or contact support.`
    }

    return "There was an error processing your request. Please try again."
  }

  const handlePaymentDetailsSubmit = async (data: Partial<AdFormData>, errors?: Record<string, string>) => {
    const finalData = { ...formData, ...data }
    formDataRef.current = finalData

    if (errors && Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const selectedPaymentMethodIds = finalData.type === "sell" ? (window as any).adPaymentMethodIds || [] : []

      if (isEditMode && adId) {
        const payload = {
          is_active: true,
          minimum_order_amount: finalData.minAmount || 0,
          maximum_order_amount: finalData.maxAmount || 0,
          available_amount: finalData.totalAmount || 0,
          exchange_rate: finalData.fixedRate || 0,
          exchange_rate_type: "fixed",
          order_expiry_period: 15,
          description: finalData.instructions || "",
          ...(finalData.type === "buy"
            ? { payment_method_names: finalData.paymentMethods || [] }
            : { payment_method_ids: selectedPaymentMethodIds }),
        }

        const updateResult = await updateAd(adId, payload)

        if (updateResult.errors && updateResult.errors.length > 0) {
          const errorMessage = formatErrorMessage(updateResult.errors)
          throw new Error(errorMessage)
        }

        localStorage.removeItem("editAdData")
        localStorage.setItem("adUpdateSuccess", JSON.stringify({ success: true }))
        router.push("/ads")
      } else {
        const payload = {
          type: finalData.type || "buy",
          account_currency: "USD",
          payment_currency: "IDR",
          minimum_order_amount: finalData.minAmount || 0,
          maximum_order_amount: finalData.maxAmount || 0,
          available_amount: finalData.totalAmount || 0,
          exchange_rate: finalData.fixedRate || 0,
          exchange_rate_type: "fixed" as const,
          description: finalData.instructions || "",
          is_active: 1,
          order_expiry_period: 15,
          ...(finalData.type === "buy"
            ? { payment_method_names: finalData.paymentMethods || [] }
            : { payment_method_ids: selectedPaymentMethodIds }),
        }

        const result = await createAd(payload)

        if (result.errors && result.errors.length > 0) {
          const errorMessage = formatErrorMessage(result.errors)
          throw new Error(errorMessage)
        }

        localStorage.setItem(
          "adCreationSuccess",
          JSON.stringify({
            type: result.data.type,
            id: result.data.id,
          }),
        )

        router.push("/ads")
      }
    } catch (error) {
      let errorInfo = {
        title: isEditMode ? "Failed to update ad" : "Failed to create ad",
        message: "Please try again.",
        type: "error" as "error" | "warning",
        actionButtonText: "Update ad",
      }

      if (error instanceof Error) {
        if (error.name === "AdvertExchangeRateDuplicate") {
          errorInfo = {
            title: "You already have an ad with this rate.",
            message:
              "You have another active ad with the same rate for this currency pair and order type. Set a different rate.",
            type: "warning",
            actionButtonText: "Update ad",
          }
        } else if (error.name === "AdvertOrderRangeOverlap") {
          errorInfo = {
            title: "You already have an ad with this range.",
            message:
              "Change the minimum and/or maximum order limit for this ad. The range between these limits must not overlap with another active ad you created for this currency pair and order type.",
            type: "warning",
            actionButtonText: "Update ad",
          }
        } else if (error.name === "AdvertLimitReached" || error.message === "ad_limit_reached") {
          errorInfo = {
            title: "Ad limit reached",
            message:
              "You can have only 3 active ads for this currency pair and order type. Delete one to create a new ad.",
            type: "error",
            actionButtonText: "Update ad",
          }
        } else if (error.name === "InsufficientBalance") {
          errorInfo = {
            title: "Insufficient balance",
            message: "You don't have enough balance to create this ad.",
            type: "error",
            actionButtonText: "Update ad",
          }
        } else if (error.name === "InvalidExchangeRate" || error.name === "InvalidOrderAmount") {
          errorInfo = {
            title: "Invalid values",
            message: error.message || "Please check your input values.",
            type: "error",
            actionButtonText: "Update ad",
          }
        } else if (error.name === "AdvertTotalAmountExceeded") {
          errorInfo = {
            title: "Amount exceeds balance",
            message: "The total amount exceeds your available balance. Please enter a smaller amount.",
            type: "error",
            actionButtonText: "Update ad",
          }
        } else {
          errorInfo.message = error.message || errorInfo.message
        }
      }

      setStatusModal({
        show: true,
        type: errorInfo.type,
        title: errorInfo.title,
        message: errorInfo.message,
        actionButtonText: errorInfo.actionButtonText,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBottomSheetOpenChange = (isOpen: boolean) => {
    setIsBottomSheetOpen(isOpen)
  }

  const handleButtonClick = () => {
    if (isBottomSheetOpen) {
      return
    }

    if (currentStep === 0 && !adFormValid) {
      return
    }

    if (currentStep === 1) {
      if (formData.type === "buy" && !paymentFormValid) {
        return
      }

      if (formData.type === "sell" && !hasSelectedPaymentMethods) {
        return
      }

      if (isSubmitting) {
        return
      }
    }

    if (currentStep === 0) {
      const adDetailsFormData = document.getElementById("ad-details-form") as HTMLFormElement
      if (adDetailsFormData) {
        adDetailsFormData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    } else {
      const paymentDetailsFormData = document.getElementById("payment-details-form") as HTMLFormElement
      if (paymentDetailsFormData) {
        paymentDetailsFormData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    }
  }

  const handleModalClose = () => {
    setStatusModal((prev) => ({ ...prev, show: false }))
  }

  const handleClose = () => {
    router.push("/ads")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const isButtonDisabled =
    isSubmitting ||
    (currentStep === 0 && !adFormValid) ||
    (currentStep === 1 && formData.type === "buy" && !paymentFormValid) ||
    (currentStep === 1 && formData.type === "sell" && !hasSelectedPaymentMethods) ||
    isBottomSheetOpen

  return (
    <div className="max-w-[600px] mx-auto py-6 mt-8 progress-steps-container overflow-auto h-full pb-24 px-4 md:px-0">
      <style jsx global>{`
        input::placeholder {
          font-weight: 400;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: 0%;
        }
        textarea::placeholder {
          font-weight: 400;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: 0%;
        }
        .progress-steps-container .absolute.top-5 {
          top: 12px;
        }
      `}</style>
      <style jsx>{`
  :global(body),
  :global(html),
  :global(#__next),
  :global(main),
  :global(.container) {
    overflow-y: auto !important;
    height: auto !important;
  }
`}</style>
      <div
        className={`flex ${currentStep === 0 ? "justify-end" : "justify-between"} mb-7 md:mt-8 sticky top-0 z-10 bg-white py-1 relative items-center border-b md:border-b-0 -mx-4 px-4 md:mx-0 md:px-0 border-gray-200`}
      >
        {currentStep === 1 && (
          <button onClick={() => setCurrentStep(0)} className="text-gray-700 hover:text-gray-900 p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-[18px] leading-[28px] tracking-[0%]">
          {isEditMode ? `Edit ${formData.type === "sell" ? "Sell" : "Buy"} ad` : "Create new ad"}
        </div>
        <button onClick={handleClose} className="text-gray-700 hover:text-gray-900 p-2">
          <X className="h-6 w-6" />
        </button>
      </div>

      <ProgressSteps currentStep={currentStep} steps={steps} />

      <div className="relative">
        {currentStep === 0 ? (
          <AdDetailsForm
            onNext={handleAdDetailsNext}
            onClose={handleClose}
            initialData={formData}
            isEditMode={isEditMode}
          />
        ) : (
          <PaymentDetailsForm
            onBack={() => setCurrentStep(0)}
            onSubmit={handlePaymentDetailsSubmit}
            onClose={handleClose}
            initialData={formData}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
            onBottomSheetOpenChange={handleBottomSheetOpenChange}
          />
        )}
      </div>

      {isMobile ? (
        <div className="fixed bottom-0 left-0 w-full bg-white mt-4 py-4 mb-16 md:mb-0 border-t border-gray-200">
          <div className="mx-6">
            <Button onClick={handleButtonClick} disabled={isButtonDisabled} className="w-full">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span>{isEditMode ? "Saving..." : "Creating..."}</span>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : currentStep === 0 ? (
                "Next"
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Ad"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="hidden md:block"></div>
      )}

      <div className="hidden md:flex justify-end mt-8">
        <Button onClick={handleButtonClick} disabled={isButtonDisabled}>
          {isSubmitting ? (
            <div className="flex flex-col items-center gap-1">
              <span>{isEditMode ? "Saving..." : "Creating..."}</span>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentStep === 0 ? (
            "Next"
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Create Ad"
          )}
        </Button>
      </div>

      {statusModal.show && !isMobile && (
        <StatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          subMessage={statusModal.subMessage}
          adType={statusModal.adType}
          adId={statusModal.adId}
          onClose={handleModalClose}
          actionButtonText={statusModal.actionButtonText}
        />
      )}

      {statusModal.show && isMobile && (
        <StatusBottomSheet
          isOpen={statusModal.show}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          subMessage={statusModal.subMessage}
          adType={statusModal.adType}
          adId={statusModal.adId}
          actionButtonText={statusModal.actionButtonText}
        />
      )}
    </div>
  )
}
