import {
  appendNicknameParam,
  normalizeNicknameFilter,
  resolvePendingSearchFlags,
  shouldShowProfileListSearch,
  withNicknameKey,
  PROFILE_SEARCH_DEBOUNCE_MS,
} from "@/lib/profile-list-search"

describe("normalizeNicknameFilter", () => {
  it("treats an absent, empty or whitespace-only nickname as no search", () => {
    expect(normalizeNicknameFilter(undefined)).toBeUndefined()
    expect(normalizeNicknameFilter(null)).toBeUndefined()
    expect(normalizeNicknameFilter("")).toBeUndefined()
    expect(normalizeNicknameFilter("   ")).toBeUndefined()
  })

  it("trims a real nickname without changing its case", () => {
    expect(normalizeNicknameFilter("  Alice  ")).toBe("Alice")
  })
})

describe("appendNicknameParam", () => {
  it("sends nickname only when the user is actually searching", () => {
    expect(appendNicknameParam(new URLSearchParams("page=1&per_page=50")).toString()).toBe("page=1&per_page=50")
    expect(appendNicknameParam(new URLSearchParams("page=1&per_page=50"), "   ").toString()).toBe("page=1&per_page=50")
  })

  it("appends the trimmed nickname when searching", () => {
    expect(appendNicknameParam(new URLSearchParams("page=1&per_page=50"), " Alice ").toString()).toBe(
      "page=1&per_page=50&nickname=Alice",
    )
  })
})

describe("withNicknameKey", () => {
  const base = ["api", "auth", "blocked-users"] as const

  it("returns the unfiltered key unchanged when there is no search", () => {
    expect(withNicknameKey(base)).toEqual(["api", "auth", "blocked-users"])
    expect(withNicknameKey(base, "")).toEqual(["api", "auth", "blocked-users"])
    expect(withNicknameKey(base, "  ")).toEqual(["api", "auth", "blocked-users"])
  })

  it("produces a distinct key per nickname, so each search is its own query", () => {
    expect(withNicknameKey(base, "Alice")).toEqual(["api", "auth", "blocked-users", "Alice"])
    expect(withNicknameKey(base, "Alice")).not.toEqual(withNicknameKey(base, "Bob"))
    expect(withNicknameKey(base, "Alice")).not.toEqual(withNicknameKey(base))
  })

  it("keeps the unfiltered key a prefix of every filtered key", () => {
    // This is what makes `invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })`
    // refresh every nickname variant — React Query matches keys by prefix.
    const filtered = withNicknameKey(base, "Alice") as readonly unknown[]
    expect(filtered.slice(0, base.length)).toEqual([...base])
  })
})

describe("PROFILE_SEARCH_DEBOUNCE_MS", () => {
  it("matches mobile's 400ms search debounce", () => {
    expect(PROFILE_SEARCH_DEBOUNCE_MS).toBe(400)
  })
})

describe("shouldShowProfileListSearch", () => {
  // Mirrors mobile blocked_page.dart, which asks the UNFILTERED `baseAsync` watch whether the
  // user has anything at all — never the filtered list that is currently rendered.
  it("shows search when the unfiltered list has rows", () => {
    expect(shouldShowProfileListSearch({ baseItemCount: 3, searchInput: "", activeNickname: undefined })).toBe(true)
  })

  it("keeps search visible when a search returned zero rows", () => {
    // The regression: visibility was computed from the filtered list, so a search that matched
    // nothing removed the very input the user was typing into.
    expect(shouldShowProfileListSearch({ baseItemCount: 0, searchInput: "zzz", activeNickname: "zzz" })).toBe(true)
  })

  it("keeps search visible while the debounce is still in flight", () => {
    expect(shouldShowProfileListSearch({ baseItemCount: 0, searchInput: "al", activeNickname: undefined })).toBe(true)
  })

  it("keeps search visible after the input is cleared but the nickname has not settled", () => {
    expect(shouldShowProfileListSearch({ baseItemCount: 0, searchInput: "", activeNickname: "alice" })).toBe(true)
  })

  it("hides search when the user has nobody and is not searching", () => {
    expect(shouldShowProfileListSearch({ baseItemCount: 0, searchInput: "", activeNickname: undefined })).toBe(false)
    // Whitespace is not a search, so it must not conjure the field on an empty list.
    expect(shouldShowProfileListSearch({ baseItemCount: 0, searchInput: "   ", activeNickname: undefined })).toBe(false)
  })
})

describe("resolvePendingSearchFlags", () => {
  // Between a keystroke and the debounce settling, the rendered query still belongs to the
  // PREVIOUS nickname. Its error must not be attributed to the search the user just started.
  it("suppresses the previous nickname's error once the user types", () => {
    const flags = resolvePendingSearchFlags({
      isLoading: false,
      isError: true,
      searchInput: "alice",
      activeNickname: undefined,
    })

    expect(flags.isError).toBe(false)
    // Nothing valid is on screen yet, so the list reads as loading rather than as "no matches".
    expect(flags.isLoading).toBe(true)
  })

  it("suppresses a filtered error once the search input is cleared", () => {
    const flags = resolvePendingSearchFlags({
      isLoading: false,
      isError: true,
      searchInput: "",
      activeNickname: "alice",
    })

    expect(flags).toEqual({ isLoading: true, isError: false })
  })

  it("keeps the error once the settled nickname matches what the user typed", () => {
    expect(
      resolvePendingSearchFlags({ isLoading: false, isError: true, searchInput: "alice", activeNickname: "alice" }),
    ).toEqual({ isLoading: false, isError: true })

    expect(
      resolvePendingSearchFlags({ isLoading: false, isError: true, searchInput: "", activeNickname: undefined }),
    ).toEqual({ isLoading: false, isError: true })
  })

  it("does not blank a healthy list on every keystroke", () => {
    // Only a pending search sitting on top of an ERROR forces loading. A successful list keeps
    // its rows while the debounce runs, so typing does not flash a skeleton per character.
    expect(
      resolvePendingSearchFlags({ isLoading: false, isError: false, searchInput: "ali", activeNickname: undefined }),
    ).toEqual({ isLoading: false, isError: false })
  })

  it("treats whitespace-only input as no search, so it never counts as pending", () => {
    expect(
      resolvePendingSearchFlags({ isLoading: false, isError: true, searchInput: "   ", activeNickname: undefined }),
    ).toEqual({ isLoading: false, isError: true })
  })

  it("leaves a genuine loading flag alone", () => {
    expect(
      resolvePendingSearchFlags({ isLoading: true, isError: false, searchInput: "alice", activeNickname: "alice" }),
    ).toEqual({ isLoading: true, isError: false })
  })
})
