"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useLanguageStore } from "@/stores/language-store"
import en from "./translations/en.json"
import {
  getTranslationCacheRevision,
  getTranslationTree,
  subscribeTranslationCache,
} from "./translation-loader"
import { resolveTranslation, type TranslationParams } from "./translation-tree"
import type { Locale } from "./config"

type TranslationKey = string

const englishTree = en

export function useTranslations() {
  const locale = useLanguageStore((state) => state.locale)

  useSyncExternalStore(
    subscribeTranslationCache,
    getTranslationCacheRevision,
    getTranslationCacheRevision,
  )

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const tree = getTranslationTree(locale as Locale)
      return resolveTranslation(tree, englishTree, key, params)
    },
    [locale],
  )

  return { t, locale }
}
