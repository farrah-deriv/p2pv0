import { getSocketUrl } from "@/lib/get-socket-url"

function setLocation(protocol: string, host: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, protocol, host, hostname: host.split(":")[0] },
  })
}

function setNodeEnv(value: string) {
  Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value })
}

describe("getSocketUrl", () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalEnv = { ...process.env }

  beforeEach(() => {
    setNodeEnv("production")
    process.env.NEXT_PUBLIC_SOCKET_URL = "wss://staging-api-core.deriv.com"
    setLocation("http:", "localhost:3000")
  })

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      setNodeEnv(originalNodeEnv)
    }
    if (originalEnv.NEXT_PUBLIC_SOCKET_URL === undefined) {
      delete process.env.NEXT_PUBLIC_SOCKET_URL
    } else {
      process.env.NEXT_PUBLIC_SOCKET_URL = originalEnv.NEXT_PUBLIC_SOCKET_URL
    }
  })

  it("uses the local upgrade proxy in development", () => {
    setNodeEnv("development")

    expect(getSocketUrl()).toBe("ws://localhost:3000/api/proxy/ws")
  })

  it("uses the configured upstream outside development", () => {
    expect(getSocketUrl()).toBe("wss://staging-api-core.deriv.com")
  })
})
