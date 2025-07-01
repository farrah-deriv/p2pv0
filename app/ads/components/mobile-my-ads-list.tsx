"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { deleteAd, updateAd } from "../api/api-ads"
import type { Ad } from "../types"
import { cn, formatPaymentMethodName } from "@/lib/utils"
import StatusModal from "./ui/status-modal"
import { DeleteConfirmationDialog } from "./ui/delete-confirmation-dialog"

interface MobileMyAdsListProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
}

// Updated to use Badge with appropriate variants
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return (
        <Badge variant="success-light" className="rounded-[4px] h-[24px] min-h-[24px] max-h-[24px] relative -top-1">
          Active
        </Badge>
      )
    case "Inactive":
      return (
        <Badge variant="error-light" className="rounded-[4px] h-[24px] min-h-[24px] max-h-[24px] relative -top-1">
          Inactive
        </Badge>
      )
    default:
      return (
        <Badge variant="error-light" className="rounded-[4px] h-[24px] min-h-[24px] max-h-[24px] relative -top-1">
          Inactive
        </Badge>
      )
  }
}

export default function MobileMyAdsList({ ads, onAdDeleted }: MobileMyAdsListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Add state for error modals
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "",
    message: "",
  })

  // Add state for delete confirmation modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    show: false,
    adId: "",
  })

  const handleEdit = (ad: Ad) => {
    // Store the ad data in localStorage for the edit flow
    localStorage.setItem(
      "editAdData",
      JSON.stringify({
        ...ad,
        description: ad.description || "",
      }),
    )
    router.push(`/ads/create?mode=edit&id=${ad.id}`)
  }

  const handleCopy = (adId: string) => {
    console.log("Copy ad:", adId)
    // Add copy functionality
  }

  const handleShare = (adId: string) => {
    console.log("Share ad:", adId)
    // Add share functionality
  }

  const handleToggleStatus = async (ad: Ad) => {
    try {
      setIsTogglingStatus(true)
      console.log(
        `Toggling status for ad ${ad.id} from ${ad.status} to ${ad.status === "Active" ? "Inactive" : "Active"}`,
      )

      // Parse the limits if it's a string
      let minAmount = 0
      let maxAmount = 0

      if (typeof ad.limits === "string") {
        const limitsMatch = ad.limits.match(/([A-Z]+) (\d+\.\d+) - (\d+\.\d+)/)
        minAmount = limitsMatch ? Number.parseFloat(limitsMatch[2]) : 0
        maxAmount = limitsMatch ? Number.parseFloat(limitsMatch[3]) : 0
      } else {
        minAmount = ad.limits.min
        maxAmount = ad.limits.max
      }

      // Extract rate value from string (e.g., "IDR 14500.0000" -> 14500.0000)
      let rateValue = 0
      if (ad.rate && ad.rate.value) {
        const rateMatch = ad.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
        if (rateMatch && rateMatch[2]) {
          rateValue = Number.parseFloat(rateMatch[2])
        }
      }

      // Set the new isListed value (opposite of current status)
      const isListed = ad.status !== "Active"

      // Update the ad with all current values but change isListed
      const updateResult = await updateAd(ad.id, {
        is_active: isListed,
        minimum_order_amount: minAmount,
        maximum_order_amount: maxAmount,
        available_amount: ad.available.current,
        exchange_rate: rateValue,
        exchange_rate_type: "fixed",
        order_expiry_period: 15,
        description: ad.description || "",
        payment_method_names: ad.type === "Buy" ? ad.paymentMethods : [],
      })

      // Check for errors in the response
      if (updateResult.errors && updateResult.errors.length > 0) {
        const errorMessage =
          updateResult.errors[0].message ||
          `Failed to ${ad.status === "Active" ? "deactivate" : "activate"} ad. Please try again.`
        throw new Error(errorMessage)
      }

      console.log(`Ad ${isListed ? "activated" : "deactivated"} successfully:`, updateResult)

      // Call the onAdDeleted callback to refresh the list
      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)

      // Show error modal instead of alert
      setErrorModal({
        show: true,
        title: `Failed to ${ad.status === "Active" ? "Deactivate" : "Activate"} Ad`,
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${ad.status === "Active" ? "deactivate" : "activate"} ad. Please try again.`,
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = (adId: string) => {
    setDeleteConfirmModal({
      show: true,
      adId: adId,
    })
  }

  // Add a new function to handle the actual deletion after confirmation
  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      const result = await deleteAd(deleteConfirmModal.adId)

      // Check for errors in the response
      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors[0].message || "Failed to delete ad. Please try again."
        throw new Error(errorMessage)
      }

      // Call the onAdDeleted callback to refresh the list and show success message
      if (onAdDeleted) {
        onAdDeleted("deleted")
      }

      // Close the confirmation modal
      setDeleteConfirmModal({ show: false, adId: "" })
    } catch (error) {
      console.error("Failed to delete ad:", error)

      // Show error modal
      setErrorModal({
        show: true,
        title: "Failed to Delete Ad",
        message: error instanceof Error ? error.message : "Failed to delete ad. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Add a function to cancel deletion
  const cancelDeletePaymentMethod = () => {
    setDeleteConfirmModal({ show: false, adId: "" })
  }

  // Function to close error modal
  const handleCloseErrorModal = () => {
    setErrorModal({
      show: false,
      title: "",
      message: "",
    })
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">You have no ads</h2>
        <p className="text-gray-600 mb-6 text-center">
          Looking to buy or sell USD? You can post your own ad for others to respond.
        </p>
        {/* Updated to use Button with cyan variant and pill size */}
        <Button onClick={() => router.push("/ads/create")} variant="cyan" size="pill-sm">
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col px-4">
        {ads.map((ad, index) => (
          <div
            key={index}
            className={cn(
              "w-full h-[216px] border rounded p-4 flex flex-col gap-2",
              ad.status === "Inactive" ? "opacity-50" : "",
              index < ads.length - 1 ? "mb-4" : "",
            )}
          >
            {/* Header Row - Badge and options */}
            <div className="flex justify-between items-center">
              <div>{getStatusBadge(ad.status)}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded-full -mr-2">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleEdit(ad)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={() => handleToggleStatus(ad)}
                    disabled={isTogglingStatus}
                  >
                    <Power className="h-4 w-4" />
                    {isTogglingStatus ? "Updating..." : ad.status === "Active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleCopy(ad.id)}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleShare(ad.id)}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleDelete(ad.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Buy/Sell with ID row */}
            <div className="flex items-center justify-between">
              <div className="text-base font-bold">
                {/* Updated to use StatusIndicator */}
                <StatusIndicator variant={ad.type === "Buy" ? "buy" : "sell"}>
                  {ad.type}
                  <span className="text-black ml-1">USD</span>
                </StatusIndicator>
              </div>
              <div className="text-neutral-7 text-xs font-normal">
                {ad.type} {ad.id}
              </div>
            </div>

            {/* Content Rows */}
            <div className="flex flex-col gap-2 flex-grow justify-between">
              {/* Available Row */}
              <div className="flex flex-col w-full mb-2">
                <div className="text-neutral-10 text-xs font-normal leading-5 font-medium">
                  <span className="text-neutral-10 text-xs font-normal leading-5">USD {ad.available.current || 0}</span>{" "}
                  / {ad.available.total || 0}
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{
                      width: `${ad.available.total ? ((ad.available.current || 0) / ad.available.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Rate Row */}
              <div className="flex justify-between">
                <span className="label-rate">Rate:</span>
                <div className="text-right">
                  <div className="text-neutral-10 text-xs font-normal leading-5">USD 1.00 = {ad.rate.value}</div>
                </div>
              </div>

              {/* Limits Row */}
              <div className="flex justify-between">
                <span className="label-rate align-middle">Limits:</span>
                <span className="text-neutral-10 text-xs font-normal leading-5">
                  {typeof ad.limits === "string"
                    ? ad.limits
                    : `${ad.limits.currency} ${ad.limits.min} - ${ad.limits.max}`}
                </span>
              </div>

              {/* Payment Methods Row - Updated to use StatusIndicator with dot */}
              <div className="flex flex-wrap gap-2 text-black text-xs font-normal leading-5 text-left mb-2">
                {ad.paymentMethods.map((method, i) => (
                  <StatusIndicator
                    key={i}
                    variant={method.toLowerCase().includes("bank") ? "success" : "blue"}
                    withDot
                    size="sm"
                    className="mr-2 mb-1"
                  >
                    {formatPaymentMethodName(method)}
                  </StatusIndicator>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete ad?"
        description="You will not be able to restore it."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDeletePaymentMethod}
      />

      {/* Error Modal */}
      {errorModal.show && (
        <StatusModal
          type="error"
          title={errorModal.title}
          message={errorModal.message}
          onClose={handleCloseErrorModal}
        />
      )}
    </>
  )
}
