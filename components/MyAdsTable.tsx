"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Copy, Share2, Power, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteAd, activateAd, updateAd } from "@/services/api/api-my-ads"

// Updated interface to match the EXACT API response structure
interface Ad {
  id: number
  created_at: number
  type: "buy" | "sell"
  minimum_order_amount: string
  maximum_order_amount: string
  actual_maximum_order_amount: string
  is_orderable: boolean
  available_amount: string
  account_currency: string
  payment_currency: string
  exchange_rate: number
  exchange_rate_type: string
  description: string
  is_active: boolean
  open_order_amount: string
  open_order_count: number
  completed_order_amount: string
  completed_order_count: number
  order_expiry_period: number
  available_countries: null | string[]
  favourites_only: boolean
  payment_methods: string[] // This is the correct field name from your API
  user: {
    id: number
    nickname: string
    created_at: number
    rating_average_lifetime: number
    order_count_lifetime: number
    adverts_are_listed: boolean
  }
  is_eligible: boolean
  minimum_trade_band: string
}

interface MyAdsTableProps {
  ads: Ad[]
  onAdDeleted?: (status?: string) => void
}

// Function to convert snake_case to Title Case
const formatPaymentMethodName = (method: string): string => {
  const methodMap: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    alipay: "Alipay",
    wechat_pay: "WeChat Pay",
    paypal: "PayPal",
    skrill: "Skrill",
    neteller: "Neteller",
    perfect_money: "Perfect Money",
    webmoney: "WebMoney",
    yandex_money: "Yandex Money",
    qiwi: "QIWI",
    sticpay: "SticPay",
    airtm: "AirTM",
    paysera: "Paysera",
    advcash: "AdvCash",
    transferwise: "Wise",
    revolut: "Revolut",
    other: "Other",
    airtel: "Airtel",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    paytm: "Paytm",
    upi: "UPI",
    phonepe: "PhonePe",
    gpay: "GPay",
    bhim: "BHIM",
    imps: "IMPS",
    neft: "NEFT",
    rtgs: "RTGS",
  }

  return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, " ")
}

// Function to get payment method color based on type
const getPaymentMethodColor = (method: string): string => {
  const bankTransferMethods = ["bank_transfer", "imps", "neft", "rtgs"]
  return bankTransferMethods.includes(method.toLowerCase()) ? "#008832" : "#377CFC"
}

export default function MyAdsTable({ ads, onAdDeleted }: MyAdsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  console.log("MyAdsTable received ads:", ads)

  // Format limits to display as a string
  const formatLimits = (ad: Ad) => {
    return `${ad.account_currency} ${ad.minimum_order_amount} - ${ad.maximum_order_amount}`
  }

  // Format rate display
  const formatRate = (ad: Ad) => {
    return {
      value: `${ad.payment_currency} ${ad.exchange_rate.toFixed(2)}`,
      percentage: "0.1%", // This might need to be calculated based on market rate
    }
  }

  // Format available amount
  const formatAvailable = (ad: Ad) => {
    const current = Number.parseFloat(ad.available_amount)
    const total = Number.parseFloat(ad.maximum_order_amount)
    return {
      current,
      total,
    }
  }

  // Format payment methods with visual indicators
  const formatPaymentMethods = (methods: string[]) => {
    console.log("Processing payment methods:", methods)

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

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
    } else {
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

  const handleCopy = (adId: number) => {
    console.log("Copy ad:", adId)
    // Add copy functionality
  }

  const handleShare = (adId: number) => {
    console.log("Share ad:", adId)
    // Add share functionality
  }

  const handleToggleStatus = async (ad: Ad) => {
    try {
      setIsTogglingStatus(true)
      console.log(
        `Toggling status for ad ${ad.id} from ${ad.is_active ? "Active" : "Inactive"} to ${ad.is_active ? "Inactive" : "Active"}`,
      )

      // If the ad is inactive, use the direct activate function
      if (!ad.is_active) {
        console.log("Using direct activate function")
        try {
          const result = await activateAd(ad.id.toString())
          console.log("Activate result:", result)
        } catch (activateError) {
          console.error("Activation failed, trying alternative method:", activateError)

          // Try direct update with updateAd
          const updateResult = await updateAd(ad.id.toString(), {
            is_active: true,
            minimum_order_amount: Number.parseFloat(ad.minimum_order_amount),
            maximum_order_amount: Number.parseFloat(ad.maximum_order_amount),
            available_amount: Number.parseFloat(ad.available_amount),
            exchange_rate: ad.exchange_rate,
            exchange_rate_type: ad.exchange_rate_type,
            order_expiry_period: ad.order_expiry_period,
            description: ad.description,
            payment_method_names: ad.payment_methods,
          })

          console.log("Update result (fallback):", updateResult)
        }
      } else {
        // For deactivating, use the existing toggle function
        console.log("Deactivating ad")

        // Try direct update instead of toggleAdStatus
        const updateResult = await updateAd(ad.id.toString(), {
          is_active: false,
          minimum_order_amount: Number.parseFloat(ad.minimum_order_amount),
          maximum_order_amount: Number.parseFloat(ad.maximum_order_amount),
          available_amount: Number.parseFloat(ad.available_amount),
          exchange_rate: ad.exchange_rate,
          exchange_rate_type: ad.exchange_rate_type,
          order_expiry_period: ad.order_expiry_period,
          description: ad.description,
          payment_method_names: ad.payment_methods,
        })

        console.log("Update result (deactivate):", updateResult)
      }

      // Call the onAdDeleted callback to refresh the list
      if (onAdDeleted) {
        onAdDeleted()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
      alert(`Failed to ${ad.is_active ? "deactivate" : "activate"} ad. Please try again.`)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async (adId: number) => {
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left py-4 font-medium w-[18%] bg-white">Ad ID</TableHead>
            <TableHead className="text-left py-4 font-medium w-[18%] bg-white">Rate (USD 1)</TableHead>
            <TableHead className="text-left py-4 font-medium w-[16%] bg-white">Limits</TableHead>
            <TableHead className="text-left py-4 font-medium w-[18%] bg-white">Available amount</TableHead>
            <TableHead className="text-left py-4 font-medium w-[18%] bg-white">Payment methods</TableHead>
            <TableHead className="text-left py-4 font-medium w-[100px] bg-white">Status</TableHead>
            <TableHead className="text-left py-4 font-medium w-[15px] bg-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => {
            const rate = formatRate(ad)
            const available = formatAvailable(ad)

            console.log(`Ad ${ad.id} payment_methods:`, ad.payment_methods)

            return (
              <TableRow key={ad.id} className={`border-b ${!ad.is_active ? "grayscale" : ""}`}>
                <TableCell className="py-4">
                  <div className={`font-medium ${ad.type === "buy" ? "text-green-600" : "text-red-600"}`}>
                    {ad.type.charAt(0).toUpperCase() + ad.type.slice(1)}
                  </div>
                  <div className="text-gray-500">{ad.id}</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-medium">{rate.value}</div>
                  <div className="text-gray-500 text-sm">{rate.percentage}</div>
                </TableCell>
                <TableCell className="py-4">{formatLimits(ad)}</TableCell>
                <TableCell className="py-4">
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
                </TableCell>
                <TableCell className="py-4">{formatPaymentMethods(ad.payment_methods)}</TableCell>
                <TableCell className="py-4 whitespace-nowrap">{getStatusBadge(ad.is_active)}</TableCell>
                <TableCell className="py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleEdit(ad)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleCopy(ad.id)}>
                        <Copy className="h-4 w-4" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleShare(ad.id)}>
                        <Share2 className="h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleToggleStatus(ad)}
                        disabled={isTogglingStatus}
                      >
                        <Power className="h-4 w-4" />
                        {isTogglingStatus ? "Updating..." : ad.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        onClick={() => handleDelete(ad.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
