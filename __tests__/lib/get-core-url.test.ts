import { getCoreUrl } from "@/lib/get-core-url"

function setHostname(hostname: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, hostname },
  })
}

function setNodeEnv(value: string) {
  // `process.env.NODE_ENV` is typed readonly, but getCoreUrl reads it at runtime
  // under jest (webpack only const-folds it for real bundles).
  Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value })
}

describe("getCoreUrl", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    setNodeEnv("production")
    process.env.NEXT_PUBLIC_CORE_URL = "https://staging-api-core.deriv.com"
    process.env.NEXT_PUBLIC_CORE_ME_URL = "https://staging-api-core.deriv.me"
    process.env.NEXT_PUBLIC_CORE_BE_URL = "https://staging-api-core.deriv.be"
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns the same-origin proxy path in local dev", () => {
    setNodeEnv("development")
    setHostname("localhost")

    expect(getCoreUrl()).toBe("/api/proxy/api")
  })

  it("uses the upstream URL on localhost when not running next dev", () => {
    setHostname("localhost")

    expect(getCoreUrl()).toBe("https://staging-api-core.deriv.com")
  })

  it("does not treat the staging build (NODE_ENV=staging) as local dev", () => {
    setNodeEnv("staging")
    setHostname("staging-dp2p.deriv.com")

    expect(getCoreUrl()).toBe("https://staging-api-core.deriv.com")
  })

  it.each([
    ["staging-dp2p.deriv.com", "https://staging-api-core.deriv.com"],
    ["staging-dp2p.deriv.me", "https://staging-api-core.deriv.me"],
    ["staging-dp2p.deriv.be", "https://staging-api-core.deriv.be"],
  ])("maps %s to its tld-specific upstream", (hostname: string, expected: string) => {
    setHostname(hostname)

    expect(getCoreUrl()).toBe(expected)
  })

  it("falls back to the .com upstream when a tld-specific URL is unset", () => {
    delete process.env.NEXT_PUBLIC_CORE_ME_URL
    setHostname("staging-dp2p.deriv.me")

    expect(getCoreUrl()).toBe("https://staging-api-core.deriv.com")
  })
})
