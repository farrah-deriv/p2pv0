"use client"

import { useCallback } from "react"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useRefreshOnboardingStatus } from "@/hooks/use-refresh-onboarding-status"
import {
  createKycOnboardingAlertConfig,
  type KycOnboardingRoute,
} from "@/components/kyc-onboarding-sheet"
import { resolveKycOverlay, type KycOverlay } from "@/lib/kyc-overlay"
import type { AlertDialogConfig } from "@/types/alert-dialog"

type OverlayDialog = {
  hideAlert: () => void
  showAlert: (config: AlertDialogConfig) => void
  isOpen: boolean
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
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const openIntro = useGuideStore((state) => state.openIntro)
  const requestOpenIntro = useGuideStore((state) => state.requestOpenIntro)
  const defaultDialog = useAlertDialog()
  const { hideAlert, showAlert, isOpen: isAlertOpen } = options?.dialog ?? defaultDialog
  const refreshOnboardingStatus = useRefreshOnboardingStatus()

  const applyOverlay = useCallback(
    (overlay: KycOverlay, onAllow?: () => void) => {
      if (overlay === "wait") return
      if (overlay === "allow") {
        onAllow?.()
        return
      }
      if (overlay === "intro") {
        // Close any leftover KYC sheet first. Opening the intro on top of an
        // already-open AlertDialog/Drawer stacks two backdrops; selecting an
        // intro option then leaves the KYC overlay behind.
        if (isAlertOpen) {
          hideAlert()
          requestOpenIntro()
        } else {
          openIntro()
        }
        return
      }
      showAlert(createKycOnboardingAlertConfig({ route, onClose: hideAlert }))
    },
    [hideAlert, isAlertOpen, openIntro, requestOpenIntro, route, showAlert],
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

  const runGatedAction = useCallback(
    (onAllow: () => void) => {
      const overlay = resolveKycOverlay({
        userId,
        verificationStatus,
        onboardingStatus,
      })
      if (overlay === "kyc") {
        void resolveLatestOverlay(overlay).then((latest) => applyOverlay(latest, onAllow))
        return
      }
      applyOverlay(overlay, onAllow)
    },
    [applyOverlay, onboardingStatus, resolveLatestOverlay, userId, verificationStatus],
  )

  const openKycIfUnverified = useCallback(async () => {
    const overlay = resolveKycOverlay({
      userId,
      verificationStatus,
      onboardingStatus,
    })
    if (overlay !== "kyc") return overlay
    // Cached status can still say unverified after docs were approved on this
    // same page. Refresh before auto-opening so ?show_kyc_popup cannot remount
    // the sheet under a later intro.
    const latest = await resolveLatestOverlay(overlay)
    if (latest === "kyc") applyOverlay(latest)
    return latest
  }, [applyOverlay, onboardingStatus, resolveLatestOverlay, userId, verificationStatus])

  return {
    runGatedAction,
    openKycIfUnverified,
  }
}
