"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import StatsContent from "./stats-content"
import { useTranslations } from "@/lib/i18n/use-translations"

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
}

interface AdvertiserStatsProps {
  profile: AdvertiserProfile | null
}

export default function AdvertiserStats({ profile }: AdvertiserStatsProps) {
  const { t } = useTranslations()
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const isMobile = useIsMobile()

  const buyCompletionRate = profile?.statistics_30day?.completion_rate_buy
  const sellCompletionRate = profile?.statistics_30day?.completion_rate_sell
  const buyCount = profile?.statistics_30day?.completion_count_buy || 0
  const sellCount = profile?.statistics_30day?.completion_count_sell || 0
  const totalTrades30d = profile?.statistics_30day?.completion_count_all || 0
  const totalAllTimeTrades = profile?.statistics_lifetime?.completion_count_all || 0

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-4 mx-[-24px] p-6 border-b mb-4 md:mx-0 md:px-0 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-8 flex-1">
            <div className="flex-shrink-0">
              {buyCompletionRate ? (
                <div data-testid="advertiser-text-completion-rate" className="text-base font-bold">
                  {buyCompletionRate}% ({buyCount})
                </div>
              ) : (
                <div data-testid="advertiser-text-completion-rate" className="text-base font-bold">-</div>
              )}
              <div className="text-xs text-slate-500">{t("advertiser.buyCompletionRate30d")}</div>
            </div>
            <div className="flex-shrink-0">
              {sellCompletionRate ? (
                <div className="text-base font-bold">
                  {sellCompletionRate}% ({sellCount})
                </div>
              ) : (
                <div className="text-base font-bold">-</div>
              )}
              <div className="text-xs text-slate-500">{t("advertiser.sellCompletionRate30d")}</div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-base font-bold">{totalTrades30d}</div>
              <div className="text-xs text-slate-500">{t("advertiser.totalTrades30d")}</div>
            </div>
            <div className="flex-shrink-0">
              <div data-testid="advertiser-text-order-count" className="text-base font-bold">{totalAllTimeTrades}</div>
              <div className="text-xs text-slate-500">{t("advertiser.totalAllTimeTrades")}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="font-normal px-0 md:px-3"
            onClick={() => setIsStatsModalOpen(true)}
          >
            <span className="flex items-center gap-1">
              {t("advertiser.viewMore")}
              <Image src="/icons/chevron-right-sm.png" width={20} height={20} />
            </span>
          </Button>
        </div>
      </div>
      {isMobile ? (
        <Drawer open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="font-bold text-xl">{t("advertiser.advertiserInfo")}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <StatsContent profile={profile} isMobile={true} />
              <Button className="my-4 min-w-full w-full" onClick={() => setIsStatsModalOpen(false)}>
                {t("advertiser.close")}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
          <DialogContent className="sm:max-w-md sm:rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="tracking-normal font-bold text-2xl">{t("advertiser.advertiserInfo")}</DialogTitle>
            </DialogHeader>
            <StatsContent profile={profile} isMobile={false} />
            <Button onClick={() => setIsStatsModalOpen(false)}>{t("advertiser.close")}</Button>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  )
}
