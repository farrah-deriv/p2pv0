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

// Tri-state result so callers can tell "verified" apart from "not loaded yet".
// Create ad must NOT guess KYC when status is unknown — that opened KYC and
// then the guide intro on top, stranding the AlertDialog backdrop (issue #1478).
// Unknown → { verified: false, ready: false } → callers wait and do nothing.
export function isP2PVerifiedFromStatus({
  verificationStatus,
  onboardingStatus,
}: {
  verificationStatus?: VerificationStatus | null
  onboardingStatus?: OnboardingStatusResponse | null
}): { verified: boolean; ready: boolean } {
  // Nothing has loaded yet — callers must wait, not guess KYC.
  if (!verificationStatus && !onboardingStatus) {
    return { verified: false, ready: false }
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

  return { verified: Boolean(p2pAllowed && phoneVerified && kycVerified), ready: true }
}
