import { useUserDataStore } from "@/stores/user-data-store"

/**
 * Opening the P2P WebSocket only requires being an existing P2P user — i.e.
 * `/p2p/v1/users/me` returned 200 and `fetchUserIdAndStore` stored its id.
 * (`userId` is `""` when that call 404s and `null` before it resolves, so both
 * correctly read as ineligible.)
 *
 * Onboarding state — KYC, phone verification, TnC, profile completeness —
 * deliberately plays no part. It gates transactional CTAs, not the socket.
 * Gating the socket on approved POI/POA left verification-rejected users with a
 * permanently dead connection (no chat history, no order updates, no balance
 * events) and contradicted `NEXT_PUBLIC_IS_KYC_MANDATORY`, which every other KYC
 * check in the app honours. Mobile gates on profile existence alone
 * (`isP2PAuthorizedProvider`); this keeps web in parity.
 */
export function isP2PWebSocketEligibleFromState(userId: string | null): boolean {
  return !!userId
}

export function isP2PWebSocketEligible(): boolean {
  return isP2PWebSocketEligibleFromState(useUserDataStore.getState().userId)
}
