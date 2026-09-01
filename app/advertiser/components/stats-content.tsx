"use client"

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"
import { useTranslations } from "@/lib/i18n/use-translations"
import { parseDurationMinutes } from "@/lib/format-duration"

interface AdvertiserProfile {
  id: string | number
  nickname: string
  brand: string
  country_code: string
  created_at: number
  adverts_are_listed: boolean
  blocked_by_user_count: number
  favourited_by_user_count: number
  is_blocked: boolean
  is_favourite: boolean
  temp_ban_until: number | null
  trade_band: string
  order_count_lifetime: number
  order_amount_lifetime: string
  partner_count_lifetime: number
  rating_average_lifetime: number
  recommend_average_lifetime: number
  recommend_count_lifetime: number
  buy_amount_30day: string
  buy_count_30day: number
  buy_time_average_30day: number
  sell_amount_30day: string
  sell_count_30day: number
  release_time_average_30day: number
  rating_average_30day: number
  completion_average_30day: number
  statistics_30day?: {
    completion_rate_buy?: number
    completion_count_buy?: number
    completion_rate_sell?: number
    completion_count_sell?: number
    completion_count_all?: number
    buy_time_average?: number
    release_time_average?: number
    completion_amount_all?: string
  }
  statistics_lifetime?: {
    completion_count_all?: number
    partner_count?: number
  }
}

interface StatsContentProps {
  profile: AdvertiserProfile | null
}

export default function StatsContent({ profile }: StatsContentProps) {
  const { t } = useTranslations()

  const getDuration = (minutes: number | null | undefined) => {
    const parts = parseDurationMinutes(minutes)
    switch (parts.kind) {
      case "invalid": return "-"
      case "zero": return `0 ${t("profile.mins")}`
      case "minutes": return `${parts.value} ${t("profile.mins")}`
      case "hours": return parts.m === 0 ? t("profile.hoursOnly", { hours: parts.h }) : t("profile.hoursMinutes", { hours: parts.h, minutes: parts.m })
      case "days": return parts.h === 0 ? t("profile.daysOnly", { days: parts.d }) : t("profile.daysHours", { days: parts.d, hours: parts.h })
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col">
        <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("advertiser.buyCompletionRate30d")}</div>
            <div className="font-bold mt-1">{profile?.statistics_30day?.completion_rate_buy ? `${profile?.statistics_30day?.completion_rate_buy}% (${profile?.statistics_30day?.completion_count_buy})` :  "-"}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("advertiser.sellCompletionRate30d")}</div>
            <div className="font-bold mt-1">{profile?.statistics_30day?.completion_rate_sell ? `${profile?.statistics_30day?.completion_rate_sell}% (${profile?.statistics_30day?.completion_count_sell})` :  "-"}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("advertiser.totalTrades30d")}</div>
            <div className="font-bold mt-1">{profile?.statistics_30day?.completion_count_all}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("advertiser.totalAllTimeTrades")}</div>
            <div className="font-bold mt-1">{profile?.statistics_lifetime?.completion_count_all}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("profile.avgPayTime")} (30d)</div>
            <div className="font-bold mt-1">{getDuration(profile?.statistics_30day?.buy_time_average)}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="text-sm text-slate-500">{t("profile.avgReleaseTime")} (30d)</div>
            <div className="font-bold mt-1">{getDuration(profile?.statistics_30day?.release_time_average)}</div>
          </div>
          <div className="flex justify-between text-sm border-b py-3">
            <div className="flex items-center text-sm text-slate-500">
              {t("profile.tradePartners")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    src="/icons/info-circle.svg"
                    alt={t("common.info")}
                    width={24}
                    height={24}
                    className="ms-1 cursor-pointer flex-shrink-0"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="opacity-[0.72]">{t("profile.tradePartnersTooltip")}</p>
                  <TooltipArrow className="fill-black" />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-bold mt-1">{profile?.statistics_lifetime?.partner_count}</div>
          </div>
          <div className="flex justify-between text-sm py-3">
            <div className="flex items-center text-sm text-slate-500">
              {t("profile.tradeVolume")} (30d)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    src="/icons/info-circle.svg"
                    alt={t("common.info")}
                    width={24}
                    height={24}
                    className="ms-1 cursor-pointer flex-shrink-0"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="opacity-[0.72]">{t("profile.tradeVolume30DaysTooltip")}</p>
                  <TooltipArrow className="fill-black" />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-bold mt-1">{`USD ${(Number.parseFloat(profile?.statistics_30day?.completion_amount_all || "0")).toFixed(2)}`}</div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
