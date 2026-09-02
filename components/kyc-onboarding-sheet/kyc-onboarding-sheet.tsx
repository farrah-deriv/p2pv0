"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getHomeUrl } from "@/lib/utils"
import { queryKeys } from "@/hooks/use-api-queries"
import * as AuthAPI from "@/services/api/api-auth"
import { onboardingKycStepStatusFromRaw } from "@/lib/kyc/onboarding-kyc-step-status"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { KycOnboardingContentPanel } from "./kyc-onboarding-content-panel"
import { KycOnboardingVisualPanel } from "./kyc-onboarding-visual-panel"
import type { KycOnboardingStep } from "./kyc-onboarding-step-row"

export type KycOnboardingRoute = "markets" | "profile" | "wallets" | "ads" | "orders"

interface KycOnboardingSheetProps {
  route?: KycOnboardingRoute
  onClose?: () => void
}

function KycOnboardingSheet({ route, onClose }: KycOnboardingSheetProps) {
  const { t } = useTranslations()
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const userId = useUserDataStore((state) => state.userId)
  const queryClient = useQueryClient()
  const setIsOnboardingStatusRefreshing = useUserDataStore((state) => state.setIsOnboardingStatusRefreshing)
  const hasRefreshedOnboardingStatus = useRef(false)
  const [isRefreshingOnboardingStatus, setIsRefreshingOnboardingStatus] = useState(!userId)
  const [hasCreatedP2PUser, setHasCreatedP2PUser] = useState(false)

  useLayoutEffect(() => {
    if (!userId) setIsOnboardingStatusRefreshing(true)
  }, [setIsOnboardingStatusRefreshing, userId])

  useEffect(() => {
    let isMounted = true
    // Existing P2P users keep their cached status. Create ad / other gated
    // CTAs already refreshed via useKycOverlay before this sheet mounts, so
    // do not hit /onboarding-status again.
    if (userId && !hasRefreshedOnboardingStatus.current) {
      if (isMounted) setIsRefreshingOnboardingStatus(false)
      return
    }

    // userId appeared mid-fetch (ensureP2PUser resolved during the async gap,
    // or the effect re-ran under Concurrent Mode before the .finally). The
    // refresh already did its job — clear the local loader so the sheet does
    // not render null forever (line ~298). The async .finally is guarded by
    // isMounted and skips this when cleanup has run.
    if (userId && hasRefreshedOnboardingStatus.current) {
      if (isMounted) setIsRefreshingOnboardingStatus(false)
      return
    }

    // Do not clear the full-page loader if users/me finishes while this
    // onboarding-status request is still in flight.
    if (hasRefreshedOnboardingStatus.current) return

    hasRefreshedOnboardingStatus.current = true
    void (async () => {
      try {
        // Gated CTAs already wrote a fresh snapshot via useKycOverlay. Reuse
        // it so Create ad / other CTAs do not hit /onboarding-status twice.
        const status =
          useUserDataStore.getState().onboardingStatus ??
          (await queryClient.fetchQuery({
            queryKey: queryKeys.auth.onboardingStatus(),
            queryFn: () => AuthAPI.getOnboardingStatus(),
            staleTime: 0,
          }))
        if (!isMounted || !status) return

        // If onboarding has completed since P2P first loaded, create the P2P
        // profile. Do not open the guide intro from here — Create ad (and
        // other gated CTAs) pick intro vs KYC *before* this sheet mounts.
        if (status.p2p.allowed && !useUserDataStore.getState().userId) {
          await AuthAPI.ensureP2PUser()
          if (!isMounted) return

          if (useUserDataStore.getState().userId) {
            setHasCreatedP2PUser(true)
            onClose?.()
          }
        }
      } finally {
        if (isMounted) {
          setIsRefreshingOnboardingStatus(false)
          setIsOnboardingStatusRefreshing(false)
        }
      }
    })()

    return () => {
      isMounted = false
      setIsOnboardingStatusRefreshing(false)
    }
  }, [onClose, queryClient, setIsOnboardingStatusRefreshing, userId])

  const isTncAccepted = onboardingStatus?.tnc?.accepted === true
  const isProfileCompleted = onboardingStatus?.profile?.status === "complete" && isTncAccepted
  const isPoiCompleted = onboardingStatus?.kyc?.poi_status === "approved"
  const isPoaCompleted = onboardingStatus?.kyc?.poa_status === "approved"
  const isPoiRejected = onboardingStatus?.kyc?.poi_status === "rejected"
  const isPoaRejected = onboardingStatus?.kyc?.poa_status === "rejected"
  const isPoiInReview = onboardingStatus?.kyc?.poi_status === "pending"
  const isPoaInReview = onboardingStatus?.kyc?.poa_status === "pending"
  const isPoiIncomplete = Boolean(userId && !isPoiCompleted)
  const isPoaIncomplete = Boolean(userId && !isPoaCompleted)
  const isPhoneCompleted =
    onboardingStatus?.p2p?.criteria?.find((c) => c.code === "phone_verified")?.passed || false

  const getFromParam = () => {
    if (!route) return "from=p2p"

    switch (route) {
      case "markets":
        return "from=p2p"
      case "profile":
        return "from=p2p-profile"
      case "wallets":
        return "from=p2p-wallet"
      case "ads":
        return "from=p2p-ads"
      case "orders":
        return "from=p2p-orders"
      default:
        return "from=p2p"
    }
  }

  const fromParam = getFromParam()

  const allVerificationSteps: KycOnboardingStep[] = useMemo(
    () => [
      {
        id: "profile",
        title: t("kyc.setupProfile"),
        icon: "/icons/account-profile.svg",
        completed: isProfileCompleted,
        link: getHomeUrl("onboardingProfile", fromParam, isTncAccepted),
      },
      {
        id: "phone",
        title: t("kyc.phoneNumber"),
        icon: "/icons/pnv.svg",
        completed: isPhoneCompleted,
        status: isPhoneCompleted ? "verified" : "none",
        link: getHomeUrl("onboardingPNV", fromParam, isTncAccepted),
      },
      {
        id: "poi",
        title: t("kyc.proofOfIdentity"),
        icon: "/icons/poi.svg",
        completed: isPoiCompleted,
        rejected: isPoiRejected,
        inReview: isPoiInReview,
        expired: isPoiIncomplete,
        status: onboardingKycStepStatusFromRaw(onboardingStatus?.kyc?.poi_status),
        link: getHomeUrl("poi", fromParam, isTncAccepted),
      },
      {
        id: "poa",
        title: t("kyc.proofOfAddress"),
        icon: "/icons/poa.svg",
        completed: isPoaCompleted,
        rejected: isPoaRejected,
        inReview: isPoaInReview,
        expired: isPoaIncomplete,
        status: onboardingKycStepStatusFromRaw(onboardingStatus?.kyc?.poa_status),
        link: getHomeUrl("poa", fromParam, isTncAccepted),
      },
    ],
    [
      t,
      isProfileCompleted,
      fromParam,
      isTncAccepted,
      isPhoneCompleted,
      isPoiCompleted,
      isPoiRejected,
      isPoiInReview,
      isPoiIncomplete,
      onboardingStatus?.kyc?.poi_status,
      isPoaCompleted,
      isPoaRejected,
      isPoaInReview,
      isPoaIncomplete,
      onboardingStatus?.kyc?.poa_status,
    ],
  )

  const hasIncompleteSteps = Boolean(isPoiIncomplete || isPoaIncomplete)
  const verificationSteps = useMemo(() => {
    return hasIncompleteSteps
      ? allVerificationSteps.filter((step) => {
          if (isPoiIncomplete && step.id === "poi") return true
          if (isPoaIncomplete && step.id === "poa") return true
          return false
        })
      : allVerificationSteps
  }, [hasIncompleteSteps, isPoiIncomplete, isPoaIncomplete, allVerificationSteps])

  const getDescription = () => {
    if (hasIncompleteSteps) {
      if (isPoiIncomplete && isPoaIncomplete) return t("kyc.resubmitIdentityAndAddress")
      if (isPoiIncomplete) return t("kyc.resubmitIdentity")
      if (isPoaIncomplete) return t("kyc.resubmitAddress")
    }

    return t("kyc.completeRemainingSteps")
  }

  const handlePoiPoaExpiredLink = () => {
    if (isPoiIncomplete) window.location.href = getHomeUrl("poi")
    else window.location.href = getHomeUrl("poa")
  }

  const allStepsVerifiedOrInReview = verificationSteps.every(
    (step) => step.completed || step.inReview,
  )

  const getFailedPoiOrPoaStep = () => {
    const completedOrInReviewSteps = verificationSteps.filter(
      (step) => step.completed || step.inReview,
    )
    const failedStep = verificationSteps.find((step) => step.rejected)

    if (completedOrInReviewSteps.length === verificationSteps.length - 1 && failedStep) {
      return failedStep
    }
    return null
  }

  const failedStep = getFailedPoiOrPoaStep()

  useEffect(() => {
    const links: HTMLLinkElement[] = []

    verificationSteps.forEach((step) => {
      if (step.link) {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = step.link
        document.head.appendChild(link)
        links.push(link)
      }
    })

    return () => {
      links.forEach((link) => {
        if (link.isConnected) link.remove()
      })
    }
  }, [verificationSteps])

  const handleCompleteVerification = () => {
    if (allStepsVerifiedOrInReview) {
      onClose?.()
      return
    }
    if (failedStep?.link) {
      window.location.href = failedStep.link
      return
    }
    const firstIncompleteStep = verificationSteps.find(
      (step) => !step.completed && step.inReview !== true,
    )
    if (firstIncompleteStep?.link) {
      window.location.href = firstIncompleteStep.link
    }
  }

  const getButtonLabel = () => {
    if (allStepsVerifiedOrInReview) {
      return t("kyc.gotIt")
    }
    if (failedStep) {
      if (failedStep.id === "poi") {
        return t("kyc.checkProofOfIdentity")
      }
      if (failedStep.id === "poa") {
        return t("kyc.checkProofOfAddress")
      }
    }
    return t("kyc.continueVerification")
  }

  const statusLabels = {
    verified: t("kyc.verified"),
    inReview: t("kyc.statusInReview"),
    failed: t("kyc.failed"),
    unverified: t("kyc.unverified"),
  }

  const heroBenefits = [
    t("kyc.heroBenefitPlaceOrder"),
    t("kyc.heroBenefitPublishAds"),
    t("kyc.heroBenefitHigherLimits"),
    t("kyc.heroBenefitFasterWithdrawals"),
  ] as [string, string, string, string]

  if (isRefreshingOnboardingStatus) return null

  if (hasCreatedP2PUser) return null

  if (!onboardingStatus) {
    return null
  }

  return (
        <div data-testid="kyc-sheet-container" className="flex h-full w-full flex-col md:flex-row md:overflow-hidden">
      <KycOnboardingVisualPanel
        variant="mobile"
        showDragHandle
        logoAlt={t("kyc.heroLogoAlt")}
        headline={t("kyc.heroHeadline")}
        benefits={heroBenefits}
      />
      <KycOnboardingVisualPanel
        variant="desktop"
        logoAlt={t("kyc.heroLogoAlt")}
        headline={t("kyc.heroHeadline")}
        benefits={heroBenefits}
      />
      <KycOnboardingContentPanel
        title={t("kyc.finishAccountSetup")}
        description={getDescription()}
        steps={verificationSteps}
        buttonLabel={hasIncompleteSteps ? t("kyc.resubmitNow") : getButtonLabel()}
        onButtonClick={hasIncompleteSteps ? handlePoiPoaExpiredLink : handleCompleteVerification}
        onClose={onClose}
        statusLabels={statusLabels}
      />
    </div>
  )
}

export { KycOnboardingSheet }
export default KycOnboardingSheet
