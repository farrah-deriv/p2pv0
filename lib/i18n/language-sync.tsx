"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useLanguageStore } from "@/stores/language-store"
import { getClientPreferences, getSessionCached } from "@/services/api/api-auth"
import {
  apiPreferredLanguageToLocale,
  defaultLocale,
  isRtlLocale,
  localeToBcp47,
  normalizeLocaleParam,
  type Locale,
} from "./config"
import { loadLocale } from "./translation-loader"

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = localeToBcp47(locale)
  document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr"
}

function resolveLangFromUrl(langParam: string | null): Locale | null {
  if (!langParam) return null
  return normalizeLocaleParam(langParam) ?? defaultLocale
}

function runAfterLanguageStoreHydration(run: () => void): (() => void) | void {
  const persistApi = useLanguageStore.persist
  if (persistApi?.hasHydrated?.()) {
    run()
    return
  }
  if (persistApi?.onFinishHydration) {
    return persistApi.onFinishHydration(run)
  }
  run()
}

export function LanguageSync() {
  const searchParams = useSearchParams()
  const locale = useLanguageStore((state) => state.locale)
  const setLocale = useLanguageStore((state) => state.setLocale)
  const syncedFromServerRef = useRef(false)

  const applyLocaleFromUrl = () => {
    const langParam = searchParams.get("lang")
    if (!langParam) return false
    const resolved = resolveLangFromUrl(langParam)
    if (resolved) {
      setLocale(resolved)
    }
    return true
  }

  // `?lang=` from platform (e.g. zh-CN, zh-TW) wins over server + persisted preference.
  useEffect(() => {
    if (applyLocaleFromUrl()) return

    const storedLocale = localStorage.getItem("language-storage")
    if (!storedLocale) return

    try {
      const parsed = JSON.parse(storedLocale)
      const stored = parsed.state?.locale ? normalizeLocaleParam(parsed.state.locale) : null
      if (stored) {
        setLocale(stored)
      }
    } catch {
      setLocale(defaultLocale)
    }
  }, [searchParams, setLocale])

  // Persist rehydration can run after the effect above and overwrite URL locale.
  useEffect(() => {
    const persistApi = useLanguageStore.persist
    if (!persistApi?.onFinishHydration) return

    return persistApi.onFinishHydration(() => {
      applyLocaleFromUrl()
    })
  }, [searchParams, setLocale])

  // After auth, sync once per page load from GET /v1/client/preferences.
  // Precedence: URL `?lang=` > server > localStorage (Zustand) > default.
  useEffect(() => {
    if (searchParams.get("lang")) return

    let cancelled = false

    const syncFromServer = async () => {
      if (cancelled || syncedFromServerRef.current) return
      syncedFromServerRef.current = true

      const authed = await getSessionCached()
      if (cancelled || !authed) return

      try {
        const preferredLanguage = await getClientPreferences()
        if (cancelled || !preferredLanguage) return

        const resolved = apiPreferredLanguageToLocale(preferredLanguage)
        if (resolved) {
          setLocale(resolved)
        }
      } catch {
        // Non-fatal — keep cached / device locale.
      }
    }

    const hydrationCleanup = runAfterLanguageStoreHydration(() => {
      void syncFromServer()
    })

    return () => {
      cancelled = true
      hydrationCleanup?.()
    }
  }, [searchParams, setLocale])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  useEffect(() => {
    void loadLocale(locale)
  }, [locale])

  return null
}
