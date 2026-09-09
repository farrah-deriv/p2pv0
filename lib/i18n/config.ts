export const locales = [
  "en",
  "es",
  "it",
  "pt",
  "fr",
  "ru",
  "vi",
  "de",
  "bn",
  "pl",
  "ko",
  "sw",
  "ar",
  "mn",
  "si",
  "ta",
  "zh",
  "zh_TW",
] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  fr: "Français",
  ru: "Русский",
  vi: "Tiếng Việt",
  de: "Deutsch",
  bn: "বাংলা",
  pl: "Polski",
  ko: "한국어",
  sw: "Kiswahili",
  ar: "العربية",
  mn: "Монгол",
  si: "සිංහල",
  ta: "தமிழ்",
  zh: "简体中文",
  zh_TW: "繁體中文",
}

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"])

/** BCP-47 and platform `?lang=` values → internal locale ids (see `locales`). */
const LANG_PARAM_ALIASES: Record<string, Locale> = {
  zh_cn: "zh",
  zh_sg: "zh",
  zh_hans: "zh",
  zh_tw: "zh_TW",
  zh_hk: "zh_TW",
  zh_mo: "zh_TW",
  zh_hant: "zh_TW",
}

/** Map `?lang=` / stored values to a supported Locale (e.g. zh-tw → zh_TW). */
export function normalizeLocaleParam(lang: string): Locale | null {
  const normalized = lang.trim().toLowerCase().replace(/-/g, "_")
  if (normalized in LANG_PARAM_ALIASES) {
    return LANG_PARAM_ALIASES[normalized]
  }
  const caseInsensitiveMatch = locales.find((l) => l.toLowerCase() === normalized)
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch
  }
  const exactMatch = locales.find((l) => l === lang.trim())
  return exactMatch ?? null
}

/** Map API `preferred_language` (e.g. `en`, `zh-cn`, `zh_tw`) to a supported [Locale]. */
export function apiPreferredLanguageToLocale(code: string): Locale | null {
  const trimmed = code.trim()
  if (!trimmed) return null
  return normalizeLocaleParam(trimmed)
}

/** BCP 47 tag for document `lang`, third-party SDKs, and `PUT /v1/client/preferred-language`. */
export function localeToBcp47(locale: Locale): string {
  if (locale === "zh_TW") {
    return "zh-TW"
  }
  if (locale === "zh") {
    return "zh-CN"
  }
  return locale
}

export function isRtlLocale(locale: Locale | string): boolean {
  return RTL_LOCALES.has(locale as Locale)
}
