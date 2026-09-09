import * as AuthAPI from "@/services/api/api-auth"
import {
  emailEligibilityFromProfileEmail,
  isExistingP2PUser,
  P2P_EMAIL_REQUIRED_ERROR,
} from "@/lib/email-eligibility"
import { useUserDataStore } from "@/stores/user-data-store"

/** Blocks P2P write APIs when the user has no email on their client profile. */
export async function assertP2PEmailEligibleForMutation(): Promise<void> {
  const { userId, emailEligibility: current } = useUserDataStore.getState()
  if (!isExistingP2PUser(userId)) return
  if (current === "eligible") return

  const profile = await AuthAPI.getClientProfile()
  if (!profile) {
    // Fail open on profile fetch errors; backend enforces eligibility.
    return
  }
  const eligibility = emailEligibilityFromProfileEmail(profile.email)
  useUserDataStore.getState().setEmailEligibility(eligibility)
  if (eligibility !== "eligible") {
    throw Object.assign(new Error(P2P_EMAIL_REQUIRED_ERROR), { code: P2P_EMAIL_REQUIRED_ERROR })
  }
}

export function wrapWithP2PEmailMutationGate<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    await assertP2PEmailEligibleForMutation()
    return fn(...args)
  }
}
