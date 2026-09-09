"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  buildLocalDevLoginIdentifier,
  type LocalDevLoginMethod,
} from "@/lib/local-dev-login-identifier"
import { cn } from "@/lib/utils"

type Step = "identifier" | "password" | "verification"

const RESEND_SECONDS = 59

/**
 * Only same-origin or Deriv-owned hosts may be used as a post-login redirect,
 * so a manipulated `redirect_browser_to` cannot send the developer off-site.
 */
function isAllowedBrowserRedirect(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false

  try {
    const url = new URL(value, window.location.origin)
    const hostname = url.hostname.toLowerCase()
    const isDerivHost =
      hostname === "deriv.com" ||
      hostname === "deriv.be" ||
      hostname === "deriv.me" ||
      hostname.endsWith(".deriv.com") ||
      hostname.endsWith(".deriv.be") ||
      hostname.endsWith(".deriv.me")

    const isSameOrigin = url.origin === window.location.origin

    return isSameOrigin || (isDerivHost && url.protocol === "https:")
  } catch {
    return false
  }
}

/**
 * Local-dev only login form.
 *
 * Talks to the Kratos BFF routes under `app/api/ory/`, which rebind the session
 * cookie to the localhost origin. The dev-only gate lives in the server
 * component at `app/login/page.tsx` so a deployed build returns a real 404.
 */
export function LoginForm() {
  const { t } = useTranslations()
  const [step, setStep] = useState<Step>("identifier")
  const [loginMethod, setLoginMethod] = useState<LocalDevLoginMethod>("email")
  const [email, setEmail] = useState("")
  const [dialCode, setDialCode] = useState("+60")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [flowId, setFlowId] = useState("")
  const [csrfToken, setCsrfToken] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const identifier = useMemo(
    () =>
      buildLocalDevLoginIdentifier({
        method: loginMethod,
        email,
        dialCode,
        phoneNumber,
      }),
    [dialCode, email, loginMethod, phoneNumber],
  )

  const canContinue = loginMethod === "email" ? email.trim().length > 0 : identifier.length > 0

  const clearResendTimer = useCallback(() => {
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current)
      resendIntervalRef.current = null
    }
  }, [])

  useEffect(() => clearResendTimer, [clearResendTimer])

  const startResendTimer = useCallback(() => {
    clearResendTimer()
    setResendTimer(RESEND_SECONDS)
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          clearResendTimer()
          return 0
        }
        return previous - 1
      })
    }, 1000)
  }, [clearResendTimer])

  const completeLogin = (redirectTo: unknown) => {
    window.location.href = isAllowedBrowserRedirect(redirectTo) ? redirectTo : "/"
  }

  const handlePasswordLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/ory/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error_code === "incorrect_credentials"
            ? t("login.incorrectCredentialsIdentifier")
            : t("login.loginFailed"),
        )
        return
      }

      completeLogin(data.redirect_browser_to)
    } catch {
      setError(t("login.failedToLogin"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/ory/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t("login.failedToSendCode"))
        return
      }

      setFlowId(data.flow_id)
      setCsrfToken(data.csrf_token)
      setVerificationCode("")
      setStep("verification")
      startResendTimer()
    } catch {
      setError(t("login.failedToSendCode"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/ory/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          flow_id: flowId,
          csrf_token: csrfToken,
          code: verificationCode,
        }),
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t("login.verificationFailed"))
        return
      }

      completeLogin(data.redirect_browser_to)
    } catch {
      setError(t("login.verifyFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const errorMessage = error ? <p className="mt-2 text-sm text-error text-start">{error}</p> : null

  const backButton = (onClick: () => void) => (
    <div className="mb-8 flex items-center">
      <Button variant="ghost" onClick={onClick} className="-ms-2 p-2">
        <BackArrowIcon alt={t("common.back")} width={24} height={24} />
        {t("common.back")}
      </Button>
    </div>
  )

  const otpButtonLabel =
    loginMethod === "phone" ? t("login.usePhoneCode") : t("login.useEmailCode")

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        {backButton(() => setStep("password"))}
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-3xl font-bold text-foreground text-start">{t("login.verification")}</h1>
          <p className="mb-8 text-muted-foreground text-start">{t("login.enterSixDigitCode")}</p>
          <div className="mb-8">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={t("login.enterSixDigitCode")}
              placeholder={t("login.enterSixDigitCode")}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
            />
            {errorMessage}
          </div>
          <div className="mb-8 space-y-2 text-center">
            <p className="text-muted-foreground">{t("login.didntReceiveCode")}</p>
            {resendTimer > 0 ? (
              <p className="text-muted-foreground">{t("login.resendCodeTimer", { seconds: resendTimer })}</p>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleRequestOtp} disabled={isLoading}>
                {t("login.resendCode")}
              </Button>
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleVerifyOtp}
            disabled={verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? t("login.verifying") : t("login.verify")}
          </Button>
        </div>
      </div>
    )
  }

  if (step === "password") {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        {backButton(() => setStep("identifier"))}
        <div className="mx-auto max-w-md">
          <h1 className="mb-8 text-3xl font-bold text-foreground text-start">{t("login.welcomeBack")}</h1>
          <div className="mb-6">
            <label className="mb-3 block text-muted-foreground text-start" htmlFor="login-password">
              {t("login.password")}
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("login.passwordPlaceholder")}
            />
            {errorMessage}
          </div>
          <Button className="w-full" onClick={handlePasswordLogin} disabled={!password || isLoading}>
            {isLoading ? t("login.loggingIn") : t("login.logIn")}
          </Button>
          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" onClick={handleRequestOtp} disabled={isLoading}>
              {otpButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto mt-12 max-w-md">
        <h1 className="mb-8 text-4xl font-bold text-foreground text-start">{t("login.welcomeBack")}</h1>

        <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1" role="tablist" aria-label={t("login.emailOrPhoneNumber")}>
          <Button
            type="button"
            variant={loginMethod === "email" ? "default" : "ghost"}
            className={cn("flex-1", loginMethod !== "email" && "bg-transparent")}
            onClick={() => {
              setLoginMethod("email")
              setError("")
            }}
            role="tab"
            aria-selected={loginMethod === "email"}
            data-testid="login-tab-email"
          >
            {t("login.loginWithEmail")}
          </Button>
          <Button
            type="button"
            variant={loginMethod === "phone" ? "default" : "ghost"}
            className={cn("flex-1", loginMethod !== "phone" && "bg-transparent")}
            onClick={() => {
              setLoginMethod("phone")
              setError("")
            }}
            role="tab"
            aria-selected={loginMethod === "phone"}
            data-testid="login-tab-phone"
          >
            {t("login.loginWithPhone")}
          </Button>
        </div>

        {loginMethod === "email" ? (
          <div className="mb-6">
            <label className="mb-3 block text-muted-foreground text-start" htmlFor="login-email">
              {t("login.email")}
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("login.emailPlaceholder")}
              data-testid="login-input-email"
            />
            {errorMessage}
          </div>
        ) : (
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-3 block text-muted-foreground text-start" htmlFor="login-dial-code">
                {t("login.countryCode")}
              </label>
              <Input
                id="login-dial-code"
                type="tel"
                autoComplete="tel-country-code"
                inputMode="tel"
                value={dialCode}
                onChange={(event) => setDialCode(event.target.value)}
                placeholder={t("login.countryCodePlaceholder")}
                data-testid="login-input-dial-code"
              />
            </div>
            <div>
              <label className="mb-3 block text-muted-foreground text-start" htmlFor="login-phone">
                {t("login.phoneNumber")}
              </label>
              <Input
                id="login-phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value.replace(/[^\d\s]/g, ""))}
                placeholder={t("login.phonePlaceholder")}
                data-testid="login-input-phone"
              />
            </div>
            {errorMessage}
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => {
            setError("")
            setStep("password")
          }}
          disabled={!canContinue}
          data-testid="login-btn-continue"
        >
          {t("common.continue")}
        </Button>
      </div>
    </div>
  )
}
