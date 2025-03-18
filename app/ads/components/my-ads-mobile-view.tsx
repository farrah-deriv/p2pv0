"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Power, Trash2, Search, ChevronRight, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteAd, updateAd } from "../api/api-ads"
import type { MyAd } from "../types"
import StatusModal from "@/components/ui/status-modal"

interface MyAdsMobileViewProps {
  ads: MyAd[]
  onAdDeleted?: (status?: string) => void
}

export default function MyAdsMobileView({ ads, onAdDeleted }: MyAdsMobileViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [selectedAd, setSelectedAd] = useState<string | null>(null)

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
      case "Inactive":
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">Inactive</span>
      default:
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">Inactive</span>
    }
  }

  const handleEdit = (ad: MyAd) => {
    // Store the ad data in localStorage for the edit flow
    localStorage.setItem(
      "editAdData",
      JSON.stringify({
        ...ad,
        description: "",
      }),
    )
    router.push(`/ads/create?mode=edit&id=${ad.id}`)
  }

  const handleToggleStatus = async (ad: MyAd) => {
    try {
      setIsTogglingStatus(true)
      console.log(
        `Toggling status for ad ${ad.id} from ${ad.status} to ${ad.status === "Active" ? "Inactive" : "Active"}`,
      )

      // Extract rate value from string (e.g., "IDR 14500.0000" -> 14500.0000)
      let exchangeRate = 0
      if (ad.rate && ad.rate.value) {
        const rateMatch = ad.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
        if (rateMatch && rateMatch[2]) {
          exchangeRate = Number.parseFloat(rateMatch[2])
        }
      }

      // Set the new isListed value (opposite of current status)
      const isListed = ad.status !== "Active"

      // Update the ad with all current values but change isListed
      const updateResult = await updateAd(ad.id, {
        is_active: isListed,
        minimum_order_amount: ad.limits.min,
        maximum_order_amount: ad.limits.max,
        available_amount: ad.available.current,
        exchange_rate: exchangeRate,
        exchange_rate_type: "fixed",
        order_expiry_period: 15,
        description: "",
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

  // Toggle ad details
  const toggleAdDetails = (adId: string) => {
    if (selectedAd === adId) {
      setSelectedAd(null)
    } else {
      setSelectedAd(adId)
    }
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
        <Button
          onClick={() => router.push("/ads/create")}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-8"
        >
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={`border rounded-lg overflow-hidden ${ad.status === "Inactive" ? "opacity-70" : ""}`}
          >
            {/* Card header */}
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleAdDetails(ad.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${ad.type === "Buy" ? "text-green-600" : "text-red-600"}`}>
                    {ad.type}
                  </span>
                  <span className="text-gray-900 font-medium">{ad.id}</span>
                  <div className="ml-2">{getStatusBadge(ad.status)}</div>
                </div>
                <div className="mt-1 text-sm text-gray-500">{ad.rate.value}</div>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${selectedAd === ad.id ? "rotate-90" : ""}`}
              />
            </div>

            {/* Expanded details */}
            {selectedAd === ad.id && (
              <div className="px-4 pb-4 border-t pt-3">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Limits</div>
                    <div className="font-medium">
                      {ad.limits.currency} {ad.limits.min.toFixed(2)} - {ad.limits.max.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Available amount</div>
                    <div className="font-medium mb-1">
                      {ad.available.currency} {ad.available.current.toFixed(2)} / {ad.available.total.toFixed(2)}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{
                          width: `${ad.available.total ? (ad.available.current / ad.available.total) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Payment methods</div>
                    <div className="font-medium">{ad.paymentMethods.join(", ")}</div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(ad)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggleStatus(ad)}
                      disabled={isTogglingStatus}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm"
                    >
                      <Power className="h-4 w-4" />
                      {isTogglingStatus ? "Updating..." : ad.status === "Active" ? "Deactivate" : "Activate"}
                    </button>

                    {/* Disabled buttons for Copy and Share */}
                    <button
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>

                    <button
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>

                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-md text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-center">Delete ad?</h2>
            <p className="text-gray-600 mb-6 text-center">You will not be able to restore it.</p>

            <div className="space-y-3">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

              <button
                onClick={cancelDelete}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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

