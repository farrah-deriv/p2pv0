/**
 * Persists the marketplace list scroll position across navigation.
 *
 * The marketplace page (`BuySellPage`) unmounts when the user navigates to an
 * advertiser profile (`router.push('/advertiser/[id]')`) and mounts a fresh
 * instance on return, so the scroll container starts back at the top. React
 * Query keeps the list rows cached, but nothing preserves the DOM scroll
 * offset. This module-level store holds that offset so it can be restored on
 * remount.
 *
 * It is intentionally NOT a React/Zustand store: reading or writing the scroll
 * offset must not trigger re-renders, and the value only needs to survive an
 * unmount/remount cycle within the same session.
 */

let savedScrollTop = 0

export function saveMarketScrollTop(scrollTop: number): void {
  savedScrollTop = scrollTop > 0 ? scrollTop : 0
}

export function getMarketScrollTop(): number {
  return savedScrollTop
}

export function clearMarketScrollTop(): void {
  savedScrollTop = 0
}
