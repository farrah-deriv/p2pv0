"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getOryUrl } from "@/lib/get-ory-url"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { useUserCountryInvalidStore } from "@/stores/user-country-invalid-store"
import { useUserDataStore } from "@/stores/user-data-store"

/**
 * End the Ory Kratos session.
 *
 * Mirrors home-app's proven logout (`src/lib/api/kratos-client.ts`
 * `kratosLogout`): fetch a `logout_token`, then redeem it. `Accept:
 * application/json` on both hops is required — without it Kratos answers 303
 * with an HTML redirect instead of JSON.
 *
 * Note this is Kratos, not Core. `POST ${CORE_URL}/v1/logout` — what
 * `services/api/api-auth.ts` `logout()` calls — 404s upstream, and home-app has
 * no reference to that path anywhere.
 *
 * Requests go to `getOryUrl()`, which is the same-origin `/api/auth` proxy
 * under `next dev`. The proxy forwards cookies and the `?token=` query string,
 * and strips the cookie `Domain` on the way back so Kratos's clearing headers
 * apply to `localhost`.
 */
async function endKratosSession(): Promise<void> {
  const oryBaseUrl = getOryUrl()

  const flowResponse = await fetch(`${oryBaseUrl}/self-service/logout/browser`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  })

  // Kratos answers 401/403 when there is no live session — already logged out.
  if (flowResponse.status === 401 || flowResponse.status === 403) return

  if (!flowResponse.ok) {
    throw new Error(`Logout flow request failed: ${flowResponse.status}`)
  }

  const { logout_token: logoutToken } = (await flowResponse.json()) as { logout_token?: string }
  if (!logoutToken?.trim()) {
    throw new Error("Kratos returned no logout_token")
  }

  const completeResponse = await fetch(
    `${oryBaseUrl}/self-service/logout?token=${encodeURIComponent(logoutToken)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    },
  )

  // 204 is the documented success for a completed logout.
  if (!completeResponse.ok && completeResponse.status !== 204) {
    throw new Error(`Logout completion failed: ${completeResponse.status}`)
  }
}

/**
 * Local-dev only logout control.
 *
 * Deployed builds have no logout entry point of their own — sessions are ended
 * from home.deriv.com — which leaves local dev with no way to switch accounts
 * short of clearing cookies by hand.
 *
 * Renders `null` outside `next dev`. The check is written inline rather than
 * via `isLocalDev()` because only a literal `process.env.NODE_ENV` comparison
 * is const-folded in the client bundle — see `lib/is-local-dev.ts`. It sits
 * after the hooks so the hook order stays unconditional.
 */
export default function DevLogoutButton() {
  const { t } = useTranslations()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (process.env.NODE_ENV !== "development") return null

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await endKratosSession()
    } catch (error) {
      // Leave local state intact: the session was not actually revoked, so
      // clearing it would show a logged-out UI backed by a live session.
      console.error("[dev-logout] failed:", error)
      toast({
        description: t("profile.logoutFailed"),
        variant: "destructive",
      })
      setIsLoggingOut(false)
      return
    }

    useUserDataStore.getState().clearUserData()
    useP2PMaintenanceStore.getState().clearMaintenance()
    useUserCountryInvalidStore.getState().clearUserCountryInvalid()
    localStorage.removeItem("auth_token")
    localStorage.removeItem("socket_token")

    // Full navigation, not router.push: the logout `Set-Cookie` headers must be
    // committed to the cookie jar before the app re-reads session state.
    window.location.assign("/")
  }

  return (
    <Button
      variant="outline-white"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      data-testid="profile-btn-dev-logout"
      aria-label={t("profile.logout")}
      className="shrink-0"
    >
      {isLoggingOut ? t("profile.loggingOut") : t("profile.logout")}
    </Button>
  )
}
