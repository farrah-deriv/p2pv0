import { getOryUrl } from "@/lib/get-ory-url"
import { extractCsrfToken, extractFlowErrorText, type KratosFlow } from "@/lib/ory-flow-parsing"

export interface ElevationFlow {
  flowId: string
  csrfToken: string
  identifier: string
  isPhone: boolean
}

export class SessionElevationError extends Error {
  constructor(
    message: string,
    readonly code: "attempt_cap" | "totp_required" | "unavailable" | "failed" = "failed",
  ) {
    super(message)
  }
}

const isOtpSent = (flow: KratosFlow) =>
  flow.state === "sent_email" || flow.state === "sent_sms" || flow.state === "sent_message"

const request = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, credentials: "include", headers: { Accept: "application/json", ...init?.headers } })

async function responseFlow(response: Response, acceptOtpSent = false): Promise<KratosFlow> {
  const flow = (await response.json().catch(() => ({}))) as KratosFlow
  const flowError = extractFlowErrorText(flow)
  if (response.status === 429 || flowError.includes("4000001")) {
    throw new SessionElevationError("Too many verification attempts", "attempt_cap")
  }
  if (flowError.includes("4000037") || flowError.toLowerCase().includes("aal2")) {
    throw new SessionElevationError("Authenticator verification is required", "totp_required")
  }
  // Kratos intentionally answers the code-send submit with 400 while the
  // flow is active. `sent_email` / `sent_sms` is its success signal.
  if (acceptOtpSent && isOtpSent(flow)) return flow
  if (!response.ok) {
    throw new SessionElevationError(flowError || "Unable to verify your identity")
  }
  return flow
}

const browserLanguage = () => (typeof document === "undefined" ? "en" : document.documentElement.lang || "en")

export async function startElevation(identifier: string, action: string, isPhone = false): Promise<ElevationFlow> {
  const baseUrl = getOryUrl()
  const flowResponse = await request(`${baseUrl}/self-service/login/browser?refresh=true`)
  const flow = await responseFlow(flowResponse)
  const csrfToken = extractCsrfToken(flow)
  if (!csrfToken) throw new SessionElevationError("Unable to start verification")

  const sentResponse = await request(`${baseUrl}/self-service/login?flow=${encodeURIComponent(flow.id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csrf_token: csrfToken,
      method: "code",
      identifier,
      transient_payload: { action, lang: browserLanguage() },
    }),
  })
  const sentFlow = await responseFlow(sentResponse, true)
  if (!isOtpSent(sentFlow)) throw new SessionElevationError("Unable to send a verification code")
  return { flowId: flow.id, csrfToken, identifier, isPhone }
}

export async function verifyElevation(flow: ElevationFlow, code: string, action: string): Promise<void> {
  const response = await request(`${getOryUrl()}/self-service/login?flow=${encodeURIComponent(flow.flowId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csrf_token: flow.csrfToken,
      method: "code",
      identifier: flow.identifier,
      code,
      transient_payload: { action, lang: browserLanguage() },
    }),
  })
  await responseFlow(response)
}

/** Email is preferred; the verified Ory phone is a fallback identifier. */
export async function getElevationPhone(): Promise<string | null> {
  const response = await request(`${getOryUrl()}/sessions/whoami`)
  if (!response.ok) return null
  const session = (await response.json()) as { identity?: { verifiable_addresses?: Array<{ via?: string; value?: string; verified?: boolean }> } }
  return session.identity?.verifiable_addresses?.find((address) => address.via === "phone" && address.verified)?.value ?? null
}
