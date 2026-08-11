import { getOryUrl } from "@/lib/get-ory-url"

function setHostname(hostname: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, hostname },
  })
}

function setNodeEnv(value: string) {
  // `process.env.NODE_ENV` is typed readonly, but getOryUrl reads it at runtime
  // under jest (webpack only const-folds it for real bundles).
  Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value })
}

describe("getOryUrl", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    setNodeEnv("production")
    process.env.NEXT_PUBLIC_ORY_URL = "https://staging-auth.deriv.com"
    process.env.NEXT_PUBLIC_ORY_ME_URL = "https://staging-auth.deriv.me"
    process.env.NEXT_PUBLIC_ORY_BE_URL = "https://staging-auth.deriv.be"
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns the same-origin auth proxy path in local dev", () => {
    setNodeEnv("development")
    setHostname("localhost")

    expect(getOryUrl()).toBe("/api/auth")
  })

  it("uses the upstream URL on localhost when not running next dev", () => {
    setHostname("localhost")

    expect(getOryUrl()).toBe("https://staging-auth.deriv.com")
  })

  it("does not treat the staging build (NODE_ENV=staging) as local dev", () => {
    setNodeEnv("staging")
    setHostname("staging-dp2p.deriv.com")

    expect(getOryUrl()).toBe("https://staging-auth.deriv.com")
  })

  it.each([
    ["staging-dp2p.deriv.com", "https://staging-auth.deriv.com"],
    ["staging-dp2p.deriv.me", "https://staging-auth.deriv.me"],
    ["staging-dp2p.deriv.be", "https://staging-auth.deriv.be"],
  ])("maps %s to its tld-specific upstream", (hostname: string, expected: string) => {
    setHostname(hostname)

    expect(getOryUrl()).toBe(expected)
  })
})
