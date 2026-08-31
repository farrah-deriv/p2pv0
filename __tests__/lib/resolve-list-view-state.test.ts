import { resolveListViewState } from "@/lib/errors/resolve-list-view-state"

describe("resolveListViewState", () => {
  it("shows the skeleton while the first fetch is in flight", () => {
    expect(resolveListViewState({ isLoading: true, isError: false, itemCount: 0 })).toBe("loading")
  })

  it("prefers the skeleton over the error state while still loading", () => {
    expect(resolveListViewState({ isLoading: true, isError: true, itemCount: 0 })).toBe("loading")
  })

  // Wallet landing tab: a failed balances request used to fall through to the zero-wallets
  // empty state, so the app claimed the user owned no wallets.
  it("shows the error state, not the empty state, when the request failed", () => {
    expect(resolveListViewState({ isLoading: false, isError: true, itemCount: 0 })).toBe("error")
  })

  // Profile search: filtering a client-side array that is empty because the fetch failed used
  // to render "No matching name", presenting a request failure as a search miss.
  it("shows the error state, not the search-empty state, when the request failed", () => {
    expect(
      resolveListViewState({ isLoading: false, isError: true, itemCount: 0, hasSearchQuery: true }),
    ).toBe("error")
  })

  // A refetch that fails after a good load keeps the previous data in the React Query cache.
  // Rendering it would show stale rows with no sign the refresh failed.
  it("shows the error state rather than stale rows when a refetch failed", () => {
    expect(resolveListViewState({ isLoading: false, isError: true, itemCount: 3 })).toBe("error")
    expect(
      resolveListViewState({ isLoading: false, isError: true, itemCount: 3, hasSearchQuery: true }),
    ).toBe("error")
  })

  it("distinguishes a search miss from a genuinely empty list", () => {
    expect(
      resolveListViewState({ isLoading: false, isError: false, itemCount: 0, hasSearchQuery: true }),
    ).toBe("search-empty")
    expect(resolveListViewState({ isLoading: false, isError: false, itemCount: 0 })).toBe("empty")
  })

  it("renders the list when the fetch succeeded with results", () => {
    expect(resolveListViewState({ isLoading: false, isError: false, itemCount: 2 })).toBe("list")
    expect(
      resolveListViewState({ isLoading: false, isError: false, itemCount: 2, hasSearchQuery: true }),
    ).toBe("list")
  })
})
