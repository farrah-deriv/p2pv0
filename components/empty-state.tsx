"use client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import { Button } from "@/components/ui/button"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

interface EmptyStateProps {
  adType?: "buy" | "sell"
  title?: string
  description?: string
  className?: string
  redirectToAds?: boolean
  redirectToMarket?: boolean
  onAddPaymentMethod?: () => void
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
  route,
}: EmptyStateProps) {
  const router = useRouter()
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { hideAlert, showAlert } = useAlertDialog()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const displayTitle = title ?? t("market.noAdsMaintenanceTitle")

  const createAd = () => {
    if (route === "markets") track("ek_create_ad_markets")
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      const operation = adType === "buy" ? "sell" : "buy"
      router.push(`/ads/create?operation=${operation}`)
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: route || "ads", onClose: hideAlert }))
    }
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
        {redirectToAds && (
          <Button onClick={createAd} className="flex-1 min-w-fit whitespace-nowrap">
            {t("myAds.createAd")}
          </Button>
        )}
      </div>
      {onAddPaymentMethod && (
        <Button data-testid="profile-btn-empty-add-payment" onClick={onAddPaymentMethod} className="mt-4 w-full max-w-xs">
          {t("profile.addPaymentMethod")}
        </Button>
      )}
    </div>
  )
}
