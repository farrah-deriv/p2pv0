import {
  extractCsrfToken,
  extractFlowErrorText,
  getSetCookieNameValueHeader,
  readJsonBody,
  type KratosFlow,
} from "@/lib/ory-bff-helpers"

describe("extractCsrfToken", () => {
  it("reads the csrf_token node value", () => {
    const flow: KratosFlow = {
      id: "f1",
      ui: { nodes: [{ attributes: { name: "csrf_token", value: "tok-123" }, messages: [] }] },
    }

    expect(extractCsrfToken(flow)).toBe("tok-123")
  })

  it("returns an empty string when absent", () => {
    expect(extractCsrfToken({ id: "f1" })).toBe("")
  })
})

describe("extractFlowErrorText", () => {
  it("prefers a node-level error message", () => {
    const flow = {
      ui: {
        nodes: [{ messages: [{ type: "error", text: "node boom" }] }],
        messages: [{ type: "error", text: "ui boom" }],
      },
    }

    expect(extractFlowErrorText(flow)).toBe("node boom")
  })

  it("falls back to a ui-level error message", () => {
    expect(extractFlowErrorText({ ui: { messages: [{ type: "error", text: "ui boom" }] } })).toBe("ui boom")
  })

  it("ignores non-error messages", () => {
    expect(extractFlowErrorText({ ui: { messages: [{ type: "info", text: "just info" }] } })).toBe("")
  })
})

describe("getSetCookieNameValueHeader", () => {
  // Real `Response` objects on purpose: this reads cookies by iterating the
  // header list, so an object literal without `Symbol.iterator` would throw
  // instead of exercising the real path.
  it("collapses upstream cookies into a single Cookie header", () => {
    const response = new Response(null, {
      headers: [
        ["set-cookie", "csrf_token_x=abc; Path=/; Domain=deriv.com; HttpOnly"],
        ["set-cookie", "__cflb=zzz; Path=/"],
      ],
    })

    expect(getSetCookieNameValueHeader(response)).toBe("csrf_token_x=abc; __cflb=zzz")
  })

  it("drops cookie attributes, keeping only name=value pairs", () => {
    const response = new Response(null, {
      headers: [["set-cookie", "a=1; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=None"]],
    })

    expect(getSetCookieNameValueHeader(response)).toBe("a=1")
  })

  it("returns an empty string when the response sets no cookies", () => {
    const response = new Response(null, { headers: { "content-type": "application/json" } })

    expect(getSetCookieNameValueHeader(response)).toBe("")
  })
})

describe("readJsonBody", () => {
  const postBody = (body: string) => new Request("http://localhost/api/ory/login", { method: "POST", body })

  it("parses a valid JSON body", async () => {
    await expect(readJsonBody<{ email: string }>(postBody(JSON.stringify({ email: "a@b.c" })))).resolves.toEqual({
      email: "a@b.c",
    })
  })

  it("returns null for a malformed body so callers can answer 400 rather than 500", async () => {
    await expect(readJsonBody(postBody("{not json"))).resolves.toBeNull()
  })

  it("returns null for an empty body", async () => {
    await expect(readJsonBody(postBody(""))).resolves.toBeNull()
  })
})
