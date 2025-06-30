"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteAd, activateAd, updateAd, type MyAd } from "@/services/api/api-my-ads"

interface MyAdsTableProps {
  ads: MyAd[]
  onAdDeleted?: (status?: string) => void
}

// Function to convert snake_case to normal case
const formatPaymentMethodName = (method: string): string => {
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Function to get payment method color based on type
const getPaymentMethodColor = (method: string): string => {
  const lowerMethod = method.toLowerCase()
  if (lowerMethod.includes("bank") || lowerMethod === "bank_transfer") {
    return "#008832"
  } else {
    return "#377CFC"
  }
}

export default function MyAdsTable({ ads, onAdDeleted }: MyAdsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  console.log("MyAdsTable received ads:", ads)
  console.log("First ad payment methods:", ads[0]?.paymentMethods)

  // Format limits to display as a string
  const formatLimits = (ad: MyAd) => {
    return `${ad.limits.currency} ${ad.limits.min} - ${ad.limits.max}`
  }

  // Format rate display
  const formatRate = (ad: MyAd) => {
    return {
      value: ad.rate.value,
      percentage: ad.rate.percentage,
    }
  }

  // Format available amount
  const formatAvailable = (ad: MyAd) => {
    return {
      current: ad.available.current,
      total: ad.available.total,
    }
  }

  // Format payment methods with visual indicators
  const formatPaymentMethods = (methods: string[]) => {
    console.log("Processing payment methods:", methods, "Type:", typeof methods, "IsArray:", Array.isArray(methods))

    if (!methods || methods.length === 0) {
      return <span className="text-gray-400 text-sm italic">No payment methods</span>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {methods.slice(0, 3).map((method, index) => (
          <div key={index} className="flex items-center">
            <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: getPaymentMethodColor(method) }} />
            <span className="text-sm">{formatPaymentMethodName(method)}</span>
          </div>
        ))}
        {methods.length > 3 && <span className="text-sm text-gray-500">+{methods.length - 3} more</span>}
      </div>
    )
  }

  const getStatusBadge = (status: "Active" | "Inactive") => {
    if (status === "Active") {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">Inactive</span>
    }
  }

  const handleEdit = (ad: MyAd) => {
    // Store the ad data in localStorage for the edit flow
    localStorage.setItem(
      "editAdData",
      JSON.stringify({
        ...ad,
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

  const handleToggleStatus = async (ad: MyAd) => {
    try {
      setIsTogglingStatus(true)
      const newStatus = ad.status === "Active" ? false : true
      console.log(`Toggling status for ad ${ad.id} from ${ad.status} to ${newStatus ? "Active" : "Inactive"}`)

      // If the ad is inactive, use the direct activate function
      if (ad.status === "Inactive") {
        console.log("Using direct activate function")
        try {
          const result = await activateAd(ad.id.toString())
          console.log("Activate result:", result)
        } catch (activateError) {
          console.error("Activation failed, trying alternative method:", activateError)

          // Try direct update with updateAd
          const updateResult = await updateAd(ad.id.toString(), {
            is_active: true,
            minimum_order_amount: ad.limits.min,
            maximum_order_amount: ad.limits.max,
            available_amount: ad.available.current,
            exchange_rate: Number.parseFloat(ad.rate.value.split(" ")[1]) || 0,
            exchange_rate_type: "fixed",
            order_expiry_period: 15,
            description: "",
            payment_method_names: ad.paymentMethods,
          })

          console.log("Update result (fallback):", updateResult)
        }
      } else {
        // For deactivating, use the existing toggle function
        console.log("Deactivating ad")

        // Try direct update instead of toggleAdStatus
        const updateResult = await updateAd(ad.id.toString(), {
          is_active: false,
          minimum_order_amount: ad.limits.min,
          maximum_order_amount: ad.limits.max,
          available_amount: ad.available.current,
          exchange_rate: Number.parseFloat(ad.rate.value.split(" ")[1]) || 0,
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
      await deleteAd(adId.toString())

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
          {ads.map((ad) => {
            const rate = formatRate(ad)
            const available = formatAvailable(ad)

            console.log(`Ad ${ad.id} payment methods:`, ad.paymentMethods)

            return (
              <tr key={ad.id} className={`border-b ${ad.status === "Inactive" ? "grayscale" : ""}`}>
                <td className="py-4">
                  <div className={`font-medium ${ad.type === "Buy" ? "text-green-600" : "text-red-600"}`}>
                    {ad.type}
                  </div>
                  <div className="text-gray-500">{ad.id}</div>
                </td>
                <td className="py-4">
                  <div className="font-medium">{rate.value}</div>
                  <div className="text-gray-500 text-sm">{rate.percentage}</div>
                </td>
                <td className="py-4">{formatLimits(ad)}</td>
                <td className="py-4">
                  <div className="mb-1">
                    USD {available.current || 0} / {available.total || 0}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{
                        width: `${available.total ? Math.max(0, Math.min(100, ((available.current || 0) / available.total) * 100)) : 0}%`,
                      }}
                    ></div>
                  </div>
                </td>
                <td className="py-4">{formatPaymentMethods(ad.paymentMethods)}</td>
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
