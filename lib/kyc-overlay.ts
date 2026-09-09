import { isP2PVerifiedFromStatus } from "@/lib/is-p2p-verified"
import type { OnboardingStatusResponse } from "@/services/api/api-auth"
import type { VerificationStatus } from "@/stores/user-data-store"

export type KycOverlay = "wait" | "allow" | "intro" | "kyc"

// One overlay only. Gated actions used to treat stale/unknown status as
// unverified, open KYC, then open the guide intro on top and leave the
// AlertDialog backdrop stuck (issue #1478). Callers must:
//   wait   → status not loaded; do nothing
//   allow  → verified P2P user; run the original action
//   intro  → verified, no P2P profile yet; show the guide intro only
//   kyc    → not verified; show the onboarding sheet only
export function resolveKycOverlay({
  userId,
  verificationStatus,
  onboardingStatus,
}: {
  userId?: string | null
  verificationStatus?: VerificationStatus | null
  onboardingStatus?: OnboardingStatusResponse | null
}): KycOverlay {
  const { verified, ready, blockedByPaymentLockOnly } = isP2PVerifiedFromStatus({
    verificationStatus,
    onboardingStatus,
  })
  if (!ready) return "wait"
  if (verified) return userId ? "allow" : "intro"
  // An existing P2P user held back only by a deposit/withdrawal lock has nothing
  // left to do in the onboarding sheet: every step already reads as approved, so
  // its CTA collapses to "Got it" and merely closes the sheet — a dead end that
  // also blocks Sell, the one route a withdrawal-locked client has to move funds
  // out (issue #1508). Run the gated action instead. Buy stays reachable too and
  // is rejected server-side at order placement; that tradeoff is deliberate.
  if (userId && blockedByPaymentLockOnly) return "allow"
  return "kyc"
}
