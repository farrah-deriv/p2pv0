import { NextResponse, type NextRequest } from "next/server"

import { notAvailableOutsideLocalDev } from "@/lib/dev-proxy"
import { isLocalDev } from "@/lib/is-local-dev"
import { extractFlowErrorText, forwardSetCookies, getOryBaseUrl, readJsonBody } from "@/lib/ory-bff-helpers"

// next-on-pages requires every route handler to run on the edge runtime.
export const runtime = "edge"

const FETCH_TIMEOUT_MS = 15_000

interface KratosCodeResponse {
  state?: string
  session?: unknown
  redirect_browser_to?: string
  ui?: {
    nodes?: Array<{ attributes: { name: string; value?: string }; messages: Array<{ type: string; text: string }> }>
    messages?: Array<{ type: string; text: string }>
  }
}

/**
 * Local-dev only: submit the email OTP to complete the Kratos login flow.
 * The resulting session cookie is rebound to the localhost origin. Returns 404
 * in any built artifact.
 */
export async function POST(request: NextRequest) {
  if (!isLocalDev()) return notAvailableOutsideLocalDev()

  try {
    const body = await readJsonBody<{
      email?: string
      flow_id?: string
      csrf_token?: string
      code?: string
    }>(request)
    const identifier = typeof body?.email === "string" ? body.email.trim() : ""
    const flowId = body?.flow_id
    const csrfToken = body?.csrf_token
    const code = body?.code

    if (!identifier || !flowId || !code) {
      return NextResponse.json({ error_code: "invalid_request" }, { status: 400 })
    }

    const authBase = getOryBaseUrl()
    const browserCookie = request.headers.get("cookie")?.trim() ?? ""

    const loginRes = await fetch(`${authBase}/self-service/login?flow=${flowId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(browserCookie ? { Cookie: browserCookie } : {}),
      },
      body: JSON.stringify({ csrf_token: csrfToken ?? "", method: "code", code, identifier }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    const data = (await loginRes.json()) as KratosCodeResponse

    if (loginRes.ok) {
      const response = NextResponse.json({
        session: data.session,
        redirect_browser_to: data.redirect_browser_to ?? null,
      })
      forwardSetCookies(response, loginRes)
      return response
    }

    const errorText = extractFlowErrorText(data)
    const response = NextResponse.json(
      errorText
        ? { error_code: "ory_auth_flow_error", error: errorText }
        : { error_code: "otp_invalid_or_expired" },
      { status: 400 },
    )
    forwardSetCookies(response, loginRes)
    return response
  } catch (error) {
    console.error("[api/ory/verify-login-otp] failed:", error)
    return NextResponse.json({ error_code: "unexpected" }, { status: 500 })
  }
}
