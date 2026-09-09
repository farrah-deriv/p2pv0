"use client"

import Image from "next/image"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useTranslations } from "@/lib/i18n/use-translations"
import { parseDurationMinutes } from "@/lib/format-duration"

interface StatCardProps {
  tab: string
  title: string
  value: string | number
  tooltipKey?: string
}

function StatCard({ title, value, tooltipKey }: StatCardProps) {
  const { t } = useTranslations()
  return (
    <div className="flex flex-row-reverse justify-between md:border-none md:flex-col md:h-20 pt-6 pb-2">
      <div className="font-bold text-black text-base leading-6 tracking-normal">{value}</div>
      <div className="flex items-center text-slate-500 mb-2 font-normal text-xs leading-5 tracking-normal">
        {title}
        {tooltipKey && (
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
              <p className="text-white">{t(tooltipKey)}</p>
              <TooltipArrow className="fill-black" />
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

interface StatsData {
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
    completion_rate_buy?: number
    completion_count_buy?: number
    completion_rate_sell?: number
    completion_count_sell?: number
    completion_count_all?: number
    buy_time_average?: number
    release_time_average?: number
    completion_amount_all?: string
    partner_count?: number
  }
}

export default function StatsGrid({ stats }: { stats: StatsData | null }) {
  const { t } = useTranslations()

  const formatAmount = (amount: string | number) => {
    return Number.parseFloat(String(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatTimeInMinutes = (minutes: number | null | undefined) => {
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
      <div className="bg-transparent rounded-lg px-2 md:px-0">
        <div>
          <Tabs defaultValue="last30days">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="last30days" className="flex-1 md:flex-none md:w-32">{t("profile.last30Days")}</TabsTrigger>
              <TabsTrigger value="lifetime" className="flex-1 md:flex-none md:w-32">{t("profile.lifetime")}</TabsTrigger>
            </TabsList>
            <TabsContent value="last30days" className="mt-0 rounded-lg px-0 md:px-0   bg-transparent">
              <div className="flex flex-col divide-y divide-black/[0.08]">
                <div className="flex flex-col divide-y divide-black/[0.08] md:divide-y-0 md:grid md:grid-cols-4">
                  <StatCard
                    tab="last30days"
                    title={t("profile.sellCompletion")}
                    value={
                      stats?.statistics_30day?.completion_rate_sell
                        ? `${stats.statistics_30day.completion_rate_sell}% (${stats.statistics_30day.completion_count_sell})`
                        : "-"
                    }
                  />
                  <StatCard
                    tab="last30days"
                    title={t("profile.buyCompletion")}
                    value={
                      stats?.statistics_30day?.completion_rate_buy
                        ? `${stats.statistics_30day.completion_rate_buy}% (${stats.statistics_30day.completion_count_buy})`
                        : "-"
                    }
                  />
                  <StatCard
                    tab="last30days"
                    title={t("profile.totalOrders")}
                    value={stats?.statistics_30day?.completion_count_all ?? "0"}
                  />
                  <StatCard
                    tab="last30days"
                    title={t("profile.avgPayTime")}
                    value={formatTimeInMinutes(stats?.statistics_30day?.buy_time_average)}
                  />
                </div>
                <div className="flex flex-col divide-y divide-black/[0.08] md:divide-y-0 md:grid md:grid-cols-4">
                  <StatCard
                    tab="last30days"
                    title={t("profile.avgReleaseTime")}
                    value={formatTimeInMinutes(stats?.statistics_30day?.release_time_average)}
                  />
                  <StatCard
                    tab="last30days"
                    title={t("profile.tradeVolume")}
                    tooltipKey="profile.tradeVolume30DaysTooltip"
                    value={
                      stats?.statistics_30day?.completion_amount_all && Number(stats.statistics_30day.completion_amount_all) > 0
                        ? `${formatAmount(stats.statistics_30day.completion_amount_all)} USD`
                        : "0.00 USD"
                    }
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="lifetime" className="mt-0 rounded-lg px-0 md:px-0  bg-transparent">
              <div className="flex flex-col divide-y divide-black/[0.08]">
                <div className="flex flex-col divide-y divide-black/[0.08] md:divide-y-0 md:grid md:grid-cols-4">
                  <StatCard
                    tab="lifetime"
                    title={t("profile.sellCompletion")}
                    value={
                      stats?.statistics_lifetime?.completion_rate_sell
                        ? `${stats.statistics_lifetime.completion_rate_sell}% (${stats.statistics_lifetime.completion_count_sell})`
                        : "-"
                    }
                  />
                  <StatCard
                    tab="lifetime"
                    title={t("profile.buyCompletion")}
                    value={
                      stats?.statistics_lifetime?.completion_rate_buy
                        ? `${stats.statistics_lifetime.completion_rate_buy}% (${stats.statistics_lifetime.completion_count_buy})`
                        : "-"
                    }
                  />
                  <StatCard
                    tab="lifetime"
                    title={t("profile.totalOrders")}
                    value={stats?.statistics_lifetime?.completion_count_all ?? "0"}
                  />
                  <StatCard
                    tab="lifetime"
                    title={t("profile.avgPayTime")}
                    value={formatTimeInMinutes(stats?.statistics_lifetime?.buy_time_average)}
                  />
                </div>
                <div className="flex flex-col divide-y divide-black/[0.08] md:divide-y-0 md:grid md:grid-cols-4">
                  <StatCard
                    tab="lifetime"
                    title={t("profile.avgReleaseTime")}
                    value={formatTimeInMinutes(stats?.statistics_lifetime?.release_time_average)}
                  />
                  <StatCard
                    tab="lifetime"
                    title={t("profile.tradePartners")}
                    tooltipKey="profile.tradePartnersTooltip"
                    value={stats?.statistics_lifetime?.partner_count ?? "0"}
                  />
                  <StatCard
                    tab="lifetime"
                    title={t("profile.tradeVolume")}
                    tooltipKey="profile.tradeVolumeLifetimeTooltip"
                    value={
                      stats?.statistics_lifetime?.completion_amount_all && Number(stats.statistics_lifetime.completion_amount_all) > 0
                        ? `${formatAmount(stats.statistics_lifetime.completion_amount_all)} USD`
                        : "0.00 USD"
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
