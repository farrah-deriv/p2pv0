import en from "./translations/en.json"

/** Shape of a locale JSON file (nested string leaves). */
export type TranslationTree = typeof en

export type TranslationParams = Record<string, string | number>

/**
 * Resolve a dotted translation key against a locale tree, falling back to English.
 */
export function resolveTranslation(
  tree: TranslationTree,
  fallbackTree: TranslationTree,
  key: string,
  params?: TranslationParams,
): string {
  const keys = key.split(".")
  let value: unknown = tree

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      value = fallbackTree
      for (const fallbackKey of keys) {
        if (value && typeof value === "object" && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey]
        } else {
          return key
        }
      }
      break
    }
  }

  if (typeof value !== "string") {
    return key
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match
    })
  }

  return value
}
