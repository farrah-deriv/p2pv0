"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteAd, updateAd } from "../api/api-ads"
import type { Ad } from "../types"
import { cn } from "@/lib/utils"
import { DeleteConfirmationDialog } from "./ui/delete-confirmation-dialog"
import StatusModal from "./ui/status-modal"

interface MyAdsTableProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
}

export default function MyAdsTable({ ads, onAdDeleted }: MyAdsTableProps) {
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

  const formatLimits = (limits: Ad["limits"]) => {
    if (typeof limits === "string") {
      return limits
    }
    return `${limits.currency} ${limits.min.toFixed(2)} - ${limits.max.toFixed(2)}`
  }

  const formatPaymentMethods = (methods: string[]) => {
    if (!methods || methods.length === 0) return "None"
    return methods.join(", ")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="success-light">Active</Badge>
      case "Inactive":
        return <Badge variant="error-light">Inactive</Badge>
      default:
        return <Badge variant="error-light">Inactive</Badge>
    }
  }

  const handleEdit = (ad: Ad) => {
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
  }

  const handleShare = (adId: string) => {
    console.log("Share ad:", adId)
  }

  const handleToggleStatus = async (ad: Ad) => {
    try {
      setIsTogglingStatus(true)

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

      let rateValue = 0
      if (ad.rate && ad.rate.value) {
        const rateMatch = ad.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
        if (rateMatch && rateMatch[2]) {
          rateValue = Number.parseFloat(rateMatch[2])
        }
      }

      const isListed = ad.status !== "Active"

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

      if (updateResult.errors && updateResult.errors.length > 0) {
        const errorMessage =
          updateResult.errors[0].message ||
          `Failed to ${ad.status === "Active" ? "deactivate" : "activate"} ad. Please try again.`
        throw new Error(errorMessage)
      }

      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)

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
      console.error("Failed to delete ad:", error)

      setErrorModal({
        show: true,
        title: "Failed to Delete Ad",
        message: error instanceof Error ? error.message : "Failed to delete ad. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
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
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Looking to buy or sell USD? You can post your own ad for others to respond.
        </p>
        <Button onClick={() => router.push("/ads/create")} variant="cyan" size="pill">
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Ad ID
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Rate (USD 1)
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Limits
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Available amount
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Payment methods
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal">
                Status
              </TableHead>
              <TableHead className="text-left py-4 text-slate-600 font-normal text-sm leading-5 tracking-normal"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad, index) => (
              <TableRow key={index} className={cn("border-b", ad.status === "Inactive" ? "opacity-60" : "")}>
                <TableCell className="py-4">
                  <div>
                    <span className={cn("font-medium", ad.type === "Buy" ? "text-buy" : "text-sell")}>{ad.type}</span>
                    <span className="text-gray-900"> {ad.id}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-medium">{ad.rate.value}</div>
                </TableCell>
                <TableCell className="py-4">{formatLimits(ad.limits)}</TableCell>
                <TableCell className="py-4">
                  <div className="mb-1">
                    {ad.available.currency} {(ad.available.current || 0).toFixed(2)} /{" "}
                    {(ad.available.total || 0).toFixed(2)}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full max-w-[180px] overflow-hidden">
                    <div
                      className={`h-full bg-black rounded-full w-[${ad.available.total > 0 ? Math.min(((ad.available.current || 0) / ad.available.total) * 100, 100) : 0}%]`}
                    ></div>
                  </div>
                </TableCell>
                <TableCell className="py-4">{formatPaymentMethods(ad.paymentMethods)}</TableCell>
                <TableCell className="py-4">{getStatusBadge(ad.status)}</TableCell>
                <TableCell className="py-4 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete ad?"
        description="You will not be able to restore it."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
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
