import type { OnboardingStatusResponse } from "@/services/api/api-auth"
import type { VerificationStatus } from "@/stores/user-data-store"

// Single source of truth for "this user may use P2P". Create-ad CTAs use this
// to pick one overlay: verified → guide intro, otherwise → KYC. Never both.
export function isP2PVerified({
  verificationStatus,
  onboardingStatus,
}: {
  verificationStatus?: VerificationStatus | null
  onboardingStatus?: OnboardingStatusResponse | null
}): boolean {
  return isP2PVerifiedFromStatus({ verificationStatus, onboardingStatus }).verified
}

// Criteria the onboarding sheet cannot resolve: a deposit or withdrawal lock is
// lifted by support, not by uploading a document.
export const DEPOSIT_ENABLED = "deposit_enabled"
export const WITHDRAW_ENABLED = "withdraw_enabled"
const PAYMENT_LOCK_CRITERIA: readonly string[] = [DEPOSIT_ENABLED, WITHDRAW_ENABLED]

// Tri-state result so callers can tell "verified" apart from "not loaded yet".
// Create ad must NOT guess KYC when status is unknown — that opened KYC and
// then the guide intro on top, stranding the AlertDialog backdrop (issue #1478).
// Unknown → { verified: false, ready: false } → callers wait and do nothing.
//
// blockedByPaymentLockOnly separates "needs to finish onboarding" from "is a
// finished user whose account is locked". The backend folds payment locks into
// p2p.allowed, so both look identical at that flag — see resolveKycOverlay.
export function isP2PVerifiedFromStatus({
  verificationStatus,
  onboardingStatus,
}: {
  verificationStatus?: VerificationStatus | null
  onboardingStatus?: OnboardingStatusResponse | null
}): { verified: boolean; ready: boolean; blockedByPaymentLockOnly: boolean } {
  // Nothing has loaded yet — callers must wait, not guess KYC.
  if (!verificationStatus && !onboardingStatus) {
    return { verified: false, ready: false, blockedByPaymentLockOnly: false }
  }
  const phoneVerified =
    verificationStatus?.phone_verified === true ||
    onboardingStatus?.verification?.phone_verified === true ||
    onboardingStatus?.p2p?.criteria?.some((c) => c.code === "phone_verified" && c.passed) === true

  // KYC is only required when the env flag is on. Non-mandatory deployments
  // still let an existing P2P user through with phone + p2p.allowed alone —
  // matching the previous isPoiExpired / isPoaExpired gates.
  const isKycMandatory = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY === "1"
  const kycVerified =
    !isKycMandatory ||
    verificationStatus?.kyc_verified === true ||
    (onboardingStatus?.kyc?.poi_status === "approved" &&
      onboardingStatus?.kyc?.poa_status === "approved")

  const p2pAllowed =
    verificationStatus?.p2p_allowed === true || onboardingStatus?.p2p?.allowed === true

  const verified = Boolean(p2pAllowed && phoneVerified && kycVerified)

  // Only the criteria list distinguishes a payment lock from a genuine
  // onboarding gap, because both drive p2p.allowed to false. Requiring at least
  // one *failing* lock criterion is deliberate: an absent or empty criteria
  // array (older responses, a partial payload) must never be read as a lock and
  // wave an unverified user through.
  const failedCriteria =
    onboardingStatus?.p2p?.criteria?.filter((criterion) => criterion.passed === false) ?? []
  const blockedByPaymentLockOnly =
    !verified &&
    phoneVerified &&
    kycVerified &&
    failedCriteria.length > 0 &&
    failedCriteria.every((criterion) => PAYMENT_LOCK_CRITERIA.includes(criterion.code))

  return { verified, ready: true, blockedByPaymentLockOnly }
}
