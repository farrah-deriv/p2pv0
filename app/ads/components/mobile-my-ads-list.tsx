"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteAd, updateAd } from "../api/api-ads"
import type { Ad } from "../types"
import StatusModal from "@/components/ui/status-modal"
// Add Badge import at the top with other imports
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"

interface MobileMyAdsListProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
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

  // Replace the getStatusBadge function with this implementation
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>
      case "Inactive":
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="destructive">Inactive</Badge>
    }
  }

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
      let currency = "USD"

      if (typeof ad.limits === "string") {
        const limitsMatch = ad.limits.match(/([A-Z]+) (\d+\.\d+) - (\d+\.\d+)/)
        currency = limitsMatch ? limitsMatch[1] : "USD"
        minAmount = limitsMatch ? Number.parseFloat(limitsMatch[2]) : 0
        maxAmount = limitsMatch ? Number.parseFloat(limitsMatch[3]) : 0
      } else {
        minAmount = ad.limits.min
        maxAmount = ad.limits.max
        currency = ad.limits.currency
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
    // Show confirmation modal instead of immediately deleting
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
  const cancelDelete = () => {
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
        <Button onClick={() => router.push("/ads/create")} size="sm">
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        {ads.map((ad, index) => (
          <div key={index} className={`border rounded-lg p-4 ${ad.status === "Inactive" ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${ad.type === "Buy" ? "text-primary" : "text-secondary"}`}>
                    {ad.type}
                  </span>
                  <span className="text-gray-800 font-medium">{ad.id}</span>
                </div>
                <div className="mt-1">{getStatusBadge(ad.status)}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded-full">
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
                  <DropdownMenuItem disabled>
                    <Copy className="h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Share2 className="h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleDelete(ad.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Rate (USD 1)</span>
                <div className="text-right">
                  <div className="font-medium">{ad.rate.value}</div>
                  <div className="text-gray-500 text-sm">{ad.rate.percentage}</div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Limits</span>
                <span className="font-medium">
                  {typeof ad.limits === "string"
                    ? ad.limits
                    : `${ad.limits.currency} ${ad.limits.min.toFixed(2)} - ${ad.limits.max.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Available</span>
                <div className="text-right">
                  <div className="font-medium">
                    USD {(ad.available.current || 0).toFixed(2)} / {(ad.available.total || 0).toFixed(2)}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-32 overflow-hidden mt-1">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{
                        width: `${ad.available.total ? ((ad.available.current || 0) / ad.available.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Payment methods</span>
                <span className="font-medium text-right">{ad.paymentMethods.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <DeleteConfirmationDialog
          isOpen={deleteConfirmModal.show}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isLoading={isDeleting}
        />
      )}

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

