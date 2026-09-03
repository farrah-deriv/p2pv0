import * as AuthAPI from "@/services/api/api-auth"
import { emailEligibilityFromProfileEmail } from "@/lib/email-eligibility"
import { useUserDataStore, type EmailEligibility } from "@/stores/user-data-store"

let refreshClientProfileEmailEligibilityPromise: Promise<EmailEligibility> | null = null

/** Fetches `/v1/client/profile` and updates store email eligibility. */
export async function refreshClientProfileEmailEligibility(): Promise<EmailEligibility> {
  if (refreshClientProfileEmailEligibilityPromise) {
    return refreshClientProfileEmailEligibilityPromise
  }

  refreshClientProfileEmailEligibilityPromise = (async () => {
    useUserDataStore.getState().setEmailEligibility("loading")
    const profile = await AuthAPI.getClientProfile()
    if (!profile) {
      useUserDataStore.getState().setEmailEligibility("error")
      return "error"
    }
    const eligibility = emailEligibilityFromProfileEmail(profile.email)
    useUserDataStore.getState().setEmailEligibility(eligibility)
    return eligibility
  })().finally(() => {
    refreshClientProfileEmailEligibilityPromise = null
  })

  return refreshClientProfileEmailEligibilityPromise
}
