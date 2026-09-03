"use client"

import { useCallback, useRef } from "react"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useRefreshOnboardingStatus } from "@/hooks/use-refresh-onboarding-status"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  createKycOnboardingAlertConfig,
  type KycOnboardingRoute,
} from "@/components/kyc-onboarding-sheet"
import { resolveKycOverlay, type KycOverlay } from "@/lib/kyc-overlay"
import { createEmailRequiredAlertConfig } from "@/lib/create-email-required-alert-config"
import { isEmailEligibleForP2P, isExistingP2PUser } from "@/lib/email-eligibility"
import { refreshClientProfileEmailEligibility } from "@/lib/refresh-client-profile-email-eligibility"
import { getHomeUrl } from "@/lib/utils"
import type { AlertDialogConfig } from "@/types/alert-dialog"
import type { EmailEligibility } from "@/stores/user-data-store"

type OverlayDialog = {
  hideAlert: () => void
  showAlert: (config: AlertDialogConfig) => void
  isOpen: boolean
}

async function resolveEmailEligibilityForAction(current: EmailEligibility): Promise<EmailEligibility> {
  if (current === "eligible") return "eligible"
  if (current === "missing") return "missing"
  const result = await refreshClientProfileEmailEligibility()
  return result === "error" ? "eligible" : result
}

// Shared exclusive overlay for every KYC-gated action (Create ad, Buy/Sell,
// advertiser profile, wallet deposit/withdraw/transfer, add payment method,
// manage ad, ?show_kyc_popup). Verified → intro or the original action.
// Unverified → KYC only. Never both — stacking the guide intro on the KYC
// sheet leaves the AlertDialog/Drawer backdrop behind (issue #1478).
export function useKycOverlay(options?: {
  route?: KycOnboardingRoute
  dialog?: OverlayDialog
}) {
  const route = options?.route ?? "markets"
  const { t } = useTranslations()
  const userId = useUserDataStore((state) => state.userId)
  const emailEligibility = useUserDataStore((state) => state.emailEligibility)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const openIntro = useGuideStore((state) => state.openIntro)
  const requestOpenIntro = useGuideStore((state) => state.requestOpenIntro)
  const defaultDialog = useAlertDialog()
  const { hideAlert, showAlert, isOpen: isAlertOpen } = options?.dialog ?? defaultDialog
  const refreshOnboardingStatus = useRefreshOnboardingStatus()

  // isAlertOpen comes from React context, not a Zustand store, so there is no
  // getState() to read fresh inside applyOverlay. A closure over it goes stale
  // across the resolveLatestOverlay network gap: if the user dismisses the KYC
  // alert while the refresh is in flight, the resolved "intro" overlay would
  // hit requestOpenIntro() with a stale isAlertOpen=true and add an extra
  // fade-wait before the intro appears. Keep a ref that always tracks the
  // latest value and read it inside the callback.
  const isAlertOpenRef = useRef(isAlertOpen)
  isAlertOpenRef.current = isAlertOpen

  const showEmailRequiredDialog = useCallback(() => {
    showAlert(
      createEmailRequiredAlertConfig(t, {
        onAddEmail: () => {
          hideAlert()
          window.location.assign(getHomeUrl("emailAddress"))
        },
        onDismiss: hideAlert,
      }),
    )
  }, [hideAlert, showAlert, t])

  const applyOverlay = useCallback(
    (overlay: KycOverlay, onAllow?: () => void) => {
      if (overlay === "wait") return
      if (overlay === "allow") {
        onAllow?.()
        return
      }
      if (overlay === "intro") {
        // After verification the intro is shown once. A later CTA must not
        // remount it — run the original action instead (Create ad, etc.).
        const { hasShownIntro, isIntroOpen: introAlreadyOpen } = useGuideStore.getState()
        if (hasShownIntro) {
          if (!introAlreadyOpen) onAllow?.()
          return
        }
        // Close any leftover KYC sheet first. Opening the intro on top of an
        // already-open AlertDialog/Drawer stacks two backdrops; selecting an
        // intro option then leaves the KYC overlay behind. Read isOpen fresh
        // from the ref so a dismiss during the refresh does not strand the
        // intro behind a stale isAlertOpen=true.
        if (isAlertOpenRef.current) {
          hideAlert()
          requestOpenIntro()
        } else {
          openIntro()
        }
        return
      }
      showAlert(createKycOnboardingAlertConfig({ route, onClose: hideAlert }))
    },
    [hideAlert, openIntro, requestOpenIntro, route, showAlert],
  )

  const applyRefreshedOverlay = useCallback(
    (overlay: KycOverlay, onAllow?: () => void) => {
      applyOverlay(overlay, onAllow)
      // The sheet keeps the full-page loader for users without a P2P profile
      // until it finishes. Everyone else is done with the status refresh.
      if (overlay !== "kyc" || useUserDataStore.getState().userId) {
        useUserDataStore.getState().setIsOnboardingStatusRefreshing(false)
      }
    },
    [applyOverlay],
  )

  const resolveLatestOverlay = useCallback(async (cached: KycOverlay): Promise<KycOverlay> => {
    // Cached status still says unverified after the user uploaded docs and
    // waited on this page. Refresh before opening KYC so a just-verified
    // user gets the intro (or the original action), not the onboarding sheet.
    if (cached !== "kyc") return cached
    try {
      await refreshOnboardingStatus()
      const latest = useUserDataStore.getState()
      return resolveKycOverlay({
        userId: latest.userId,
        verificationStatus: latest.verificationStatus,
        onboardingStatus: latest.onboardingStatus,
      })
    } catch {
      return cached
    }
  }, [refreshOnboardingStatus])

  const runKycGatedAction = useCallback(
    (onAllow: () => void) => {
      const overlay = resolveKycOverlay({
        userId,
        verificationStatus,
        onboardingStatus,
      })
      if (overlay === "kyc") {
        // Show the loader on click — do not wait for /onboarding-status.
        useUserDataStore.getState().setIsOnboardingStatusRefreshing(true)
        void resolveLatestOverlay(overlay)
          .then((latest) => applyRefreshedOverlay(latest, onAllow))
          .catch(() => {
            useUserDataStore.getState().setIsOnboardingStatusRefreshing(false)
          })
        return
      }
      applyOverlay(overlay, onAllow)
    },
    [
      applyOverlay,
      applyRefreshedOverlay,
      onboardingStatus,
      resolveLatestOverlay,
      userId,
      verificationStatus,
    ],
  )

  const runGatedAction = useCallback(
    (onAllow: () => void) => {
      void (async () => {
        const { userId: latestUserId, emailEligibility: latestEmailEligibility } =
          useUserDataStore.getState()
        if (isExistingP2PUser(latestUserId)) {
          const resolvedEligibility = await resolveEmailEligibilityForAction(latestEmailEligibility)
          if (!isEmailEligibleForP2P(resolvedEligibility)) {
            showEmailRequiredDialog()
            return
          }
        }
        runKycGatedAction(onAllow)
      })()
    },
    [runKycGatedAction, showEmailRequiredDialog],
  )

  const openKycIfUnverified = useCallback(async () => {
    const { userId: latestUserId, emailEligibility: latestEmailEligibility } =
      useUserDataStore.getState()
    if (isExistingP2PUser(latestUserId)) {
      const resolvedEligibility = await resolveEmailEligibilityForAction(latestEmailEligibility)
      if (!isEmailEligibleForP2P(resolvedEligibility)) {
        showEmailRequiredDialog()
        return "wait" as KycOverlay
      }
    }

    const overlay = resolveKycOverlay({
      userId,
      verificationStatus,
      onboardingStatus,
    })
    if (overlay !== "kyc") return overlay
    // Cached status can still say unverified after docs were approved on this
    // same page. Refresh before auto-opening so ?show_kyc_popup cannot remount
    // the sheet under a later intro. Show the loader on click, not after
    // /onboarding-status returns.
    useUserDataStore.getState().setIsOnboardingStatusRefreshing(true)
    try {
      const latest = await resolveLatestOverlay(overlay)
      if (latest === "kyc") applyRefreshedOverlay(latest)
      else useUserDataStore.getState().setIsOnboardingStatusRefreshing(false)
      return latest
    } catch {
      useUserDataStore.getState().setIsOnboardingStatusRefreshing(false)
      return overlay
    }
  }, [
    applyRefreshedOverlay,
    onboardingStatus,
    resolveLatestOverlay,
    showEmailRequiredDialog,
    userId,
    verificationStatus,
  ])

  return {
    runGatedAction,
    openKycIfUnverified,
    showEmailRequiredDialog,
    emailEligibility,
  }
}
