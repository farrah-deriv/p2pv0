"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TradeLimitsProps {
  buyLimit: {
    current: number
    max: number
  }
  sellLimit: {
    current: number
    max: number
  }
}

export default function TradeLimits({ buyLimit, sellLimit }: TradeLimitsProps) {
  const buyPercentage = buyLimit.max > 0 ? (buyLimit.current / buyLimit.max) * 100 : 0
  const sellPercentage = sellLimit.max > 0 ? (sellLimit.current / sellLimit.max) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Daily trade limit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Buy</span>
            <span className="text-sm font-medium">
              {buyLimit.current.toLocaleString()} / {buyLimit.max.toLocaleString()} USD
            </span>
          </div>
          <Progress value={buyPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Sell</span>
            <span className="text-sm font-medium">
              {sellLimit.current.toLocaleString()} / {sellLimit.max.toLocaleString()} USD
            </span>
          </div>
          <Progress value={sellPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
