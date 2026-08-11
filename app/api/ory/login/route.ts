import { NextResponse, type NextRequest } from "next/server"

import { notAvailableOutsideLocalDev } from "@/lib/dev-proxy"
import { isLocalDev } from "@/lib/is-local-dev"
import {
  extractFlowErrorText,
  forwardSetCookies,
  getOryBaseUrl,
  readJsonBody,
  startLoginFlow,
} from "@/lib/ory-bff-helpers"

// next-on-pages requires every route handler to run on the edge runtime.
export const runtime = "edge"

const FETCH_TIMEOUT_MS = 15_000

interface KratosLoginResponse {
  session?: unknown
  redirect_browser_to?: string
  error?: { id?: string }
  ui?: {
    nodes?: Array<{ attributes: { name: string; value?: string }; messages: Array<{ type: string; text: string }> }>
    messages?: Array<{ type: string; text: string }>
  }
}

/**
 * Local-dev only: email + password login against Ory Kratos.
 *
 * Runs the browser login flow server-side so the resulting session cookie can be
 * rebound to the localhost origin. Returns 404 in any built artifact.
 *
 * Call sequence matches home-app's proven-working implementation
 * (`src/lib/api/kratos-client.ts`) against this same staging Kratos: a single
 * flow-init GET followed by one `method: "password"` POST — no
 * `identifier_first` step.
 */
export async function POST(request: NextRequest) {
  if (!isLocalDev()) return notAvailableOutsideLocalDev()

  try {
    const body = await readJsonBody<{ email?: string; password?: string }>(request)
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json({ error_code: "invalid_request" }, { status: 400 })
    }

    const authBase = getOryBaseUrl()

    const started = await startLoginFlow(authBase, FETCH_TIMEOUT_MS)
    if ("error" in started) {
      const errBody = await started.error.json().catch(() => ({}))
      console.error("[api/ory/login] flow start failed:", started.error.status, errBody)
      return NextResponse.json(errBody, { status: started.error.status })
    }

    const loginRes = await fetch(`${authBase}/self-service/login?flow=${started.flowId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(started.cookie ? { Cookie: started.cookie } : {}),
      },
      body: JSON.stringify({
        csrf_token: started.csrfToken,
        method: "password",
        identifier: email,
        password,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    const loginData = (await loginRes.json()) as KratosLoginResponse
    const redirectTo = typeof loginData.redirect_browser_to === "string" ? loginData.redirect_browser_to.trim() : ""

    // Kratos answers a successful browser flow with 422 + `redirect_browser_to`,
    // expecting the browser to continue there. That is a success, not an error.
    const isBrowserContinuation =
      !loginRes.ok &&
      redirectTo !== "" &&
      (loginRes.status === 422 || loginData.error?.id === "browser_location_change_required")

    const upstreams = [started.response, loginRes]

    if (loginRes.ok || isBrowserContinuation) {
      const response = NextResponse.json({
        session: loginData.session ?? null,
        redirect_browser_to: redirectTo || null,
      })
      upstreams.forEach((upstream) => forwardSetCookies(response, upstream))
      return response
    }

    const errorText = extractFlowErrorText(loginData)
    const response = NextResponse.json(
      { error_code: "incorrect_credentials", ...(errorText ? { error: errorText } : {}) },
      { status: 401 },
    )
    upstreams.forEach((upstream) => forwardSetCookies(response, upstream))
    return response
  } catch (error) {
    console.error("[api/ory/login] failed:", error)
    return NextResponse.json({ error_code: "unexpected" }, { status: 500 })
  }
}
