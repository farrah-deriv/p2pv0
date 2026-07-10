"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/verified-badge"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatPaymentMethodName, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { useUserDataStore } from "@/stores/user-data-store"
import { PresenceLastSeen } from "@/components/presence-last-seen"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"

interface AdvertiserSearchResultCardProps {
    ad: Advertisement
    onAdvertiserClick: (advertiserId: number) => void
    onBuySellClick: (ad: Advertisement) => void
}

export function AdvertiserSearchResultCard({ ad, onAdvertiserClick, onBuySellClick }: AdvertiserSearchResultCardProps) {
    const { t } = useTranslations()
    const { userId } = useUserDataStore()

    return (
        <div data-testid={`mobile-search-card-${ad.user.id}`} className="px-4 py-3">
            {/* Row 1: Advertiser info */}
            <div className="flex items-center">
                <div className="relative h-[40px] w-[40px] flex-shrink-0 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl me-[8px]">
                    {(ad.user?.nickname || "").charAt(0).toUpperCase()}
                    <div className={`absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full border border-white ${ad.user?.is_online ? "bg-buy" : "bg-gray-400"}`} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            data-testid={`mobile-search-btn-advertiser-${ad.user.id}`}
                            className="text-sm hover:underline cursor-pointer truncate"
                            onClick={() => onAdvertiserClick(ad.user.id)}
                        >
                            {ad.user?.nickname}
                        </button>
                        <VerifiedBadge size={20} />
                        {ad.user.trade_band && (
                            <TradeBandBadge tradeBand={ad.user.trade_band} showLearnMore={true} size={20} />
                        )}
                        {IS_CLOSED_GROUP_ENABLED && ad.is_private && (
                            <Image src="/icons/closed-group.svg" alt={t("common.closedGroup")} width={32} height={32} className="cursor-pointer me-1" />
                        )}
                        {ad.user?.is_favourite && (
                            <span className="px-[8px] py-[4px] bg-blue-50 text-blue-100 text-xs rounded-[4px] whitespace-nowrap">
                                {t("market.following")}
                            </span>
                        )}
                    </div>
                    <PresenceLastSeen
                        isOnline={ad.user?.is_online}
                        lastOnlineAt={ad.user?.last_online_at}
                        className="text-xs text-slate-500 block"
                    />
                </div>
            </div>
            <div className="flex items-center text-xs text-slate-500 mb-2">
                {ad.user.rating_average_lifetime && (
                    <span className="flex items-center">
                        <Image src="/icons/star-active.svg" alt={t("common.rating")} width={16} height={16} className="me-1" />
                        <span className="text-pending-text-secondary">{ad.user.rating_average_lifetime.toFixed(2)}</span>
                    </span>
                )}
                {(ad.user.order_count_lifetime ?? 0) > 0 && (
                    <div className="flex flex-row items-center gap-[8px] mx-[8px]">
                        {ad.user.rating_average_lifetime && <div className="h-1 w-1 rounded-full bg-slate-500" />}
                        <span>{ad.user.order_count_lifetime} {t("market.orders")}</span>
                    </div>
                )}
                {(ad.user.completion_rate_all_30day ?? 0) > 0 && (
                    <div className="flex flex-row items-center gap-[8px]">
                        <div className="h-1 w-1 rounded-full bg-slate-500" />
                        <span>{ad.user.completion_rate_all_30day}% {t("market.completion")}</span>
                    </div>
                )}
            </div>
            {/* Row 2: Rate + Order limits + Expiry */}
            <div className="mb-2">
                <div className="font-bold text-base flex items-center">
                    <ExchangeRateDisplay
                        rate={ad.effective_rate_display}
                        paymentCurrency={ad.payment_currency}
                        mutedClassName="text-xs text-slate-500 font-normal"
                    />
                </div>
                <div className="mt-1 text-xs text-slate-600">{`${t("market.orderLimits")}: ${ad.minimum_order_amount || "N/A"} - ${ad.actual_maximum_order_amount || "N/A"} ${ad.account_currency}`}</div>
                {ad.order_expiry_period && (
                    <div className="flex items-center text-xs text-slate-500 mt-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center bg-gray-100 text-slate-500 rounded-sm px-2 py-1 cursor-pointer">
                                        <Image src="/icons/clock.png" alt={t("common.time")} width={12} height={12} className="me-2" />
                                        <span>{ad.order_expiry_period} {t("market.min")}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent align="start" className="max-w-[328px] text-wrap">
                                    <p>{t("order.paymentTimeTooltip", { minutes: ad.order_expiry_period })}</p>
                                    <TooltipArrow className="fill-black" />
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            {/* Row 3: Payment methods + Buy/Sell button */}
            <div className="flex items-center justify-between">
                <div className="flex flex-row flex-wrap gap-2">
                    {ad.payment_methods?.map((method, index) => (
                        <div key={index} className="flex items-center">
                            {method && (
                                <div className={`h-2 w-2 rounded-full me-2 ${method.toLowerCase().includes("bank") ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"}`} />
                            )}
                            <span className="text-xs">{formatPaymentMethodName(method, t)}</span>
                        </div>
                    ))}
                </div>
                {userId && ad.user.id !== Number(userId) && (
                    <Button
                        data-testid={`mobile-search-btn-trade-${ad.id}`}
                        variant={ad.type === "buy" ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => onBuySellClick(ad)}
                        className="ms-2 flex-shrink-0"
                    >
                        {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
                    </Button>
                )}
            </div>
        </div>
    )
}
