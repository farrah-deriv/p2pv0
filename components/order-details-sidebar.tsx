"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Order } from "@/services/api/api-orders"

interface OrderDetailsSidebarProps {
  isOpen: boolean
  onClose: () => void
  order: Order
}

export default function OrderDetailsSidebar({ isOpen, onClose, order }: OrderDetailsSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Order details</h2>
          <Button onClick={onClose} variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-slate-500 mb-1">Order ID</h3>
              <p className="font-medium">{order.id}</p>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-1">Exchange rate</h3>
              <p className="font-medium">
                {order.advert?.account_currency} 1.00 = {order.advert?.payment_currency}{" "}
                {order.exchange_rate?.toFixed(2) || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-1">{order.type === "buy" ? "You buy" : "You sell"}</h3>
              <p className="font-medium">
                {order.advert?.account_currency}{" "}
                {typeof order.price === "object" && order.price.value
                  ? Number(order.price.value).toFixed(2)
                  : typeof order.price === "number"
                    ? order.price.toFixed(2)
                    : Number(order.price).toFixed(2)}
              </p>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-1">{order.type === "buy" ? "You pay" : "You receive"}</h3>
              <p className="font-medium">
                {order.advert?.payment_currency}{" "}
                {typeof order.amount === "object" && order.amount.value
                  ? Number(order.amount.value).toFixed(2)
                  : typeof order.amount === "number"
                    ? order.amount.toFixed(2)
                    : Number(order.amount).toFixed(2)}
              </p>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-1">Seller</h3>
              <p className="font-medium">{order.advert?.user?.nickname}</p>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-1">Status</h3>
              <p className="font-medium">{order.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
