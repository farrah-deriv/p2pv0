import {
  containsPathTraversal,
  getSetCookieLines,
  getUpstreamBaseUrl,
  getUpstreamPath,
  stripCookieDomain,
} from "@/lib/dev-proxy"

describe("containsPathTraversal", () => {
  it.each(["/..", "/p2p/../../etc/passwd", "/p2p/%2e%2e/secrets", "/%2E%2E/x"])("rejects %s", (path: string) => {
    expect(containsPathTraversal(path)).toBe(true)
  })

  it.each(["/p2p/v1/users/me", "/self-service/login/browser", "/v1/client/profile"])(
    "allows %s",
    (path: string) => {
      expect(containsPathTraversal(path)).toBe(false)
    },
  )

  it("rejects a malformed escape sequence rather than forwarding it", () => {
    expect(containsPathTraversal("/%")).toBe(true)
  })
})

describe("getUpstreamPath", () => {
  it("joins catch-all segments into a leading-slash path", () => {
    expect(getUpstreamPath(["p2p", "v1", "users", "me"])).toBe("/p2p/v1/users/me")
  })

  it("returns the root path when there are no segments", () => {
    expect(getUpstreamPath([])).toBe("/")
    expect(getUpstreamPath(undefined)).toBe("/")
  })

  it("returns null for a traversal attempt", () => {
    expect(getUpstreamPath(["..", "etc", "passwd"])).toBeNull()
  })
})

describe("getUpstreamBaseUrl", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("strips trailing slashes so a leading-slash path can be appended", () => {
    process.env.TEST_UPSTREAM = "https://staging-api-core.deriv.com///"

    expect(getUpstreamBaseUrl("TEST_UPSTREAM")).toBe("https://staging-api-core.deriv.com")
  })

  it("throws when the env var is missing or blank", () => {
    delete process.env.TEST_UPSTREAM
    expect(() => getUpstreamBaseUrl("TEST_UPSTREAM")).toThrow("Missing required env var: TEST_UPSTREAM")

    process.env.TEST_UPSTREAM = "   "
    expect(() => getUpstreamBaseUrl("TEST_UPSTREAM")).toThrow("Missing required env var: TEST_UPSTREAM")
  })

  it("throws for a non-HTTP protocol", () => {
    process.env.TEST_UPSTREAM = "ws://staging-blue.deriv.com"

    expect(() => getUpstreamBaseUrl("TEST_UPSTREAM")).toThrow("must be an absolute HTTP(S) URL")
  })
})

describe("stripCookieDomain", () => {
  it("removes the Domain attribute so the cookie binds to localhost", () => {
    const input = "ory_session_abc=xyz; Path=/; Domain=deriv.com; Max-Age=31536000; HttpOnly; Secure; SameSite=None"

    expect(stripCookieDomain(input)).toBe(
      "ory_session_abc=xyz; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=None",
    )
  })

  it("keeps Secure, which SameSite=None requires and localhost accepts", () => {
    const result = stripCookieDomain("a=b; Domain=deriv.com; Secure; SameSite=None")

    expect(result).toContain("Secure")
    expect(result).toContain("SameSite=None")
  })

  it("matches the Domain attribute case-insensitively", () => {
    expect(stripCookieDomain("a=b; DOMAIN=deriv.com; Path=/")).toBe("a=b; Path=/")
  })

  it("leaves a cookie without a Domain attribute untouched", () => {
    expect(stripCookieDomain("a=b; Path=/; HttpOnly")).toBe("a=b; Path=/; HttpOnly")
  })
})

describe("getSetCookieLines", () => {
  // Real `Headers` objects on purpose: the implementation reads cookies by
  // iterating the header list, so a hand-rolled object literal without
  // `Symbol.iterator` would throw rather than exercise the real path.
  it("returns one entry per separately-set cookie", () => {
    const headers = new Headers()
    headers.append("set-cookie", "a=1; Path=/")
    headers.append("set-cookie", "b=2; Path=/")

    expect(getSetCookieLines(headers)).toEqual(["a=1; Path=/", "b=2; Path=/"])
  })

  it("splits a folded header without breaking on the comma inside Expires", () => {
    const headers = new Headers({
      "set-cookie": "a=1; Path=/; Expires=Tue, 04 Aug 2026 03:12:21 GMT, b=2; Path=/; HttpOnly",
    })

    expect(getSetCookieLines(headers)).toEqual([
      "a=1; Path=/; Expires=Tue, 04 Aug 2026 03:12:21 GMT",
      "b=2; Path=/; HttpOnly",
    ])
  })

  it("ignores non-cookie headers", () => {
    const headers = new Headers({ "content-type": "application/json" })

    expect(getSetCookieLines(headers)).toEqual([])
  })

  it("returns an empty list when there are no headers at all", () => {
    expect(getSetCookieLines(new Headers())).toEqual([])
  })
})
