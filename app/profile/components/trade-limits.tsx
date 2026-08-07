"use client"

import { ProgressBar } from "@deriv-com/quill-ui-v2"
import { useTranslations } from "@/lib/i18n/use-translations"

interface TradeLimitsProps {
  buyLimit: {
    current: number
    max: number
  }
  sellLimit: {
    current: number
    max: number
  }
  userData?: any
}

export default function TradeLimits({ buyLimit, sellLimit, userData }: TradeLimitsProps) {
  const { t } = useTranslations()

  const buyMax = userData?.daily_limits?.buy ?? "0.00"
  const buyRemaining = userData?.daily_limits_remaining?.buy ?? "0.00"
  const sellMax = userData?.daily_limits?.sell ?? "0.00"
  const sellRemaining = userData?.daily_limits_remaining?.sell ?? "0.00"
  const buyPercentage = (buyRemaining / buyMax) * 100
  const sellPercentage = (sellRemaining / sellMax) * 100

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-base font-normal mb-3 leading-6 tracking-normal">{t("profile.dailyTradeLimit")}</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-buy font-bold text-sm leading-5 tracking-normal">{t("common.buy")}</span>
            <span className="text-sm font-normal leading-5 tracking-normal">
              {buyRemaining} / {buyMax} USD
            </span>
          </div>
          <ProgressBar
            value={buyPercentage || 0}
            type="green"
            size="sm"
            ariaLabel={t("common.buy")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sell font-bold text-sm leading-5 tracking-normal">{t("common.sell")}</span>
            <span className="text-sm font-normal leading-5 tracking-normal">
              {sellRemaining} / {sellMax} USD
            </span>
          </div>
          <ProgressBar
            value={sellPercentage || 0}
            type="red"
            size="sm"
            ariaLabel={t("common.sell")}
          />
        </div>
      </div>
    </div>
  )
}
