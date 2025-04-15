"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AdDetailsForm from "../components/ad-details-form"
import PaymentDetailsForm from "../components/payment-details-form"
// Update imports to use custom components
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Add these new state variables at the top of the component
  const [adFormValid, setAdFormValid] = useState(false)
  const [paymentFormValid, setPaymentFormValid] = useState(false)
  // Add isBottomSheetOpen state
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  // New state for showing the updated banner
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false)

  // Use a ref to store the current form data for the button click handler
  const formDataRef = useRef<Partial<AdFormData>>({})

  const steps = [
    { title: "Set Type and Price", completed: currentStep > 0 },
    { title: "Set payment details", completed: currentStep > 1 },
    { title: "Set ad conditions", completed: currentStep > 2 },
  ]

  // Define the SuccessData type
  interface SuccessData {
    type?: string
    id?: string
  }

  // Load edit data if in edit mode
  useEffect(() => {
    const loadEditData = async () => {
      if (isEditMode) {
        try {
          setIsLoading(true)
          const editData = localStorage.getItem("editAdData")
          if (editData) {
            const parsedData = JSON.parse(editData)
            console.log("Loaded edit data:", parsedData)
            console.log("Description from edit data:", parsedData.description)

            // Parse rate value to extract the number
            let rateValue = 0
            if (parsedData.rate && parsedData.rate.value) {
              const rateMatch = parsedData.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
              if (rateMatch && rateMatch[2]) {
                rateValue = Number.parseFloat(rateMatch[2])
              }
            }

            // Parse limits if it's a string
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

            // Transform API data to form data format
            const formattedData: Partial<AdFormData> = {
              type: parsedData.type?.toLowerCase() === "sell" ? "sell" : "buy",
              totalAmount: parsedData.available?.current || 0,
              fixedRate: rateValue,
              minAmount: minAmount,
              maxAmount: maxAmount,
              paymentMethods: parsedData.paymentMethods || [],
              instructions: parsedData.description || "", // Make sure to use the description field
            }

            console.log("Formatted form data:", formattedData)
            console.log("Instructions set to:", formattedData.instructions)
            setFormData(formattedData)
            formDataRef.current = formattedData
          }
        } catch (error) {
          console.error("Error loading edit data:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadEditData()
  }, [isEditMode])

  // Add these event listeners after the useEffect for loading edit data
  useEffect(() => {
    // Listen for validation changes from the ad details form
    const handleAdFormValidation = (e: any) => {
      setAdFormValid(e.detail.isValid)
      if (e.detail.isValid) {
        // Update form data if valid
        const updatedData = { ...formData, ...e.detail.formData }
        formDataRef.current = updatedData
      }
    }

    // Listen for validation changes from the payment details form
    const handlePaymentFormValidation = (e: any) => {
      setPaymentFormValid(e.detail.isValid)
      if (e.detail.isValid) {
        // Update form data if valid
        const updatedData = { ...formData, ...e.detail.formData }
        formDataRef.current = updatedData
      }
    }

    // Add event listeners
    document.addEventListener("adFormValidationChange", handleAdFormValidation)
    document.addEventListener("paymentFormValidationChange", handlePaymentFormValidation)

    // Clean up event listeners
    return () => {
      document.removeEventListener("adFormValidationChange", handleAdFormValidation)
      document.removeEventListener("paymentFormValidationChange", handlePaymentFormValidation)
    }
  }, [formData])

  // Add this useEffect after the other useEffect hooks, before any conditional logic
  useEffect(() => {
    const checkForSuccessData = () => {
      try {
        const creationDataStr = localStorage.getItem("adCreationSuccess")
        if (creationDataStr) {
          const successData = JSON.parse(creationDataStr) as SuccessData

          // Set the same status modal data regardless of device
          // The render logic will determine which component to show
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
          setShowUpdatedBanner(true)
          setTimeout(() => {
            setShowUpdatedBanner(false)
          }, 3000)
          localStorage.removeItem("adUpdateSuccess")
        }
      } catch (err) {
        console.error("Error checking for success data:", err)
      }
    }

    checkForSuccessData()
  }, [])

  const handleAdDetailsNext = (data: Partial<AdFormData>, errors?: Record<string, string>) => {
    const updatedData = { ...formData, ...data }
    setFormData(updatedData)
    formDataRef.current = updatedData

    // Update form errors state
    setFormErrors(errors || {})

    // Only proceed to next step if there are no errors
    if (!errors || Object.keys(errors).length === 0) {
      setCurrentStep(1)
    }

    // Log the updated form data
    console.group("📝 Updated Form Data (Ad Details)")
    console.log("Form Data:", updatedData)
    console.log("Form Errors:", errors)
    console.groupEnd()
  }

  // Helper function to format error messages from the API response
  const formatErrorMessage = (errors: any[]): string => {
    if (!errors || errors.length === 0) {
      return "An unknown error occurred"
    }

    // Check for specific error code structures
    if (errors[0].code === "AdvertExchangeRateDuplicate") {
      const error = new Error(
        "You have another active ad with the same rate for this currency pair and order type. Set a different rate.",
      )
      error.name = "AdvertExchangeRateDuplicate"
      throw error
    }

    // Add handling for AdvertOrderRangeOverlap
    if (errors[0].code === "AdvertOrderRangeOverlap") {
      const error = new Error(
        "Change the minimum and/or maximum order limit for this ad. The range between these limits must not overlap with another active ad you created for this currency pair and order type.",
      )
      error.name = "AdvertOrderRangeOverlap"
      throw error
    }

    // Handle other error formats
    if (errors[0].message) {
      return errors[0].message
    }

    if (errors[0].code) {
      // Map other error codes to user-friendly messages
      const errorCodeMap: Record<string, string> = {
        AdvertLimitReached: "You've reached the maximum number of ads allowed.",
        InvalidExchangeRate: "The exchange rate you provided is invalid.",
        InvalidOrderAmount: "The order amount limits are invalid.",
        InsufficientBalance: "You don't have enough balance to create this ad.",
        AdvertTotalAmountExceeded: "The total amount exceeds your available balance. Please enter a smaller amount.",
      }

      // If we have a mapping for this error code, use it
      if (errorCodeMap[errors[0].code]) {
        const error = new Error(errorCodeMap[errors[0].code])
        error.name = errors[0].code
        throw error
      }

      // Otherwise, return a generic message with the error code
      return `Error: ${errors[0].code}. Please try again or contact support.`
    }

    // If we can't determine a specific error message, return a generic one
    return "There was an error processing your request. Please try again."
  }

  const handlePaymentDetailsSubmit = async (data: Partial<AdFormData>, errors?: Record<string, string>) => {
    const finalData = { ...formData, ...data }
    formDataRef.current = finalData

    // Update form errors
    setFormErrors(errors || {})

    // Only proceed with submission if there are no errors
    if (errors && Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      // Log the form data for debugging
      console.group("📝 Final Form Data")
      console.log("Final Form Data:", finalData)
      console.log("Is Edit Mode:", isEditMode)
      console.log("Ad ID:", adId)
      console.groupEnd()

      if (isEditMode && adId) {
        // Update existing ad
        const payload = {
          is_active: true,
          minimum_order_amount: finalData.minAmount || 0,
          maximum_order_amount: finalData.maxAmount || 0,
          available_amount: finalData.totalAmount || 0,
          exchange_rate: finalData.fixedRate || 0,
          exchange_rate_type: "fixed",
          order_expiry_period: 15,
          description: finalData.instructions || "",
          // Only include payment methods for buy ads
          ...(finalData.type !== "sell" && { payment_method_names: finalData.paymentMethods || [] }),
        }

        console.log("Update payload:", payload)
        const updateResult = await updateAd(adId, payload)

        // Check for errors in the response
        if (updateResult.errors && updateResult.errors.length > 0) {
          // Handle errors from the API response
          const errorMessage = formatErrorMessage(updateResult.errors)
          throw new Error(errorMessage)
        }

        // Clear edit data
        localStorage.removeItem("editAdData")

        // Store success data for banner display
        localStorage.setItem("adUpdateSuccess", JSON.stringify({ success: true }))

        // Navigate back to ads list
        router.push("/ads")
      } else {
        // Create new ad
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
          // Only include payment methods for buy ads
          ...(finalData.type !== "sell"
            ? { payment_method_names: finalData.paymentMethods || [] }
            : { payment_method_names: [] }),
        }

        const result = await createAd(payload)

        // Check for errors in the response even if HTTP status is 200
        if (result.errors && result.errors.length > 0) {
          // Handle errors from the API response
          const errorMessage = formatErrorMessage(result.errors)
          throw new Error(errorMessage)
        }

        // Store success data in localStorage before navigation
        localStorage.setItem(
          "adCreationSuccess",
          JSON.stringify({
            type: result.data.type,
            id: result.data.id,
          }),
        )

        // Navigate to the ads screen
        router.push("/ads")
      }
    } catch (error) {
      console.error("Error creating/updating ad:", error)

      let errorInfo = {
        title: isEditMode ? "Failed to update ad" : "Failed to create ad",
        message: "Please try again.",
        type: "error" as "error" | "warning",
        actionButtonText: "Update ad",
      }

      // Check if the error is from the API with a specific error code
      if (error instanceof Error) {
        // Check for specific error codes
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

  // Add this handler function inside the component
  const handleBottomSheetOpenChange = (isOpen: boolean) => {
    setIsBottomSheetOpen(isOpen)
    // Make sure we're not triggering any form submissions or API calls here
    // Just update the state to control button availability
  }

  const handleButtonClick = () => {
    // Don't proceed if the bottom sheet is open
    if (isBottomSheetOpen) {
      return
    }

    // Don't proceed if the button should be disabled
    if (currentStep === 0 && !adFormValid) {
      return
    }

    if (currentStep === 1 && (!paymentFormValid || isSubmitting)) {
      return
    }

    if (currentStep === 0) {
      // Get the current form data from the ref
      const adDetailsFormData = document.getElementById("ad-details-form") as HTMLFormElement
      if (adDetailsFormData) {
        adDetailsFormData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    } else {
      // Get the current form data from the ref
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

  return (
    <div className="max-w-[800px] mx-auto py-6 mt-8 progress-steps-container overflow-auto h-full pb-24 px-4 md:px-0">
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
        /* Add styling to center the connecting lines */
        .progress-steps-container .absolute.top-5 {
          top: 12px; /* Center the line with the circles */
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
    min-height: 100vh !important;
  }
`}</style>
      {/* Header with back and close buttons */}
      <div
        className={`flex ${currentStep === 0 ? "justify-end" : "justify-between"} mb-7 md:mt-8 sticky top-0 z-10 bg-white py-1 relative items-center border-b md:border-b-0 -mx-4 px-4 md:mx-0 md:px-0`}
        style={{ borderBottomColor: "var(--Neutral-Neutral-3, #E9ECEF)" }}
      >
        {currentStep === 1 && (
          <button onClick={() => setCurrentStep(0)} className="text-gray-700 hover:text-gray-900 p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-[18px] leading-[28px] tracking-[0%]">
          Create new ad
        </div>
        <button onClick={handleClose} className="text-gray-700 hover:text-gray-900 p-2">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Progress steps */}
      <ProgressSteps currentStep={currentStep} steps={steps} />

      {/* Form content */}
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

      {/* Fixed positioned button at bottom right - Updated to use Button variants */}
      {isMobile ? (
        <div
          className="fixed bottom-0 left-0 w-full bg-white mt-4 py-4 mb-16 md:mb-0"
          style={{ borderTop: "1px solid var(--Neutral-Neutral-3, #E9ECEF)" }}
        >
          <div className={`mx-6`}>
            <Button
              onClick={handleButtonClick}
              disabled={
                isSubmitting ||
                (currentStep === 0 && !adFormValid) ||
                (currentStep === 1 && !paymentFormValid) ||
                isBottomSheetOpen
              }
              variant={
                isSubmitting ||
                  (currentStep === 0 && !adFormValid) ||
                  (currentStep === 1 && !paymentFormValid) ||
                  isBottomSheetOpen
                  ? "outline"
                  : "cyan"
              }
              size="pill"
              className="w-full font-extrabold text-base leading-4 tracking-[0%] text-center"
            >
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
        <div className={`fixed bottom-24 md:bottom-6 right-6`}>
          <Button
            onClick={handleButtonClick}
            disabled={
              isSubmitting ||
              (currentStep === 0 && !adFormValid) ||
              (currentStep === 1 && !paymentFormValid) ||
              isBottomSheetOpen
            }
            variant={
              isSubmitting ||
                (currentStep === 0 && !adFormValid) ||
                (currentStep === 1 && !paymentFormValid) ||
                isBottomSheetOpen
                ? "outline"
                : "cyan"
            }
            size="pill"
            className="w-full font-extrabold text-sm leading-tight text-center whitespace-normal"
          >
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
      )}

      {/* Status Modal for desktop */}
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

      {/* Status Bottom Sheet for mobile */}
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
