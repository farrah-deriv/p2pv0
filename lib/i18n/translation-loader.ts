import type { Locale } from "./config"
import en from "./translations/en.json"
import type { TranslationTree } from "./translation-tree"

const cache = new Map<Locale, TranslationTree>([["en", en as TranslationTree]])

const localeLoaders: Record<Locale, () => Promise<TranslationTree>> = {
  en: async () => en as TranslationTree,
  es: async () => (await import("./translations/es.json")).default as TranslationTree,
  it: async () => (await import("./translations/it.json")).default as TranslationTree,
  pt: async () => (await import("./translations/pt.json")).default as TranslationTree,
  fr: async () => (await import("./translations/fr.json")).default as TranslationTree,
  ru: async () => (await import("./translations/ru.json")).default as TranslationTree,
  vi: async () => (await import("./translations/vi.json")).default as TranslationTree,
  de: async () => (await import("./translations/de.json")).default as TranslationTree,
  bn: async () => (await import("./translations/bn.json")).default as TranslationTree,
  pl: async () => (await import("./translations/pl.json")).default as TranslationTree,
  ko: async () => (await import("./translations/ko.json")).default as TranslationTree,
  sw: async () => (await import("./translations/sw.json")).default as TranslationTree,
  ar: async () => (await import("./translations/ar.json")).default as TranslationTree,
  mn: async () => (await import("./translations/mn.json")).default as TranslationTree,
  si: async () => (await import("./translations/si.json")).default as TranslationTree,
  ta: async () => (await import("./translations/ta.json")).default as TranslationTree,
  zh: async () => (await import("./translations/zh.json")).default as TranslationTree,
  zh_TW: async () => (await import("./translations/zh_TW.json")).default as TranslationTree,
}

const inflight = new Map<Locale, Promise<void>>()

type TranslationListener = () => void
const listeners = new Set<TranslationListener>()
let cacheRevision = 0

function notifyListeners() {
  cacheRevision += 1
  listeners.forEach((listener) => listener())
}

export function getTranslationCacheRevision(): number {
  return cacheRevision
}

export function subscribeTranslationCache(listener: TranslationListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isLocaleLoaded(locale: Locale): boolean {
  return cache.has(locale)
}

/** Active locale messages; uses English until the locale chunk has loaded. */
export function getTranslationTree(locale: Locale): TranslationTree {
  return cache.get(locale) ?? (en as TranslationTree)
}

/**
 * Dynamically import a locale JSON chunk. Resolves immediately for `en` and cached locales.
 */
export async function loadLocale(locale: Locale): Promise<void> {
  if (cache.has(locale)) {
    return
  }

  const existing = inflight.get(locale)
  if (existing) {
    return existing
  }

  const promise = localeLoaders[locale]()
    .then((tree) => {
      cache.set(locale, tree)
    })
    .finally(() => {
      inflight.delete(locale)
      notifyListeners()
    })

  inflight.set(locale, promise)
  return promise
}

/** Preload without subscribing (tests / scripts). */
export function clearTranslationCacheForTests(): void {
  cache.clear()
  cache.set("en", en as TranslationTree)
  inflight.clear()
}
