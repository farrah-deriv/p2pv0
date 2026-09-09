"use client"

/**
 * Deciding whether an in-app "Back" control may call `router.back()`. Any new `router.back()`
 * on a deep-linkable route belongs behind {@link canGoBackWithinApp} for the reasons below.
 *
 * `window.history.length` on its own cannot answer that question. It counts every entry in
 * the tab — including the browser's own initial entry and entries belonging to other
 * documents — so a tab opened directly on a deep link frequently reports a length above 1
 * with nothing usable behind the current entry. Going back there walks straight out of the
 * SPA, onto `about:blank` in a fresh tab. Two narrower signals do answer it:
 *
 * 1. Was there a previous *document* in this tab? Both a non-empty `document.referrer` and a
 *    history length above 1, sampled at document load. A pasted deep link leaves the referrer
 *    empty even when the tab reports extra entries; a link opened in a new tab sets a referrer
 *    but leaves the tab with a single entry. Requiring both rejects each case.
 * 2. Have we pushed an in-app entry since the document loaded? On Chromium the Navigation API
 *    answers exactly: `navigation.currentEntry.index` counts only same-origin contiguous
 *    entries, so it is 0 on a deep-linked document, rises on an in-app push, and returns to 0
 *    once the user has unwound back to where they entered. Where it is unavailable, compare
 *    the current history length against its value at document load — `history.length` never
 *    shrinks, so that fallback keeps answering "yes" after an unwind, but it never ejects a
 *    user who has not navigated in-app at all, which is the reported failure.
 */

/** The history facts as they were when this document loaded. */
export interface NavigationEntry {
  historyLength: number
  referrer: string
}

/** The history facts at the moment the control is pressed. */
export interface CurrentHistory {
  historyLength: number
  /** Index within the same-origin contiguous entries, or null when the Navigation API is absent. */
  sameOriginEntryIndex: number | null
}

/** Whether another document preceded this one in the same tab. */
function hasPreviousDocument(entry: NavigationEntry): boolean {
  return entry.referrer !== "" && entry.historyLength > 1
}

/** Whether this document has pushed an entry of its own that we can return to. */
function hasInAppHistory(entry: NavigationEntry, current: CurrentHistory): boolean {
  if (current.sameOriginEntryIndex !== null) {
    return current.sameOriginEntryIndex > 0
  }
  return current.historyLength > entry.historyLength
}

/**
 * True when going back stays inside the app, or returns to the page that linked here.
 * False means the caller must navigate explicitly instead — never `router.back()`.
 */
export function canReturnWithinApp(entry: NavigationEntry, current: CurrentHistory): boolean {
  return hasPreviousDocument(entry) || hasInAppHistory(entry, current)
}

interface NavigationApi {
  currentEntry?: { index?: number } | null
}

function readSameOriginEntryIndex(): number | null {
  const navigation = (window as unknown as { navigation?: NavigationApi }).navigation
  const index = navigation?.currentEntry?.index
  return typeof index === "number" && index >= 0 ? index : null
}

// Sampled once per document load rather than lazily on press: by the time the control is
// pressed the user may already have pushed in-app entries, and the entry-time values are
// exactly what those pushes have to be measured against. The module is imported by the
// header, so it is evaluated during hydration, before any client-side navigation.
let documentEntry: NavigationEntry | null = null

function captureNavigationEntry(): void {
  if (documentEntry !== null || typeof window === "undefined") return
  documentEntry = { historyLength: window.history.length, referrer: document.referrer }
}

/**
 * Browser-facing form of {@link canReturnWithinApp}. Returns false when the entry snapshot is
 * missing (server render, or the module somehow loaded after navigation began) so the caller
 * falls back to an explicit in-app route — the answer that can never eject the user.
 *
 * Known limitation: on browsers without the Navigation API (Safari) this still returns true
 * after a user has navigated in-app and then unwound all the way back to the page they
 * deep-linked into, because `history.length` never shrinks. That leg can still eject them.
 * It is strictly narrower than the bug this replaces — which ejected every deep-linked user
 * on the first tap, on the platform where the defect was reported — but it is not fixed. A
 * Safari-safe answer needs an in-app push counter maintained over `popstate`.
 */
export function canGoBackWithinApp(): boolean {
  if (typeof window === "undefined" || documentEntry === null) return false
  return canReturnWithinApp(documentEntry, {
    historyLength: window.history.length,
    sameOriginEntryIndex: readSameOriginEntryIndex(),
  })
}

captureNavigationEntry()
