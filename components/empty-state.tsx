"use client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { Button } from "@/components/ui/button"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import { isP2PVerified } from "@/lib/is-p2p-verified"

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
  const openIntro = useGuideStore((state) => state.openIntro)
  const requestOpenIntro = useGuideStore((state) => state.requestOpenIntro)
  const { hideAlert, showAlert, isOpen: isAlertOpen } = useAlertDialog()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const displayTitle = title ?? t("market.noAdsMaintenanceTitle")
  const isVerified = isP2PVerified({ verificationStatus, onboardingStatus })

  const createAd = () => {
    if (route === "markets") track("ek_create_ad_markets")
    // One overlay only. Unknown status → wait (do not guess KYC). Verified
    // without a P2P profile → intro. Incomplete KYC → KYC sheet. Never both:
    // treating "status not loaded" as unverified opened KYC, then Main opened
    // the intro on top and left the AlertDialog overlay stuck open.
    if (!verificationStatus && !onboardingStatus) return
    if (isVerified) {
      if (userId) {
        const operation = adType === "buy" ? "sell" : "buy"
        router.push(`/ads/create?operation=${operation}`)
        return
      }
      if (isAlertOpen) {
        hideAlert()
        requestOpenIntro()
      } else {
        openIntro()
      }
      return
    }
    showAlert(createKycOnboardingAlertConfig({ route: route || "ads", onClose: hideAlert }))
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
