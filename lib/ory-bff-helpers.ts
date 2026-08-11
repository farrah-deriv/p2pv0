import type { NextResponse } from "next/server"

import { getSetCookieLines, getUpstreamBaseUrl, stripCookieDomain } from "@/lib/dev-proxy"

/**
 * Server-side helpers for the local-dev Ory Kratos login routes under
 * `app/api/ory/`. Local dev is single-environment, so the Ory base URL comes
 * straight from `NEXT_PUBLIC_ORY_URL` with no `.me` / `.be` branching.
 */

export interface KratosFlowNode {
  attributes: { name: string; value?: string }
  messages: Array<{ type: string; text: string }>
}

export interface KratosFlow {
  id: string
  state?: string
  ui?: {
    nodes?: KratosFlowNode[]
    messages?: Array<{ type: string; text: string }>
  }
}

export function getOryBaseUrl(): string {
  return getUpstreamBaseUrl("NEXT_PUBLIC_ORY_URL")
}

/**
 * Parse a JSON request body, returning `null` instead of throwing on malformed
 * input — a bad body is a client error (400), not a server error (500).
 */
export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function extractCsrfToken(flow: KratosFlow): string {
  return flow.ui?.nodes?.find((node) => node.attributes.name === "csrf_token")?.attributes?.value ?? ""
}

/**
 * Collapse an upstream response's cookies into a single `Cookie` request header,
 * so a follow-up server-side call can continue the same Kratos flow.
 */
export function getSetCookieNameValueHeader(response: Response): string {
  return getSetCookieLines(response.headers)
    .map((line) => line.split(";")[0].trim())
    .filter(Boolean)
    .join("; ")
}

/** Forward an upstream response's cookies to the browser, rebound to localhost. */
export function forwardSetCookies(response: NextResponse, upstream: Response): void {
  for (const line of getSetCookieLines(upstream.headers)) {
    response.headers.append("Set-Cookie", stripCookieDomain(line))
  }
}

export interface LoginFlowStart {
  flowId: string
  csrfToken: string
  /** Cookie header to send with the next step of this flow. */
  cookie: string
  /** The flow-init response, so callers can forward its cookies to the browser. */
  response: Response
}

/**
 * Open a login flow.
 *
 * Matches home-app's proven-working call sequence against this same staging
 * Kratos (`src/lib/api/kratos-client.ts`): a single
 * `GET .../login/browser` followed directly by one
 * `POST .../login?flow=<id>` with `method: "password"` or `"code"`. There is
 * no `identifier_first` pre-step — home-app has zero call sites for it, and
 * submitting `password`/`code` straight to a fresh flow is what production
 * actually does.
 *
 * Deliberately does NOT forward the browser's incoming `Cookie` header on
 * this call: this always starts a brand-new flow, and the browser's cookie
 * jar for `localhost` can only ever hold a Domain-rewritten cookie from an
 * earlier attempt — a value Kratos never issued for its own domain. Sending
 * it back confuses Kratos's cookie freshness handling, which is what caused
 * every retry after the first to come back with `security_csrf_violation:
 * The HTTP Cookie Header is empty or not set` even though this exact GET,
 * issued cold (e.g. via curl), reliably returns a fresh Set-Cookie.
 */
export async function startLoginFlow(
  authBase: string,
  timeoutMs: number,
): Promise<LoginFlowStart | { error: Response }> {
  const flowRes = await fetch(`${authBase}/self-service/login/browser`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!flowRes.ok) return { error: flowRes }

  const flow = (await flowRes.json()) as KratosFlow

  return {
    flowId: flow.id,
    csrfToken: extractCsrfToken(flow),
    cookie: getSetCookieNameValueHeader(flowRes),
    response: flowRes,
  }
}

/** Collect the error messages Kratos attaches to a flow's UI nodes and body. */
export function extractFlowErrorText(flow: {
  ui?: {
    nodes?: Array<{ messages: Array<{ type: string; text: string }> }>
    messages?: Array<{ type: string; text: string }>
  }
}): string {
  const nodeErrors = (flow?.ui?.nodes ?? []).flatMap((node) => node.messages).filter((message) => message.type === "error")
  const uiErrors = (flow?.ui?.messages ?? []).filter((message) => message.type === "error")

  return nodeErrors[0]?.text ?? uiErrors[0]?.text ?? ""
}
