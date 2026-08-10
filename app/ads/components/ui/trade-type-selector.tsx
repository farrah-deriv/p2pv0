"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TradeTypeSelectorProps {
  value: "buy" | "sell"
  onChange: (value: "buy" | "sell") => void
}

// Hardcoded for now — account currency is always USD. Localize when multi-currency returns.
const BUY_TAB_LABEL = "Buy USD"
const SELL_TAB_LABEL = "Sell USD"

export function TradeTypeSelector({ value, onChange }: TradeTypeSelectorProps) {
  return (
    <Tabs
      className="w-full"
      value={value}
      onValueChange={(type) => onChange(type as "buy" | "sell")}
    >
      <TabsList className="w-full">
        <TabsTrigger className="w-full data-[state=active]:text-slate-1200 text-grayscale-600" value="buy" data-testid="ad-form-radio-type-buy">
          {BUY_TAB_LABEL}
        </TabsTrigger>
        <TabsTrigger className="w-full data-[state=active]:text-slate-1200 text-grayscale-600" value="sell" data-testid="ad-form-radio-type-sell">
          {SELL_TAB_LABEL}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
