import { getHomeUrl } from "@/lib/utils"

describe("getHomeUrl emailAddress", () => {
  const originalEnv = process.env.NEXT_PUBLIC_NODE_ENV

  afterEach(() => {
    process.env.NEXT_PUBLIC_NODE_ENV = originalEnv
  })

  it("uses staging home host outside production", () => {
    process.env.NEXT_PUBLIC_NODE_ENV = "development"
    expect(getHomeUrl("emailAddress")).toBe("https://staging-home.deriv.com/dashboard/profile/email-address")
  })

  it("uses production home host in production", () => {
    process.env.NEXT_PUBLIC_NODE_ENV = "production"
    expect(getHomeUrl("emailAddress")).toBe("https://home.deriv.com/dashboard/profile/email-address")
  })
})
