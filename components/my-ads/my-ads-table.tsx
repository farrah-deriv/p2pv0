"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteAd, toggleAdStatus } from "@/services/api/api-my-ads"

interface Ad {
  id: string
  type: "Buy" | "Sell"
  rate: {
    value: string
    percentage: string
  }
  limits:
    | {
        min: number
        max: number
        currency: string
      }
    | string
  available: {
    current: number
    total: number
  }
  paymentMethods: string[]
  status: "Active" | "Inactive"
}

interface MyAdsTableProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
}

export default function MyAdsTable({ ads, onAdDeleted }: MyAdsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Format limits to display as a string
  const formatLimits = (limits: Ad["limits"]) => {
    if (typeof limits === "string") {
      return limits
    }
    return `${limits.currency} ${limits.min.toFixed(2)} - ${limits.max.toFixed(2)}`
  }

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

  const handleEdit = (adId: string) => {
    console.log("Edit ad:", adId)
    // Add edit functionality
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

      // Pass true to activate, false to deactivate
      // If current status is "Active", we want to deactivate (is_active: false)
      // If current status is "Inactive", we want to activate (is_active: true)
      const newIsActive = ad.status !== "Active"

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

      // Convert the ad to the format expected by the API
      const adForApi = {
        id: ad.id,
        type: ad.type,
        rate: {
          value: ad.rate.value,
          percentage: ad.rate.percentage,
          currency: currency,
        },
        limits: {
          min: minAmount,
          max: maxAmount,
          currency: currency,
        },
        available: {
          current: ad.available.current,
          total: ad.available.total,
          currency: "USD",
        },
        paymentMethods: ad.paymentMethods,
        status: ad.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Call the toggleAdStatus function with the full ad data
      const result = await toggleAdStatus(ad.id, newIsActive, adForApi)
      console.log("Toggle status result:", result)

      // Call the onAdDeleted callback to refresh the list
      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async (adId: string) => {
    try {
      setIsDeleting(true)
      await deleteAd(adId)

      // Call the onAdDeleted callback to refresh the list and show success message
      if (onAdDeleted) {
        onAdDeleted("deleted")
      }
    } catch (error) {
      console.error("Failed to delete ad:", error)
    } finally {
      setIsDeleting(false)
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
          onClick={() => router.push("/create-ad")}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-8"
        >
          Create ad
        </Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse table-auto">
        <thead className="bg-gray-50">
          <tr className="text-xs sm:text-sm text-gray-500">
            <th className="text-left py-3 px-4 font-medium">Ad ID</th>
            <th className="text-left py-3 px-4 font-medium">Rate (USD 1)</th>
            <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Limits</th>
            <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Available amount</th>
            <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Payment methods</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ads.map((ad, index) => (
            <tr key={index} className={`hover:bg-gray-50 ${ad.status === "Inactive" ? "opacity-50" : ""}`}>
              <td className="py-4 px-4">
                <div className={`font-medium ${ad.type === "Buy" ? "text-green-600" : "text-red-600"}`}>{ad.type}</div>
                <div className="text-gray-500 text-xs">{ad.id}</div>
              </td>
              <td className="py-4 px-4">
                <div className="font-medium">{ad.rate.value}</div>
                <div className="text-gray-500 text-xs">{ad.rate.percentage}</div>
              </td>
              <td className="py-4 px-4 hidden sm:table-cell">{formatLimits(ad.limits)}</td>
              <td className="py-4 px-4 hidden md:table-cell">
                <div className="mb-1 text-sm">
                  USD {(ad.available.current || 0).toFixed(2)} / {(ad.available.total || 0).toFixed(2)}
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-32 overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{
                      width: `${ad.available.total ? ((ad.available.current || 0) / ad.available.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </td>
              <td className="py-4 px-4 hidden lg:table-cell">
                <div className="truncate max-w-xs">{ad.paymentMethods.join(", ")}</div>
              </td>
              <td className="py-4 px-4">{getStatusBadge(ad.status)}</td>
              <td className="py-4 px-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleEdit(ad.id)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleCopy(ad.id)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onSelect={() => handleShare(ad.id)}>
                      <Share2 className="h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onSelect={() => handleToggleStatus(ad)}
                      disabled={isTogglingStatus}
                    >
                      <Power className="h-4 w-4" />
                      {isTogglingStatus ? "Updating..." : ad.status === "Active" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-500 focus:text-red-500"
                      onSelect={() => handleDelete(ad.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

