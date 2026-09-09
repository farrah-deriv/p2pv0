"use client"

import { useEffect, useMemo, useState } from "react"
import { useUserDataStore } from "@/stores/user-data-store"
import { getIntercomToken } from "@/services/api/api-intercom"
import { useLanguageStore } from "@/stores/language-store"

export function IntercomProvider({ appId }: { appId: string }) {
  const { userData, userId } = useUserDataStore()
  const locale = useLanguageStore((s) => s.locale)
  const [intercomJwt, setIntercomJwt] = useState<string | null>(null)
  const [intercomUserId, setIntercomUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch Intercom token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const result = await getIntercomToken()
        if (result?.token) {
          // This endpoint returns an Intercom Identity Verification token (JWT).
          // When Intercom "Messenger Security" is enabled, you must pass this as `intercom_user_jwt`,
          // not `user_hash` (HMAC).
          setIntercomJwt(result.token)
          setIntercomUserId(result.id ?? userId)
        } else if (userId) {
          setIntercomUserId(userId)
          console.warn("Intercom token not received, continuing without JWT", {
            intercom_user_id: userId,
          })
        } else {
          // For unregistered users, still initialize Intercom without JWT
          // This allows Intercom to collect visitor data and support unregistered users
          setIntercomUserId(null)
        }
      } catch (error) {
        console.error("Failed to fetch Intercom token:", error)
        if (userId) {
          setIntercomUserId(userId)
        }
      }
      setIsLoading(false)
    }

    fetchToken()
  }, [])

  const intercomBaseSettings = useMemo(() => {
    // Mirrors the other team's "Base setting" approach.
    // Note: With Messenger Security enforced, Intercom requires `intercom_user_jwt` for logged-in users.
    // For unregistered users, Intercom will collect visitor data without authentication.
    return {
      api_base: "https://api-iam.intercom.io",
      app_id: appId,
      language_override: locale,
      hide_default_launcher: true,
      ...(intercomJwt ? { intercom_user_jwt: intercomJwt } : {}),
      ...(intercomUserId ? { user_id: intercomUserId } : {}),
      // Optional: you can also pass these if you want Intercom user profile info
      ...(userData?.email ? { email: userData.email } : {}),
      ...(userData?.first_name && userData?.last_name ? { name: `${userData.first_name} ${userData.last_name}` } : {}),
    }
  }, [appId, intercomJwt, intercomUserId, locale, userData?.email, userData?.first_name, userData?.last_name])

  const ensureIntercomScript = () => {
    // If the real Intercom function already exists, nothing to do.
    if (typeof window.Intercom === "function") return

    // If we already inserted the script, nothing to do.
    const existing = document.querySelector(`script[src="https://widget.intercom.io/widget/${appId}"]`)
    if (existing) return

    // Create the stub queue function if needed (matches Intercom recommended snippet).
    const i = function () {
      // eslint-disable-next-line prefer-rest-params
      i.c(arguments)
    } as any
    i.q = []
    i.c = function (args: any) {
      i.q.push(args)
    }
    window.Intercom = i

    const intercomScript = document.createElement("script")
    intercomScript.async = true
    intercomScript.src = `https://widget.intercom.io/widget/${appId}`
    document.head.appendChild(intercomScript)
  }

  const bootOrUpdateIntercom = () => {
    window.intercomSettings = intercomBaseSettings

    if (typeof window.Intercom !== "function") {
      return
    }

    if (!window.__intercomBooted) {
      window.Intercom("boot", window.intercomSettings)
      window.__intercomBooted = true
      return
    }

    window.Intercom("update", window.intercomSettings)
  }

  // Initialize Intercom (other-team style)
  useEffect(() => {
    // Don't initialize until we have the token result (or confirmed we can't/shouldn't fetch it yet)
    if (isLoading) return

    ensureIntercomScript()

    // Boot/update now (queue-safe even if script isn't ready yet)
    bootOrUpdateIntercom()

    // Auto-open if live_chat=true
    if (typeof window !== "undefined" && window.location.search.includes("live_chat=true")) {
      const interval = window.setInterval(() => {
        if (typeof window.Intercom === "function") {
          // Ensure boot happened before show
          bootOrUpdateIntercom()
          window.Intercom("show")
          window.clearInterval(interval)
        }
      }, 200)
      return () => window.clearInterval(interval)
    }
  }, [isLoading, intercomBaseSettings])

  return null
}
