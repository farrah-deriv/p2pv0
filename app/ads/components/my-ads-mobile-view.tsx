"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Power, Trash2, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteAd, updateAd } from "../api/api-ads"
import type { MyAd } from "../types"
import StatusModal from "@/components/ui/status-modal"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MyAdsMobileViewProps {
  ads: MyAd[]
  onAdDeleted?: (status?: string) => void
}

export default function MyAdsMobileView({ ads, onAdDeleted }: MyAdsMobileViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "",
    message: "",
  })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    show: false,
    adId: "",
  })

  const handleEdit = (ad: MyAd) => {
    localStorage.setItem(
      "editAdData",
      JSON.stringify({
        ...ad,
        description: ad.description || "",
      }),
    )
    router.push(`/ads/create?mode=edit&id=${ad.id}`)
  }

  const handleToggleStatus = async (ad: MyAd) => {
    try {
      setIsTogglingStatus(true)

      // Extract rate value
      let exchangeRate = 0
      if (ad.rate && ad.rate.value) {
        const rateMatch = ad.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
        if (rateMatch && rateMatch[2]) {
          exchangeRate = Number.parseFloat(rateMatch[2])
        }
      }

      // Set the new status (opposite of current)
      const isListed = ad.status !== "Active"

      // Get min/max amounts
      let minAmount = 0
      let maxAmount = 0

      if (typeof ad.limits === "string") {
        const limitsMatch = ad.limits.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)\s+-\s+(\d+(?:\.\d+)?)/)
        if (limitsMatch) {
          minAmount = Number.parseFloat(limitsMatch[2])
          maxAmount = Number.parseFloat(limitsMatch[3])
        }
      } else {
        minAmount = ad.limits.min
        maxAmount = ad.limits.max
      }

      // Update the ad
      const updateResult = await updateAd(ad.id, {
        is_active: isListed,
        minimum_order_amount: minAmount,
        maximum_order_amount: maxAmount,
        available_amount: ad.available.current,
        exchange_rate: exchangeRate,
        exchange_rate_type: "fixed",
        order_expiry_period: 15,
        description: ad.description || "",
        payment_method_names: ad.paymentMethods,
      })

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(updateResult.errors[0].message || "Failed to update ad status")
      }

      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
      setErrorModal({
        show: true,
        title: `Failed to ${ad.status === "Active" ? "Deactivate" : "Activate"} Ad`,
        message: error instanceof Error ? error.message : "An error occurred",
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

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      const result = await deleteAd(deleteConfirmModal.adId)

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || "Failed to delete ad")
      }

      if (onAdDeleted) {
        onAdDeleted("deleted")
      }

      setDeleteConfirmModal({ show: false, adId: "" })
    } catch (error) {
      console.error("Failed to delete ad:", error)
      setErrorModal({
        show: true,
        title: "Failed to Delete Ad",
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmModal({ show: false, adId: "" })
  }

  const handleCloseErrorModal = () => {
    setErrorModal({ show: false, title: "", message: "" })
  }

  // Format rate with percentage
  const formatRate = (rateValue: string): { rate: string; percentage: string } => {
    if (!rateValue) return { rate: "USD 1.00 = IDR 0.00", percentage: "(+0.2%)" }

    const match = rateValue.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
    if (match && match[1] && match[2]) {
      const currency = match[1]
      const value = Number(match[2]).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return {
        rate: `USD 1.00 = ${currency} ${value}`,
        percentage: "(+0.2%)",
      }
    }

    return { rate: rateValue, percentage: "(+0.2%)" }
  }

  // Format limits
  const formatLimits = (limits: MyAd["limits"]): string => {
    if (typeof limits === "string") {
      return limits
    }
    return `USD ${limits.min.toFixed(2)} - ${limits.max.toFixed(2)}`
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">You have no ads</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Looking to buy or sell USD? You can post your own ad for others to respond.
        </p>
        <Button
          onClick={() => router.push("/ads/create")}
          className="bg-[#00D2FF] hover:bg-[#00BFEA] text-black rounded-full px-6 py-2 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-4">
        {ads.map((ad) => {
          const { rate, percentage } = formatRate(ad.rate.value)
          const isActive = ad.status === "Active"

          return (
            <div key={ad.id} className={`border border-gray-200 rounded-lg bg-white ${!isActive ? "opacity-60" : ""}`}>
              {/* Header with status badge and menu */}
              <div className="flex justify-between items-center p-4">
                <div
                  className={`px-4 py-1.5 rounded-full ${isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                >
                  <span className="font-medium">{ad.status}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1">
                      <MoreVertical className="h-6 w-6 text-gray-500" />
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
                      {isTogglingStatus ? "Updating..." : isActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-500 focus:text-red-500"
                      onSelect={() => handleDelete(ad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                {/* Title and ID */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">
                    <span className={ad.type === "Buy" ? "text-green-600" : "text-red-600"}>{ad.type}</span>{" "}
                    <span className="text-black">USD</span>
                  </h3>
                  <span className="text-gray-500 text-sm">
                    {ad.type} {ad.id}
                  </span>
                </div>

                {/* Available Amount */}
                <div className="mb-4">
                  <div className="text-base mb-1">
                    USD {ad.available.current.toFixed(2)} / {ad.available.total.toFixed(2)}
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

                {/* Rate and Limits */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">Rate:</span>
                    <div className="text-right">
                      {rate} <span className="text-green-600">{percentage}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">Limits:</span>
                    <span>{formatLimits(ad.limits)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="flex flex-wrap gap-4">
                  {ad.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center">
                      <span
                        className={`w-3 h-3 rounded-full mr-2 ${
                          method.toLowerCase() === "bank transfer"
                            ? "bg-green-600"
                            : method.toLowerCase() === "skrill"
                              ? "bg-blue-500"
                              : "bg-blue-400"
                        }`}
                      ></span>
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete ad?"
        description="You will not be able to restore it."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
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
