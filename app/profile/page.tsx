"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import UserInfo from "./components/user-info"
import TradeLimits from "./components/trade-limits"
import StatsTabs from "./components/stats-tabs"
import { useUserDataStore } from "@/stores/user-data-store"
import { useMe } from "@/hooks/use-api-queries"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { useRouter } from "next/navigation"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"

export default function ProfilePage() {
  const router = useRouter()
  const { track } = useTrackers()
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { userData: user } = useUserDataStore()
  const { openKycIfUnverified } = useKycOverlay({ route: "profile" })
  const { data: meData, isLoading, error } = useMe()
  const tempBanUntil = user?.temp_ban_until
  const userEmail = user?.email
  const isDisabled = user?.status === "disabled"
  const { t } = useTranslations()
  const [showKycPopup, setShowKycPopup] = useState(false)
  const searchParams = useSearchParams()
  const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
  const tabFromQuery = searchParams.get("tab")

  const userData = useMemo(() => {
    if (!meData || !meData.nickname || !meData.registered_at) {
      return {}
    }

    const data = meData
    const joinDate = new Date(data.registered_at)
    const day = String(joinDate.getDate()).padStart(2, "0")
    const month = String(joinDate.getMonth() + 1).padStart(2, "0")
    const year = joinDate.getFullYear()
    const joinDateString = t("profile.joinedOn", { date: `${day}/${month}/${year}` })

    return {
      ...data,
      username: data.nickname,
      is_online: data.is_online ?? true,
      rating: (() => {
        const avg = data.statistics_lifetime?.rating_average
        if (avg === null || avg === undefined) return t("profile.notRatedYet")
        const count = data.statistics_lifetime?.rating_count
        return count > 0
          ? t("profile.ratingWithCount", { rating: avg, count })
          : `${avg}/5`
      })(),
      recommendation:
        data.statistics_lifetime?.recommend_average !== null && data.statistics_lifetime?.recommend_average !== undefined
          ? t("profile.recommendedBy", {
            count: data.statistics_lifetime.recommend_count,
            plural: data.statistics_lifetime.recommend_count === 1 ? "" : "s",
          })
          : t("profile.notRecommendedYet"),
      completionRate: data.completion_average_30day ? `${data.completion_average_30day}%` : "-",
      buyCompletion: data.buy_time_average_30day ? data.buy_time_average_30day : "-",
      sellCompletion: data.completion_average_30day ? data.completion_average_30day : "-",
      joinDate: joinDateString,
      tradeLimits: {
        buy: {
          current: data.daily_limits_remaining?.buy || 0,
          max: data.daily_limits?.buy || 0,
        },
        sell: {
          current: data.daily_limits_remaining?.sell || 0,
          max: data.daily_limits?.sell || 0,
        },
      },
      isVerified: {
        id: true,
        address: true,
        phone: true,
      },
    }
  }, [meData, t])

  useEffect(() => {
    track("ek_open_profile")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMaintenanceActive && tabFromQuery && tabFromQuery !== "stats") {
      router.replace("/profile")
    }
  }, [isMaintenanceActive, tabFromQuery, router])

  useEffect(() => {
    if (!shouldShowKyc || showKycPopup) return
    void openKycIfUnverified().then((overlay) => {
      if (overlay === "kyc") setShowKycPopup(true)
    })
  }, [shouldShowKyc, showKycPopup, openKycIfUnverified])

  if (isDisabled) {
    return (
      <div className="flex flex-col h-screen overflow-hidden px-3">
        <div data-testid="profile-msg-access-removed">
          <P2PAccessRemoved />
        </div>
      </div>
    )
  }

  return (
    <>
      {showKycPopup && <div data-testid="profile-alert-kyc" aria-hidden="true" className="hidden" />}
      <div className="md:px-3 overflow-x-hidden md:overflow-y-auto md:h-full">
        <div className="flex flex-col md:flex-row gap-6 md:h-full">
          <div className="flex-1 order-1 md:h-full">
            <UserInfo
              username={userData?.username}
              email={userEmail}
              rating={userData?.rating}
              recommendation={userData?.recommendation}
              joinDate={userData?.joinDate}
              realName={userData?.realName}
              isVerified={userData?.isVerified}
              isLoading={isLoading}
              tradeBand={userData?.trade_band}
            />
            {tempBanUntil && !isMaintenanceActive && (
              <div data-testid="profile-alert-temp-ban">
                <TemporaryBanAlert tempBanUntil={tempBanUntil} />
              </div>
            )}
            <div className="md:w-[50%] flex flex-col gap-6 order-2 my-4 px-3 md:px-0">
              <TradeLimits
                buyLimit={userData?.tradeLimits?.buy}
                sellLimit={userData?.tradeLimits?.sell}
                userData={userData}
              />
            </div>
            <StatsTabs
              stats={userData}
              isLoading={isLoading}
              activeTab={isMaintenanceActive ? "stats" : tabFromQuery || (shouldShowKyc ? "payment" : "stats")}
              maintenanceActive={isMaintenanceActive}
            />
          </div>
        </div>
      </div>
    </>
  )
}
