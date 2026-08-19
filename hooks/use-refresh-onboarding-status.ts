"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-api-queries"
import * as AuthAPI from "@/services/api/api-auth"
import { useUserDataStore } from "@/stores/user-data-store"

// Onboarding status is cached for 5 minutes. After the user uploads KYC and
// comes back to Markets, that cache still says "unverified" until it expires,
// so Create ad opened the KYC sheet even though documents were already
// approved. Refresh on click and write the result into the user store so the
// next overlay decision sees the live status.
export function useRefreshOnboardingStatus() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    const status = await queryClient.fetchQuery({
      queryKey: queryKeys.auth.onboardingStatus(),
      queryFn: () => AuthAPI.getOnboardingStatus(),
      staleTime: 0,
    })

    const store = useUserDataStore.getState()
    store.setOnboardingStatus(status)
    store.setVerificationStatus({
      email_verified: status.verification?.email_verified === true,
      phone_verified:
        status.verification?.phone_verified === true ||
        status.p2p?.criteria?.some((c) => c.code === "phone_verified" && c.passed) === true,
      kyc_verified:
        status.kyc?.poi_status === "approved" && status.kyc?.poa_status === "approved",
      p2p_allowed: status.p2p?.allowed === true,
    })
  }, [queryClient])
}
