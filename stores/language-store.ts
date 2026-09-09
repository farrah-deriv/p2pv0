import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Locale } from "@/lib/i18n/config"
import { defaultLocale } from "@/lib/i18n/config"
import { persistLocaleCookie } from "@/lib/i18n/locale-cookie"
import { updatePreferredLanguage } from "@/services/api/api-auth"

export interface SetLocaleOptions {
  /** When true, also `PUT /v1/client/preferred-language` (user-initiated change). */
  syncToServer?: boolean
}

interface LanguageState {
  locale: Locale
  setLocale: (locale: Locale, options?: SetLocaleOptions) => void
}

// Store persists the preference as fallback when no query param is present
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale, options) => {
        set({ locale })
        persistLocaleCookie(locale)
        if (options?.syncToServer) {
          void updatePreferredLanguage(locale).catch(() => {})
        }
      },
    }),
    {
      name: "language-storage",
    },
  ),
)
