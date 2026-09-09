/**
 * Remote Config API Service
 * Handles feature flags and remote configuration
 */

import { getCoreUrl } from "@/lib/get-core-url"

export interface RemoteConfigResponse {
  ory?: boolean
  [key: string]: any
}

/**
 * Fetch remote configuration including feature flags
 */
export async function getRemoteConfig(): Promise<RemoteConfigResponse> {
  try {
    const response = await fetch(`${getCoreUrl()}/v1/fe/remote-config`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch remote config: ${response.statusText}`)
      return { ory: false }
    }

    const result = await response.json()
    return result.data || { ory: false }
  } catch (error) {
    console.error("Error fetching remote config:", error)
    return { ory: false }
  }
}

/**
 * Get specific feature flag value
 */
export async function getFeatureFlag(flagName: string): Promise<boolean> {
  try {
    const config = await getRemoteConfig()
    return config[flagName] ?? false
  } catch (error) {
    console.error(`Error fetching feature flag ${flagName}:`, error)
    return false
  }
}
