"use client"
import Image from "next/image"
import { VerifiedBadge } from "@/components/verified-badge"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { useUserDataStore } from "@/stores/user-data-store"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/lib/i18n/use-translations"
import DevLogoutButton from "./dev-logout-button"

interface UserInfoProps {
  username: string
  email: string
  rating: string
  recommendation: number
  joinDate: string
  tradeBand: string
  isLoading?: boolean
}

export default function UserInfo({
  username,
  email,
  rating,
  joinDate,
  recommendation,
  tradeBand,
  isLoading,
}: UserInfoProps) {
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const { t } = useTranslations()

  const isFullyVerified = verificationStatus?.phone_verified && verificationStatus?.kyc_verified

  const displayName = isLoading ? null : username || email

  return (
    <div className="relative z-10 w-full flex flex-row items-center gap-[16px] md:gap-[24px] bg-slate-1200 p-6 rounded-b-3xl md:rounded-3xl justify-between mb-4 md:mx-0 md:mt-0 md:sticky md:top-0">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div data-testid="profile-avatar" className="relative h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
          <Image src="/icons/user-icon.png" alt={t("common.user")} width={32} height={32} />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex items-center gap-2">
            {displayName ? (
              <h2 data-testid="profile-text-username" className="text-base text-white font-bold">{displayName}</h2>
            ) : (
              <Skeleton className="h-7 w-32 animate-shimmer-dark" />
            )}
            {isFullyVerified && <span data-testid="profile-badge-verified"><VerifiedBadge size={20} /></span>}
            {tradeBand && <span data-testid="profile-badge-trade-band"><TradeBandBadge tradeBand={tradeBand} showLearnMore={true} size={20} /></span>}
          </div>
          {joinDate && <div className="text-xs text-white opacity-[0.72]">{joinDate}</div>}
          <div className="flex flex-wrap gap-y-2 items-center mt-1 text-xs">
            <div className="flex items-center text-white">
              <div className="flex items-center">
                <Image src="/icons/thumbs-up.png" alt={t("common.recommended")} width={24} height={24} className="me-1" />
                <span data-testid="profile-text-recommendation" className="text-white opacity-[0.72]">
                  {recommendation ? recommendation : t("profile.notRecommendedYet")}
                </span>
              </div>
            </div>
            <>
              <div className="mx-4 h-4 w-px bg-white opacity-[0.08]"></div>
              <div className="flex items-center">
                <Image src="/icons/star-rating.png" alt={t("common.star")} width={24} height={24} className="me-1" />
                <span data-testid="profile-text-rating" className="text-white opacity-[0.72]">{rating ? rating : t("profile.notRatedYet")}</span>
              </div>
            </>
          </div>
        </div>
      </div>
      {/* Renders null outside `next dev`. */}
      <DevLogoutButton />
    </div>
  )
}
