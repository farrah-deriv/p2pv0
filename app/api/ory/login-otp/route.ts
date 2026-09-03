import { NextResponse, type NextRequest } from "next/server"

import { notAvailableOutsideLocalDev } from "@/lib/dev-proxy"
import { isLocalDev } from "@/lib/is-local-dev"
import {
  extractCsrfToken,
  extractFlowErrorText,
  forwardSetCookies,
  getOryBaseUrl,
  readJsonBody,
  startLoginFlow,
  type KratosFlow,
} from "@/lib/ory-bff-helpers"
import { readLoginIdentifier } from "@/lib/ory-login-request-body"

// next-on-pages requires every route handler to run on the edge runtime.
export const runtime = "edge"

const FETCH_TIMEOUT_MS = 15_000

/**
 * Local-dev only: request an email OTP from Ory Kratos.
 *
 * Returns the flow id and CSRF token, which the client passes back to
 * `/api/ory/verify-login-otp` along with the code. Returns 404 in any built
 * artifact.
 *
 * Call sequence matches home-app's proven-working implementation
 * (`src/lib/api/kratos-client.ts`) against this same staging Kratos: a single
 * flow-init GET followed by one `method: "code"` POST — no `identifier_first`
 * step.
 */
export async function POST(request: NextRequest) {
  if (!isLocalDev()) return notAvailableOutsideLocalDev()

  try {
    const body = await readJsonBody<{ email?: string; identifier?: string }>(request)
    const identifier = readLoginIdentifier(body)
    if (!identifier) {
      return NextResponse.json({ error_code: "invalid_request" }, { status: 400 })
    }

    const authBase = getOryBaseUrl()

    const started = await startLoginFlow(authBase, FETCH_TIMEOUT_MS)
    if ("error" in started) {
      const errBody = await started.error.json().catch(() => ({}))
      return NextResponse.json(errBody, { status: started.error.status })
    }

    const submitRes = await fetch(`${authBase}/self-service/login?flow=${started.flowId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(started.cookie ? { Cookie: started.cookie } : {}),
      },
      body: JSON.stringify({ csrf_token: started.csrfToken, method: "code", identifier }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    const submitData = (await submitRes.json()) as KratosFlow
    const state = submitData?.state
    const otpSent = state === "sent_email" || state === "sent_sms" || state === "sent_message" || submitRes.ok
    const upstreams = [started.response, submitRes]

    if (otpSent) {
      // Kratos rotates the CSRF token when it advances the flow.
      const response = NextResponse.json({
        flow_id: submitData?.id || started.flowId,
        csrf_token: extractCsrfToken(submitData) || started.csrfToken,
      })
      upstreams.forEach((upstream) => forwardSetCookies(response, upstream))
      return response
    }

    const errorText = extractFlowErrorText(submitData)
    const response = NextResponse.json(
      {
        error_code: errorText ? "ory_auth_flow_error" : "otp_send_failed",
        ...(errorText ? { error: errorText } : {}),
      },
      { status: 400 },
    )
    upstreams.forEach((upstream) => forwardSetCookies(response, upstream))
    return response
  } catch (error) {
    console.error("[api/ory/login-otp] failed:", error)
    return NextResponse.json({ error_code: "unexpected" }, { status: 500 })
  }
}
