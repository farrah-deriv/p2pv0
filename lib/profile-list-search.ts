/**
 * Shared rules for the nickname search on the profile lists (following, followers,
 * blocked, counterparties, closed group).
 *
 * Search on these lists is a *server* query, not a filter over the cached array — the same
 * shape Markets already uses. The pieces live here rather than in the API module or the
 * query-key map because both layers have to agree on them: if the URL says
 * `nickname=bob` the query key has to say `bob` too, or React Query serves one nickname's
 * response for another.
 */

/** Matches mobile's blocked/counterparties search delay. */
export const PROFILE_SEARCH_DEBOUNCE_MS = 400

/**
 * The one definition of "the user is searching". Whitespace-only input is not a search,
 * so it keeps the unfiltered list rather than requesting `nickname=%20`.
 */
export function normalizeNicknameFilter(nickname?: string | null): string | undefined {
  const trimmed = nickname?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Appends `nickname` to a list request only when the user is actually searching, matching
 * mobile.
 */
export function appendNicknameParam(params: URLSearchParams, nickname?: string | null): URLSearchParams {
  const normalized = normalizeNicknameFilter(nickname)
  if (normalized !== undefined) params.append("nickname", normalized)
  return params
}

interface ProfileListSearchVisibilityInput {
  /**
   * Row count of the UNFILTERED list — mobile's `baseAsync` watch. Never the rendered,
   * possibly-filtered list: that reads 0 both when the user has nobody and when the current
   * search matched nothing, which would retract the field the user is typing into.
   */
  baseItemCount: number
  /** Raw input value, before debouncing. */
  searchInput: string
  /** The settled nickname the rendered rows were actually requested with. */
  activeNickname?: string
}

/**
 * Whether the nickname search field belongs on screen, mirroring mobile `blocked_page.dart`:
 * the base list has rows, OR the raw input is non-empty, OR a nickname is actually applied.
 *
 * The last two clauses are not redundant — they cover opposite ends of the debounce. Typing sets
 * the input before the nickname settles; clearing empties the input while the nickname is still
 * applied. Without both, the field would blink out mid-interaction.
 */
export function shouldShowProfileListSearch({
  baseItemCount,
  searchInput,
  activeNickname,
}: ProfileListSearchVisibilityInput): boolean {
  return baseItemCount > 0 || normalizeNicknameFilter(searchInput) !== undefined || activeNickname !== undefined
}

interface PendingSearchFlagsInput {
  isLoading: boolean
  isError: boolean
  /** Raw input value, before debouncing. */
  searchInput: string
  /** The settled nickname the rendered query was keyed by. */
  activeNickname?: string
}

/**
 * Reconciles a query's flags with a search the user has started but that has not settled yet.
 *
 * During the debounce the rendered query still belongs to the PREVIOUS nickname, so its failure
 * describes a request the user has already moved on from. Reporting it would strand them on the
 * old error instead of letting the new search run — the whole point of making search a server
 * query was that typing is a way out of a failed fetch.
 *
 * Only an error is overridden, and only into `loading`. A *successful* list keeps its rows while
 * the debounce runs, so typing does not flash a skeleton on every keystroke.
 */
export function resolvePendingSearchFlags({
  isLoading,
  isError,
  searchInput,
  activeNickname,
}: PendingSearchFlagsInput): { isLoading: boolean; isError: boolean } {
  const isSearchPending = normalizeNicknameFilter(searchInput) !== activeNickname
  const isStaleError = isError && isSearchPending

  return { isLoading: isLoading || isStaleError, isError: isError && !isSearchPending }
}

/**
 * Derives the query key for a nickname-searched list.
 *
 * An empty search returns `baseKey` *unchanged*, which is what keeps the existing
 * `invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })` call sites correct:
 * React Query matches keys by prefix, so invalidating the unfiltered key invalidates every
 * nickname variant with it. Appending a `null`/`undefined` segment instead would make the
 * unfiltered key a sibling of the filtered ones rather than their prefix.
 */
export function withNicknameKey<T extends readonly unknown[]>(
  baseKey: T,
  nickname?: string | null,
): T | readonly [...T, string] {
  const normalized = normalizeNicknameFilter(nickname)
  return normalized === undefined ? baseKey : ([...baseKey, normalized] as const)
}
