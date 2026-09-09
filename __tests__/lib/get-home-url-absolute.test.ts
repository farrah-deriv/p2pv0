import { getHomeUrl } from "@/lib/utils"

describe("getHomeUrl returns absolute URLs", () => {
  const originalEnv = process.env.NEXT_PUBLIC_NODE_ENV

  afterEach(() => {
    process.env.NEXT_PUBLIC_NODE_ENV = originalEnv
  })

  const sections: string[] = [
    "poi",
    "poa",
    "home",
    "homeProfile",
    "onboardingProfile",
    "onboardingPNV",
    "financialAssessment",
    "emailAddress",
    // Fallback branch: an omitted or unrecognised section must still be absolute,
    // otherwise assigning it to window.location.href navigates relative to the
    // current origin (https://dp2p.deriv.com/home.deriv.com).
    "",
    "some-unknown-section",
  ]

  const environments: string[] = ["production", "development"]

  environments.forEach((env) => {
    describe(`with NEXT_PUBLIC_NODE_ENV=${env}`, () => {
      sections.forEach((section) => {
        it(`returns an https:// URL for section "${section}"`, () => {
          process.env.NEXT_PUBLIC_NODE_ENV = env

          expect(getHomeUrl(section)).toMatch(/^https:\/\//)
        })
      })

      it("returns an https:// URL when called with no arguments", () => {
        process.env.NEXT_PUBLIC_NODE_ENV = env

        expect(getHomeUrl()).toMatch(/^https:\/\//)
      })
    })
  })

  it("resolves the home section to the staging dashboard outside production", () => {
    process.env.NEXT_PUBLIC_NODE_ENV = "development"
    expect(getHomeUrl("home")).toBe("https://staging-home.deriv.com/dashboard/home")
  })

  it("resolves the home section to the production dashboard in production", () => {
    process.env.NEXT_PUBLIC_NODE_ENV = "production"
    expect(getHomeUrl("home")).toBe("https://home.deriv.com/dashboard/home")
  })
})
