import { queryKeys } from "@/hooks/use-api-queries"

/**
 * The bug: search on these four lists never changed the query key, so React Query never
 * issued a second request and a failed fetch stayed failed no matter what the user typed.
 * Markets does not have the bug because its key carries every filter, nickname included.
 */
const NICKNAME_KEYED_LISTS = [
  { name: "blockedUsers", key: queryKeys.auth.blockedUsers },
  { name: "tradePartners", key: queryKeys.auth.tradePartners },
  { name: "followers", key: queryKeys.auth.followers },
  { name: "favouriteUsers", key: queryKeys.buySell.favouriteUsers },
]

describe("profile list query keys", () => {
  NICKNAME_KEYED_LISTS.forEach(({ name, key }) => {
    describe(name, () => {
      it("changes when the nickname changes, so a new search is a new request", () => {
        expect(key("Alice")).not.toEqual(key())
        expect(key("Alice")).not.toEqual(key("Bob"))
      })

      it("resolves an empty or whitespace-only search back to the unfiltered key", () => {
        expect(key("")).toEqual(key())
        expect(key("   ")).toEqual(key())
      })

      it("keeps the unfiltered key as a prefix, so invalidating it refreshes every search", () => {
        const unfiltered = key() as readonly unknown[]
        const filtered = key("Alice") as readonly unknown[]

        expect(filtered.slice(0, unfiltered.length)).toEqual([...unfiltered])
        expect(filtered).toHaveLength(unfiltered.length + 1)
      })
    })
  })

  it("keeps the four lists on separate keys, so a nickname on one cannot leak into another", () => {
    const keys = NICKNAME_KEYED_LISTS.map(({ key }) => JSON.stringify(key("Alice")))

    expect(new Set(keys).size).toBe(NICKNAME_KEYED_LISTS.length)
  })
})
