import { NextResponse, type NextRequest } from "next/server"

import { isLocalDev } from "@/lib/is-local-dev"

/**
 * Shared plumbing for the local-dev BFF proxies under `app/api/`.
 *
 * The browser only ever talks to `localhost`; these helpers make the
 * cross-origin request server-side (where CORS does not apply) and rewrite
 * `Set-Cookie` so the upstream session lands on the localhost origin.
 *
 * Every entry point is gated on `isLocalDev()` — deployed builds never reach
 * this code.
 */

/** Headers that describe a single hop and must not be forwarded upstream. */
const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

/**
 * Response headers we regenerate rather than copy. `set-cookie` is handled
 * separately so each cookie can be rewritten for localhost; the rest are
 * transport concerns owned by the dev server.
 */
const SKIP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "set-cookie",
  "transfer-encoding",
])

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"])

/** Reject anything that could escape the upstream path prefix. */
export function containsPathTraversal(path: string): boolean {
  const lowerPath = path.toLowerCase()
  if (lowerPath.includes("..") || lowerPath.includes("%2e")) return true

  try {
    return decodeURIComponent(path).includes("..")
  } catch {
    // A malformed escape sequence is not something we should pass upstream.
    return true
  }
}

/**
 * Resolve the upstream path for a catch-all proxy route.
 * Returns `null` when the path is missing or unsafe.
 */
export function getUpstreamPath(segments: string[] | undefined): string | null {
  const path = `/${(segments ?? []).join("/")}`
  if (containsPathTraversal(path)) return null

  return path
}

/**
 * Normalise a configured upstream base URL, or throw if it is unusable.
 * Trailing slashes are dropped so callers can concatenate a leading-slash path.
 */
export function getUpstreamBaseUrl(envName: string): string {
  const rawValue = process.env[envName]?.trim()
  if (!rawValue) {
    throw new Error(`Missing required env var: ${envName}`)
  }

  const url = new URL(rawValue)
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${envName} must be an absolute HTTP(S) URL`)
  }

  return url.toString().replace(/\/+$/, "")
}

/**
 * Drop the `Domain` attribute from a `Set-Cookie` value so the cookie binds to
 * the current (localhost) origin instead of `deriv.com`.
 *
 * `Secure` is deliberately kept: browsers treat `http://localhost` as a secure
 * context and will store `Secure` cookies from it, and `SameSite=None` is
 * invalid without `Secure`.
 */
export function stripCookieDomain(setCookieValue: string): string {
  return setCookieValue
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^domain=/i.test(part))
    .join("; ")
}

/**
 * Split a `Set-Cookie` value that folds several cookies into one header.
 *
 * Only a comma that starts a new `name=` pair separates cookies — the comma
 * inside an `Expires=Tue, 04 Aug 2026 ...` date must not split.
 */
function splitFoldedSetCookie(value: string): string[] {
  return value
    .split(/,(?=\s*[a-zA-Z0-9_.-]+=)/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Read `Set-Cookie` as a list, one entry per cookie.
 *
 * `Headers.getSetCookie()` is the spec-correct API, but Next.js's Edge Runtime
 * returns an empty array from it — and `.get("set-cookie")` returns `null` —
 * even when the upstream sent several `Set-Cookie` headers. Known, long-open:
 * https://github.com/vercel/next.js/issues/54033
 * https://github.com/vercel/next.js/issues/63170
 *
 * Iterating the `Headers` object is unaffected and yields one entry per
 * cookie, verified against a real multi-cookie Kratos response under that
 * runtime. Each value is still split defensively, because a runtime is
 * allowed to hand back several cookies folded into a single header value.
 */
export function getSetCookieLines(headers: Headers): string[] {
  const lines: string[] = []

  for (const [name, value] of headers) {
    if (name.toLowerCase() !== "set-cookie") continue
    lines.push(...splitFoldedSetCookie(value))
  }

  return lines
}

/** Copy request headers, minus the hop-by-hop ones. */
function buildUpstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  return headers
}

/** 404 used by every proxy route when not running `next dev`. */
export function notAvailableOutsideLocalDev(): NextResponse {
  return new NextResponse(null, { status: 404 })
}

/**
 * Proxy `request` to `${upstreamBaseUrl}${upstreamPath}`, preserving the query
 * string, and return the upstream response with cookies rewritten for
 * localhost. Redirects are passed through unfollowed so the browser decides.
 */
export async function proxyRequest(
  request: NextRequest,
  upstreamBaseUrl: string,
  upstreamPath: string,
): Promise<NextResponse> {
  const upstreamUrl = `${upstreamBaseUrl}${upstreamPath}${request.nextUrl.search}`

  const body = METHODS_WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer()

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: buildUpstreamHeaders(request),
    body: body && body.byteLength > 0 ? body : undefined,
    redirect: "manual",
  })

  const responseHeaders = new Headers()
  upstreamResponse.headers.forEach((value, key) => {
    if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return
    responseHeaders.set(key, value)
  })

  for (const line of getSetCookieLines(upstreamResponse.headers)) {
    responseHeaders.append("Set-Cookie", stripCookieDomain(line))
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

/**
 * Build the full set of HTTP method handlers for a catch-all proxy route.
 * Errors are surfaced as a 502 with the reason, since these only ever run on a
 * developer's machine and a silent failure is harder to debug.
 */
export function createProxyRouteHandlers(envName: string) {
  async function handle(
    request: NextRequest,
    context: { params: Promise<{ path?: string[] }> },
  ): Promise<NextResponse> {
    if (!isLocalDev()) return notAvailableOutsideLocalDev()

    const { path } = await context.params
    const upstreamPath = getUpstreamPath(path)
    if (!upstreamPath) {
      return NextResponse.json({ error: "Invalid proxy path" }, { status: 400 })
    }

    try {
      return await proxyRequest(request, getUpstreamBaseUrl(envName), upstreamPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown proxy error"
      console.error(`[dev-proxy] ${envName} ${request.method} ${upstreamPath} failed:`, message)
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  return {
    GET: handle,
    POST: handle,
    PUT: handle,
    PATCH: handle,
    DELETE: handle,
    HEAD: handle,
    OPTIONS: handle,
  }
}
