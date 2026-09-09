"use client"

import type { AlertDialogConfig } from "@/types/alert-dialog"
import { KycOnboardingSheet, type KycOnboardingRoute } from "./kyc-onboarding-sheet"

export function createKycOnboardingAlertConfig(options: {
  route?: KycOnboardingRoute
  onClose?: () => void
  onConfirm?: () => void
  onCancel?: () => void
}): AlertDialogConfig {
  return {
    size: "kycOnboarding",
    hideCloseButton: true,
    content: <KycOnboardingSheet route={options.route} onClose={options.onClose} />,
    onClose: options.onClose,
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
  }
}
