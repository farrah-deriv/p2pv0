"\"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteAd, activateAd, updateAd } from "@/services/api/api-my-ads"

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
  description?: string
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
    return `${limits.currency} ${limits.min} - ${limits.max}`
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

  const handleEdit = (ad: Ad) => {
    // Store the ad data in localStorage for the edit flow
    localStorage.setItem(
      "editAdData",
      JSON.stringify({
        ...ad,
        description: ad.description || "",
      }),
    )
    router.push(`/create-ad?mode=edit&id=${ad.id}`)
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

      // If the ad is inactive, use the direct activate function
      if (ad.status === "Inactive") {
        console.log("Using direct activate function")
        try {
          const result = await activateAd(ad.id)
          console.log("Activate result:", result)
        } catch (activateError) {
          console.error("Activation failed, trying alternative method:", activateError)

          // If direct activation fails, try the toggle method as fallback
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

          // Try direct update with updateAd
          const updateResult = await updateAd(ad.id, {
            is_active: true,
            minimum_order_amount: minAmount,
            maximum_order_amount: maxAmount,
            available_amount: ad.available.current,
            exchange_rate: rateValue,
            exchange_rate_type: "fixed",
            order_expiry_period: 15,
            description: "",
            payment_method_names: ad.paymentMethods,
          })

          console.log("Update result (fallback):", updateResult)
        }
      } else {
        // For deactivating, use the existing toggle function
        const newIsActive = false // We're deactivating
        console.log(`Setting is_active to: ${newIsActive} (Deactivating)`)

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

        // Try direct update instead of toggleAdStatus
        const updateResult = await updateAd(ad.id, {
          is_active: false,
          minimum_order_amount: minAmount,
          maximum_order_amount: maxAmount,
          available_amount: ad.available.current,
          exchange_rate: rateValue,
          exchange_rate_type: "fixed",
          order_expiry_period: 15,
          description: "",
          payment_method_names: ad.paymentMethods,
        })

        console.log("Update result (deactivate):", updateResult)
      }

      // Call the onAdDeleted callback to refresh the list
      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
      alert(`Failed to ${ad.status === "Active" ? "deactivate" : "activate"} ad. Please try again.`)
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

  // Update the table container styles
  return (
    <div className="h-full">
      <table className="w-full border-collapse table-fixed">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b text-sm text-gray-500">
            <th className="text-left py-4 font-medium w-[18%] bg-white">Ad ID</th>
            <th className="text-left py-4 font-medium w-[18%] bg-white">Rate (USD 1)</th>
            <th className="text-left py-4 font-medium w-[16%] bg-white">Limits</th>
            <th className="text-left py-4 font-medium w-[18%] bg-white">Available amount</th>
            <th className="text-left py-4 font-medium w-[18%] bg-white">Payment methods</th>
            <th className="text-left py-4 font-medium w-[100px] bg-white">Status</th>
            <th className="text-left py-4 font-medium w-[15px] bg-white"></th>
          </tr>
        </thead>
        <tbody className="relative">
          {ads.map((ad, index) => (
            <tr key={index} className={`border-b ${ad.status === "Inactive" ? "grayscale" : ""}`}>
              <td className="py-4">
                <div className={`font-medium ${ad.type === "Buy" ? "text-green-600" : "text-red-600"}`}>{ad.type}</div>
                <div className="text-gray-500">{ad.id}</div>
              </td>
              <td className="py-4">
                <div className="font-medium">{ad.rate.value}</div>
                <div className="text-gray-500 text-sm">{ad.rate.percentage}</div>
              </td>
              <td className="py-4">{formatLimits(ad.limits)}</td>
              <td className="py-4">
                <div className="mb-1">
                  USD {ad.available.current || 0} / {ad.available.total || 0}
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
              <td className="py-4 truncate">{ad.paymentMethods.join(", ")}</td>
              <td className="py-4 whitespace-nowrap">{getStatusBadge(ad.status)}</td>
              <td className="py-4 text-right">
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

