"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/lib/i18n/use-translations"

interface TradeTypeSelectorProps {
  value: "buy" | "sell"
  onChange: (value: "buy" | "sell") => void
  /** Account currency shown in the tab labels. */
  currency: string
}

export function TradeTypeSelector({ value, onChange, currency }: TradeTypeSelectorProps) {
  const { t } = useTranslations()

  return (
    <Tabs
      className="w-full"
      value={value}
      onValueChange={(type) => onChange(type as "buy" | "sell")}
    >
      <TabsList className="w-full">
        <TabsTrigger className="w-full data-[state=active]:text-slate-1200 text-grayscale-600" value="buy" data-testid="ad-form-radio-type-buy">
          {t("common.buyCurrency", { currency })}
        </TabsTrigger>
        <TabsTrigger className="w-full data-[state=active]:text-slate-1200 text-grayscale-600" value="sell" data-testid="ad-form-radio-type-sell">
          {t("common.sellCurrency", { currency })}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
