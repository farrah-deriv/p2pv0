"use client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import { useUserDataStore } from "@/stores/user-data-store"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
import type { KycOnboardingRoute } from "@/components/kyc-onboarding-sheet"

interface EmptyStateProps {
  adType?: "buy" | "sell"
  title?: string
  description?: string
  className?: string
  redirectToAds?: boolean
  redirectToMarket?: boolean
  onAddPaymentMethod?: () => void
  /** Generic CTA label. Pair with onAction — used by the shared list error state. */
  actionLabel?: string
  onAction?: () => void
  route?: string | null
}

export default function EmptyState({
  adType = "sell",
  title,
  description,
  className,
  redirectToAds = false,
  redirectToMarket = false,
  onAddPaymentMethod,
  actionLabel,
  onAction,
  route,
}: EmptyStateProps) {
  const router = useRouter()
  const tempBanUntil = useUserDataStore((state) => state.userData?.temp_ban_until)
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { runGatedAction } = useKycOverlay({
    route: (route as KycOnboardingRoute) || "ads",
  })
  const displayTitle = title ?? t("market.noAdsMaintenanceTitle")

  const createAd = () => {
    if (route === "markets") track("ek_create_ad_markets")
    runGatedAction(() => {
      const operation = adType === "buy" ? "sell" : "buy"
      router.push(`/ads/create?operation=${operation}`)
    })
  }

  const browseMarket = () => {
    router.push("/")
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center px-3 md:px-0 justify-self-center", className)}>
      {displayTitle && <p className="text-base text-slate-1200 mt-2 mb-1 font-bold whitespace-pre-wrap wrap-anywhere">{displayTitle}</p>}
      {description && <p className="text-base font-normal text-grayscale-600">{description}</p>}
      <div className="flex w-full gap-2 flex-wrap mt-4">
        {redirectToMarket && (
          <Button onClick={browseMarket} className="flex-1 min-w-fit whitespace-nowrap" variant="secondary-outline">
            {t("market.browseMarket")}
          </Button>
        )}
        {redirectToAds && !isMaintenanceActive && (
          <Button onClick={createAd} disabled={!!tempBanUntil} className="flex-1 min-w-fit whitespace-nowrap">
            {t("myAds.createAd")}
          </Button>
        )}
      </div>
      {onAddPaymentMethod && (
        <Button data-testid="profile-btn-empty-add-payment" onClick={onAddPaymentMethod} className="mt-4 w-full max-w-xs">
          {t("profile.addPaymentMethod")}
        </Button>
      )}
      {actionLabel && onAction && (
        <Button data-testid="empty-state-btn-action" onClick={onAction} className="mt-4 w-full max-w-xs">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
