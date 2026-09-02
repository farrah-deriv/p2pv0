import {
  extractP2PErrorCode,
  handleP2PApiStatusCode,
  reportUnrecognizedErrorEnvelope,
} from "@/lib/api/p2p-api-status-handler"
import { isP2PMaintenanceActive } from "@/lib/p2p-maintenance-env"
import { schemaReporter } from "@/lib/api/schema-reporter"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"

function requestUrl(input: RequestInfo | URL): URL | null {
  const rawUrl = input instanceof Request ? input.url : input.toString()

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost"
    return new URL(rawUrl, baseUrl)
  } catch {
    return null
  }
}

function isProfileUsersMeRequest(url: URL): boolean {
  return url.pathname === "/p2p/v1/users/me"
}

function isLogoutRequest(url: URL): boolean {
  return url.pathname === "/v1/logout"
}

function shouldBlockForMaintenance(input: RequestInfo | URL): boolean {
  const url = requestUrl(input)
  if (!url) return false
  if (!isP2PMaintenanceActive()) return false
  if (isLogoutRequest(url)) return false
  if (isProfileUsersMeRequest(url)) return false

  return true
}

function maintenanceBlockedResponse(): Response {
  return new Response(
    JSON.stringify({
      errors: [{ code: "P2PDisabled", message: "P2P API calls are disabled during maintenance." }],
    }),
    {
      status: 503,
      statusText: "P2P system maintenance",
      headers: { "Content-Type": "application/json" },
    },
  )
}

/**
 * Drop-in fetch wrapper for P2P backend calls. Inspects JSON bodies for
 * embedded status codes (including `P2PDisabled`) on both success and error
 * responses — mirrors the mobile Dio interceptor.
 */
export async function p2pFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (shouldBlockForMaintenance(input)) {
    return maintenanceBlockedResponse()
  }

  const response = await fetch(input, init)

  const url = requestUrl(input)
  if (response.ok && url && isProfileUsersMeRequest(url)) {
    useP2PMaintenanceStore.getState().clearMaintenance()
  }

  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) {
    return response
  }

  try {
    const body = (await response.clone().json()) as unknown
    handleP2PApiStatusCode(extractP2PErrorCode(body))
    if (!response.ok) {
      reportUnrecognizedErrorEnvelope(schemaReporter, url?.pathname ?? "(unknown)", body)
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Empty or malformed JSON bodies are ignored.
      return response
    }
    console.warn("p2pFetch: unexpected error parsing response body", error)
  }

  return response
}
