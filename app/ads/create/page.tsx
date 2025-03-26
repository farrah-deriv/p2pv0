"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProgressSteps from "../components/progress-steps"
import AdDetailsForm from "../components/ad-details-form"
import PaymentDetailsForm from "../components/payment-details-form"
import StatusModal from "@/components/ui/status-modal"
import type { AdFormData, StatusModalState } from "../types"
import { createAd, updateAd } from "../api/api-ads"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"

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

  // Use a ref to store the current form data for the button click handler
  const formDataRef = useRef<Partial<AdFormData>>({})

  const steps = [
    { title: "Ad details", completed: currentStep > 0 },
    { title: "Payment details", completed: currentStep > 1 },
  ]

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
              instructions: parsedData.description || "",
            }

            console.log("Formatted form data:", formattedData)
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

    // Check if errors have a specific format
    if (errors[0].message) {
      return errors[0].message
    }

    if (errors[0].code) {
      // Map error codes to user-friendly messages
      const errorCodeMap: Record<string, string> = {
        AdvertExchangeRateDuplicate: "You already have an ad with this exchange rate. Please use a different rate.",
        AdvertLimitReached: "You've reached the maximum number of ads allowed.",
        InvalidExchangeRate: "The exchange rate you provided is invalid.",
        InvalidOrderAmount: "The order amount limits are invalid.",
        InsufficientBalance: "You don't have enough balance to create this ad.",
        // Add the new error code mapping
        AdvertTotalAmountExceeded: "The total amount exceeds your available balance. Please enter a smaller amount.",
      }

      return errorCodeMap[errors[0].code] || `Error: ${errors[0].code}. Please try again or contact support.`
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
      // Error handling remains the same
      let errorMessage = isEditMode
        ? "Failed to update ad. Please try again."
        : "Failed to create ad. Please try again."
      let errorTitle = "Error"

      if (error instanceof Error) {
        if (error.message === "ad_limit_reached" || error.name === "AdvertLimitReached") {
          errorTitle = "Ad limit reached"
          errorMessage =
            "You can have only 3 active ads for this currency pair and order type. Delete one to create a new ad."
        } else if (error.name === "AdvertExchangeRateDuplicate") {
          errorTitle = "Duplicate exchange rate"
          errorMessage = "You already have an ad with this exchange rate. Please use a different rate."
        } else if (error.name === "InsufficientBalance") {
          errorTitle = "Insufficient balance"
          errorMessage = "You don't have enough balance to create this ad."
        } else if (error.name === "InvalidExchangeRate" || error.name === "InvalidOrderAmount") {
          errorTitle = "Invalid values"
          errorMessage = error.message
        } else if (error.name === "AdvertTotalAmountExceeded") {
          errorTitle = "Amount exceeds balance"
          errorMessage = "The total amount exceeds your available balance. Please enter a smaller amount."
        } else {
          errorMessage = error.message || errorMessage
        }
      }

      setStatusModal({
        show: true,
        type: "error",
        title: errorTitle,
        message: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleButtonClick = () => {
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMobile ? "flex-col" : "h-screen"} mt-16 -mx-4`}>
      {/* Sidebar for desktop only - hidden on mobile */}
      {!isMobile && (
        <div className="w-[240px] bg-gray-50 h-full">
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-6">{isEditMode ? "Edit Ad" : "Create Ad"}</h1>
            <ProgressSteps currentStep={currentStep} steps={steps} />
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <div className="max-w-[800px] mx-auto">
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
            />
          )}
        </div>

        {/* Fixed positioned button at bottom right */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleButtonClick}
            disabled={isSubmitting || (currentStep === 0 && !adFormValid) || (currentStep === 1 && !paymentFormValid)}
            variant={
              (currentStep === 0 && !adFormValid) || (currentStep === 1 && !paymentFormValid) ? "outline" : "default"
            }
            size="sm"
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

      {statusModal.show && (
        <StatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          subMessage={statusModal.subMessage}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

