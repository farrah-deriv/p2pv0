"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Updated interface to match the actual API response structure
interface Ad {
  id: string
  account_currency: string
  advertiser_details: {
    completed_orders_count: number
    id: string
    is_online: boolean
    last_online_time: number
    name: string
    rating_average: number
    rating_count: number
    recommended_average: number
    recommended_count: number
    total_completion_rate: number
  }
  amount: number
  amount_display: string
  available_amount: number
  available_amount_display: string
  block_trade: boolean
  contact_info: string
  counterparty_type: string
  country: string
  created_time: number
  description: string
  effective_rate: number
  effective_rate_display: string
  eligible_countries: string[]
  exchange_rate: number
  exchange_rate_display: string
  is_active: boolean
  is_buy: boolean
  is_visible: boolean
  local_currency: string
  max_order_amount: number
  max_order_amount_display: string
  max_order_amount_limit: number
  max_order_amount_limit_display: string
  maximum_order_amount: number
  min_completion_rate: number
  min_join_days: number
  min_order_amount: number
  min_order_amount_display: string
  min_rating: number
  minimum_order_amount: number
  order_expiry_period: number
  payment_currency: string
  payment_info: string
  payment_method: string
  payment_method_details: Record<string, any>
  payment_method_names: string[]
  payment_methods: string[]
  price: number
  price_display: string
  rate: number
  rate_display: string
  rate_type: string
  remaining_amount: number
  remaining_amount_display: string
  type: string
  visibility_status: string[]
}

interface MyAdsTableProps {
  ads: Ad[]
  onEdit?: (ad: Ad) => void
  onDelete?: (ad: Ad) => void
  onToggleStatus?: (ad: Ad) => void
}

// Utility function to format payment method names
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

// Utility function to get payment method color
const getPaymentMethodColor = (method: string): string => {
  const bankTransferMethods = ["bank_transfer", "imps", "neft", "rtgs"]
  return bankTransferMethods.includes(method.toLowerCase()) ? "#008832" : "#377CFC"
}

// Utility function to format rate
const formatRate = (ad: Ad): string => {
  if (ad.rate_display) return ad.rate_display
  if (ad.exchange_rate_display) return ad.exchange_rate_display
  if (ad.price_display) return ad.price_display
  return `${ad.rate || ad.exchange_rate || ad.price || 0} ${ad.payment_currency || ad.local_currency}`
}

// Utility function to format limits
const formatLimits = (ad: Ad): string => {
  const currency = ad.account_currency || ad.local_currency || "USD"
  const min = ad.minimum_order_amount || ad.min_order_amount || 0
  const max = ad.maximum_order_amount || ad.max_order_amount || 0
  return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`
}

// Utility function to format available amount
const formatAvailable = (ad: Ad): string => {
  if (ad.available_amount_display) return ad.available_amount_display
  const amount = ad.available_amount || ad.remaining_amount || 0
  const currency = ad.account_currency || ad.local_currency || "USD"
  return `${amount.toLocaleString()} ${currency}`
}

export default function MyAdsTable({ ads, onEdit, onDelete, onToggleStatus }: MyAdsTableProps) {
  console.log("MyAdsTable received ads:", ads)

  if (!ads || ads.length === 0) {
    return <div className="text-center py-8 text-gray-500">No ads found</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Limits</TableHead>
            <TableHead>Payment Methods</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => {
            console.log("Processing ad:", ad.id, "Payment methods:", ad.payment_methods)

            return (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">#{ad.id.slice(-6)}</TableCell>
                <TableCell>
                  <Badge variant={ad.is_buy ? "success-light" : "error-light"}>{ad.is_buy ? "Buy" : "Sell"}</Badge>
                </TableCell>
                <TableCell>{formatRate(ad)}</TableCell>
                <TableCell>{formatAvailable(ad)}</TableCell>
                <TableCell>{formatLimits(ad)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ad.payment_methods && ad.payment_methods.length > 0 ? (
                      ad.payment_methods.map((method, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getPaymentMethodColor(method) }}
                          />
                          <span className="text-xs text-gray-600">{formatPaymentMethodName(method)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No payment methods</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ad.is_active ? "active" : "inactive"}>{ad.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(ad)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus?.(ad)}>
                        {ad.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(ad)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
