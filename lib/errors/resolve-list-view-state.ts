export type ListViewState = "loading" | "error" | "search-empty" | "empty" | "list"

interface ListViewStateInput {
  isLoading: boolean
  isError: boolean
  /** Length of the list actually about to be rendered — after any client-side search filter. */
  itemCount: number
  hasSearchQuery?: boolean
}

/**
 * The branch order every list screen shares: loading -> error -> search-empty -> empty -> list.
 *
 * The error case has to win over the list, not just over the empty states. A failed fetch leaves
 * `data` undefined on first load (so a zero-length list reads as "you have nothing" rather than
 * "we never heard back") and leaves the previous pages in the cache on a failed refetch (so the
 * list would show stale rows with no sign the refresh failed).
 */
export function resolveListViewState({
  isLoading,
  isError,
  itemCount,
  hasSearchQuery = false,
}: ListViewStateInput): ListViewState {
  if (isLoading) return "loading"
  if (isError) return "error"
  if (itemCount > 0) return "list"
  return hasSearchQuery ? "search-empty" : "empty"
}
