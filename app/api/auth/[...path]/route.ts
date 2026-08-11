import { createProxyRouteHandlers } from "@/lib/dev-proxy"

// next-on-pages requires every route handler to run on the edge runtime.
export const runtime = "edge"

/**
 * Local-dev only proxy to Ory Kratos (`NEXT_PUBLIC_ORY_URL`).
 *
 * `getOryUrl()` points the browser here when running `next dev`. Two reasons:
 * Ory omits `access-control-allow-origin` for `localhost`, and its cookies come
 * back scoped to `Domain=deriv.com`, which a localhost origin cannot store.
 *
 * Covers `/sessions/whoami`, the `/self-service/*` flows, and the
 * `recovery_link` target used by the `?token=` test-link flow. Returns 404 in
 * any built artifact.
 */
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyRouteHandlers("NEXT_PUBLIC_ORY_URL")
