"use client"

import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { formatPaymentMethodName, getPaymentMethodColor } from "@/lib/utils"

// Updated interface to match the actual API response
interface ApiAd {
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
  payment_methods: string[]
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
  ads: ApiAd[]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

const formatRate = (ad: ApiAd): string => {
  return `${ad.payment_currency} ${ad.exchange_rate.toFixed(4)}`
}

const formatLimits = (ad: ApiAd): string => {
  return `${ad.account_currency} ${ad.minimum_order_amount} - ${ad.maximum_order_amount}`
}

const formatAvailable = (ad: ApiAd): string => {
  const available = Number.parseFloat(ad.available_amount)
  const max = Number.parseFloat(ad.maximum_order_amount)
  return `${ad.account_currency} ${available.toFixed(2)} / ${max.toFixed(2)}`
}

const getProgressPercentage = (ad: ApiAd): number => {
  const available = Number.parseFloat(ad.available_amount)
  const max = Number.parseFloat(ad.maximum_order_amount)
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, (available / max) * 100))
}

const getStatusBadge = (ad: ApiAd) => {
  return ad.is_active ? <Badge variant="success-light">Active</Badge> : <Badge variant="error-light">Inactive</Badge>
}

const formatPaymentMethodsDisplay = (paymentMethods: string[]): React.ReactNode => {
  console.log("Payment methods received:", paymentMethods)

  if (!paymentMethods || paymentMethods.length === 0) {
    return <span className="text-gray-500 text-sm">No payment methods</span>
  }

  const displayMethods = paymentMethods.slice(0, 3)
  const remainingCount = paymentMethods.length - 3

  return (
    <div className="flex flex-col gap-1">
      {displayMethods.map((method, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getPaymentMethodColor(method) }} />
          <span className="text-sm">{formatPaymentMethodName(method)}</span>
        </div>
      ))}
      {remainingCount > 0 && <span className="text-xs text-gray-500">+{remainingCount} more</span>}
    </div>
  )
}

export default function MyAdsTable({ ads, onEdit, onDelete }: MyAdsTableProps) {
  console.log("MyAdsTable received ads:", ads)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad ID / Type</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Limits</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Payment Methods</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => {
            console.log("Processing ad:", ad.id, "payment_methods:", ad.payment_methods)
            return (
              <TableRow key={ad.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">#{ad.id}</span>
                    <span className={`text-sm capitalize ${ad.type === "buy" ? "text-buy" : "text-sell"}`}>
                      {ad.type.charAt(0).toUpperCase() + ad.type.slice(1)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatRate(ad)}</span>
                    <span className="text-sm text-gray-500">Fixed</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatLimits(ad)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{formatAvailable(ad)}</span>
                    <Progress value={getProgressPercentage(ad)} className="h-1" />
                  </div>
                </TableCell>
                <TableCell>{formatPaymentMethodsDisplay(ad.payment_methods)}</TableCell>
                <TableCell>{getStatusBadge(ad)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(ad.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(ad.id)}>
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
