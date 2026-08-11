import { createProxyRouteHandlers } from "@/lib/dev-proxy"

// next-on-pages requires every route handler to run on the edge runtime.
export const runtime = "edge"

/**
 * Local-dev only proxy to the Core API (`NEXT_PUBLIC_CORE_URL`).
 *
 * `getCoreUrl()` points the browser here when running `next dev`, because the
 * Core API answers CORS preflights from `localhost` with a 403. Returns 404 in
 * any built artifact.
 *
 * Cookies are rewritten for localhost on the way back, so any `Set-Cookie` the
 * Core API issues binds to the dev origin rather than `deriv.com`.
 */
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyRouteHandlers("NEXT_PUBLIC_CORE_URL")
