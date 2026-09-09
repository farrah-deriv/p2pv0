"use client"

import { useQuery } from "@tanstack/react-query"
import { useUserDataStore } from "@/stores/user-data-store"
import { getCoreUrl } from "@/lib/get-core-url"
import { p2pFetch } from "@/services/api/p2p-fetch"

const notificationUrl = `${getCoreUrl()}/notifications/v1`

async function fetchSubscriberHash(): Promise<{ subscriberHash: string; subscriberId: string }> {
  const response = await p2pFetch(`${notificationUrl}/hash`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!response.ok) throw new Error(`Failed to fetch subscriber hash: ${response.status}`)
  const responseData = await response.json()
  const subscriberData = responseData.data?.subscriber || responseData.subscriber
  if (!subscriberData) throw new Error("Invalid response structure: missing subscriber data")
  return {
    subscriberHash: subscriberData.subscriberHash,
    subscriberId: subscriberData.subscriberId,
  }
}

export function useNovuSubscriber(disabled = false) {
  const userId = useUserDataStore((state) => state.userId)

  const { data, isLoading, error } = useQuery({
    queryKey: ["novu-subscriber", userId],
    queryFn: fetchSubscriberHash,
    enabled: !disabled && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  return {
    subscriberHash: data?.subscriberHash ?? null,
    subscriberId: data?.subscriberId ?? null,
    isLoading: !disabled && !!userId && isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
  }
}
