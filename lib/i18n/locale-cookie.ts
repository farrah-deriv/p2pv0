import {
  defaultLocale,
  normalizeLocaleParam,
  type Locale,
} from "./config"

/** Cookie used for SSR `lang` / `dir` on `<html>` (mirrors client locale preference). */
export const LOCALE_COOKIE_NAME = "p2p_locale"

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/** Resolve a stored cookie value to a supported locale, or `null` when invalid. */
export function resolveLocaleFromCookieValue(
  value: string | undefined,
): Locale | null {
  if (!value?.trim()) return null
  try {
    return normalizeLocaleParam(decodeURIComponent(value.trim()))
  } catch {
    return null
  }
}

/** Persist locale to a first-party cookie (client-only). */
export function persistLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return
  const encoded = encodeURIComponent(locale)
  document.cookie = `${LOCALE_COOKIE_NAME}=${encoded}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

/** Locale for server-rendered `<html lang dir>` — cookie when valid, else default. */
export function getServerHtmlLocale(
  cookieValue: string | undefined,
): Locale {
  return resolveLocaleFromCookieValue(cookieValue) ?? defaultLocale
}
