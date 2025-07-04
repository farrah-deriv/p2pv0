"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { deleteAd, toggleAdActiveStatus } from "../api/api-ads"
import type { Ad } from "../types"
import { cn, formatPaymentMethodName } from "@/lib/utils"
import StatusModal from "./ui/status-modal"
import { DeleteConfirmationDialog } from "./ui/delete-confirmation-dialog"

interface MobileMyAdsListProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
}

const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return (
      <Badge variant="success-light" className="rounded-[4px] h-[24px] min-h-[24px] max-h-[24px] relative -top-1">
        Active
      </Badge>
    )
  }
  return (
    <Badge variant="error-light" className="rounded-[4px] h-[24px] min-h-[24px] max-h-[24px] relative -top-1">
      Inactive
    </Badge>
  )
}

export default function MobileMyAdsList({ ads, onAdDeleted }: MobileMyAdsListProps) {
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

  const formatLimits = (ad: Ad) => {
    if (ad.minimum_order_amount && ad.actual_maximum_order_amount) {
      return `USD ${ad.minimum_order_amount} - ${ad.actual_maximum_order_amount}`
    }

    if (typeof ad.limits === "string") {
      return ad.limits
    }
    if (ad.limits && typeof ad.limits === "object") {
      return `${ad.limits.currency} ${ad.limits.min} - ${ad.limits.max}`
    }
    return "N/A"
  }

  const getAvailableAmount = (ad: Ad) => {
    if (
      ad.available_amount !== undefined &&
      ad.open_order_amount !== undefined &&
      ad.completed_order_amount !== undefined
    ) {
      const available = Number.parseFloat(ad.available_amount) || 0
      const openOrder = Number.parseFloat(ad.open_order_amount) || 0
      const completed = Number.parseFloat(ad.completed_order_amount) || 0
      const total = available + openOrder + completed

      return {
        current: available,
        total: total,
        percentage: total > 0 ? (available / total) * 100 : 0,
      }
    }

    if (ad.available) {
      const current = Number.parseFloat(ad.available.current) || 0
      const total = Number.parseFloat(ad.available.total) || 0
      return {
        current: current,
        total: total,
        percentage: total > 0 ? (current / total) * 100 : 0,
      }
    }

    return { current: 0, total: 0, percentage: 0 }
  }

  const handleEdit = (ad: Ad) => {
    const editData = {
      ...ad,
      description: ad.description || "",
    }

    localStorage.setItem("editAdData", JSON.stringify(editData))

    const editUrl = `/ads/create?mode=edit&id=${ad.id}`

    window.location.href = editUrl
  }

  const handleCopy = (adId: string) => {}

  const handleShare = (adId: string) => {}

  const handleToggleStatus = async (ad: Ad) => {
    try {
      setIsTogglingStatus(true)

      const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
      const isListed = !isActive

      const updateResult = await toggleAdActiveStatus(ad.id, isListed)

      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
      setErrorModal({
        show: true,
        title: `Failed to ${isActive ? "Deactivate" : "Activate"} Ad`,
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${isActive ? "deactivate" : "activate"} ad. Please try again.`,
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
        const errorMessage = result.errors[0].message || "Failed to delete ad. Please try again."
        throw new Error(errorMessage)
      }

      if (onAdDeleted) {
        onAdDeleted("deleted")
      }

      setDeleteConfirmModal({ show: false, adId: "" })
    } catch (error) {
      setErrorModal({
        show: true,
        title: "Failed to Delete Ad",
        message: error instanceof Error ? error.message : "Failed to delete ad. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeletePaymentMethod = () => {
    setDeleteConfirmModal({ show: false, adId: "" })
  }

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
        <Button onClick={() => router.push("/ads/create")} variant="cyan" size="pill-sm">
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col px-4">
        {ads.map((ad, index) => {
          const availableData = getAvailableAmount(ad)
          const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
          const adType = ad.type || "Buy"
          const rate = ad.exchange_rate || ad.rate?.value || "N/A"
          const paymentMethods = ad.payment_methods || ad.paymentMethods || []

          return (
            <div
              key={index}
              className={cn(
                "w-full h-[224px] border rounded p-4 flex flex-col gap-2",
                !isActive ? "opacity-50" : "",
                index < ads.length - 1 ? "mb-4" : "",
              )}
            >
              <div className="flex justify-between items-center">
                <div>{getStatusBadge(isActive)}</div>
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
                      {isTogglingStatus ? "Updating..." : isActive ? "Deactivate" : "Activate"}
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

              <div className="flex items-center justify-between">
                <div className="text-base font-bold">
                  <span className={adType.toLowerCase() === "buy" ? "text-buy" : "text-sell"}>{adType}</span>
                  <span className="text-black ml-1">USD</span>
                </div>
                <div className="text-neutral-7 text-xs font-normal">
                  {adType} {ad.id}
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-grow justify-between">
                <div className="flex flex-col w-full mb-2">
                  <div className="text-neutral-10 text-xs font-normal leading-5 font-medium">
                    <span className="text-neutral-10 text-xs font-normal leading-5">
                      USD {availableData.current.toFixed(2)}
                    </span>{" "}
                    / {availableData.total.toFixed(2)}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{
                        width: `${Math.min(availableData.percentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs font-bold">Rate:</span>
                  <div className="text-right">
                    <div className="text-neutral-10 text-xs font-normal leading-5">USD 1.00 = {rate}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs font-bold align-middle">Limits:</span>
                  <span className="text-neutral-10 text-xs font-normal leading-5">{formatLimits(ad)}</span>
                </div>

                <div className="flex flex-wrap gap-2 text-black text-xs font-normal leading-5 text-left mb-2">
                  {paymentMethods.map((method, i) => (
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
          )
        })}
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete ad?"
        description="You will not be able to restore it."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDeletePaymentMethod}
      />

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
