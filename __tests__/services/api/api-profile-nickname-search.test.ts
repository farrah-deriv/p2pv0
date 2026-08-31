import {
  getBlockedUsers,
  getFavouriteUsers,
  getFollowers,
  getTradePartners,
} from "@/services/api/api-profile"
import { p2pFetch } from "@/services/api/p2p-fetch"

// NB: deliberately no `import jest from "jest"`. That idiom appears elsewhere in this repo
// but it shadows the Jest global with the CLI package, which has no `.mock`/`.fn`, so the
// suite cannot run. `jest` is a global under any runner.

jest.mock("@/lib/local-variables", () => ({
  API: { baseUrl: "https://test.api.deriv.com/p2p/v1" },
  AUTH: { getAuthHeader: () => ({}) },
  USER: { id: "user-1" },
}))

jest.mock("@/services/api/p2p-fetch", () => ({
  p2pFetch: jest.fn(),
}))

const mockP2pFetch = p2pFetch as jest.MockedFunction<typeof p2pFetch>

const requestedUrl = () => mockP2pFetch.mock.calls[0][0] as string

/**
 * The four profile lists whose search used to be a client-side filter over the cached array.
 * Each one now has to put the nickname on the wire, or a failed fetch can never recover:
 * with no nickname in the request there is no nickname in the query key either, so React
 * Query never issues a second request.
 */
const LIST_ENDPOINTS = [
  { name: "getFavouriteUsers", call: getFavouriteUsers, path: "/user-favourites" },
  { name: "getFollowers", call: getFollowers, path: "/user-favourited-by" },
  { name: "getBlockedUsers", call: getBlockedUsers, path: "/user-blocks" },
  { name: "getTradePartners", call: getTradePartners, path: "/trade-partners" },
]

describe("profile list nickname search", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockP2pFetch.mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({ data: [] }),
    } as Response)
  })

  LIST_ENDPOINTS.forEach(({ name, call, path }) => {
    describe(name, () => {
      it("sends the nickname as a query param when searching", async () => {
        await call(1, 50, "Alice")

        expect(requestedUrl()).toBe(`https://test.api.deriv.com/p2p/v1${path}?page=1&per_page=50&nickname=Alice`)
      })

      it("trims the nickname before sending it", async () => {
        await call(1, 50, "  Alice  ")

        expect(requestedUrl()).toContain("nickname=Alice")
      })

      it("omits nickname entirely when the search box is empty or whitespace", async () => {
        await call(1, 50, "   ")

        expect(requestedUrl()).toBe(`https://test.api.deriv.com/p2p/v1${path}?page=1&per_page=50`)
        expect(requestedUrl()).not.toContain("nickname")
      })

      it("omits nickname when no search argument is given at all", async () => {
        await call(1, 50)

        expect(requestedUrl()).not.toContain("nickname")
      })
    })
  })
})
