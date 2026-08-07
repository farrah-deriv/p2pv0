"use client"

import { useState } from "react"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as AuthAPI from "@/services/api/api-auth"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTranslations } from "@/lib/i18n/use-translations"

export default function LoginPage() {
  const { t } = useTranslations()
  const [step, setStep] = useState<"login" | "verification">("login")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [resendTimer, setResendTimer] = useState(59)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await AuthAPI.login({ email })

      if (response.code === "Success") {
        setVerificationMessage(response.message)
        setStep("verification")

        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(response.message || t("login.loginFailed"))
      }
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || t("login.failedToLogin"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    try {
      setIsLoading(true)
      setError("")

      const verificationData = {
        token: verificationCode,
        type: "email",
        email,
      }

      const response = await AuthAPI.verifyCode(verificationData)

      if (response) {
        if (response.access_token) localStorage.setItem("auth_token", response.access_token)

        if (response.user?.id) {
          useUserDataStore.getState().setClientId(response.user.id)
        }

        await AuthAPI.fetchUserIdAndStore()
        await AuthAPI.getSocketToken(response.access_token)

        window.location.href = "/"
      } else {
        setError(t("login.verificationFailed"))
      }
    } catch (error: any) {
      console.error("Verification failed:", error)
      setError(error.message || t("login.verifyFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    try {
      setError("")
      const response = await AuthAPI.login({ email })

      if (response.success) {
        setResendTimer(59)
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(response.message || t("login.failedToResendCode"))
      }
    } catch (error: any) {
      setError(error.message || t("login.failedToResendCodeTryAgain"))
    }
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setStep("login")} className="p-2 -ms-2">
            <BackArrowIcon alt={t("common.back")} width={24} height={24} />
            {t("common.back")}
          </Button>
        </div>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">{t("login.verification")}</h1>

          <p className="text-gray-600 mb-8">{verificationMessage}</p>
          <div className="mb-8">
            <Input
              type="text"
              placeholder={t("login.enterSixDigitCode")}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
            />
            {error && <p className="text-error mt-2 text-sm">{error}</p>}
          </div>
          <div className="text-center mb-8 space-y-2">
            <p className="text-gray-600">{t("login.didntReceiveCode")}</p>
            {resendTimer > 0 ? (
              <p className="text-gray-600">{t("login.resendCodeTimer", { seconds: resendTimer })}</p>
            ) : (
              <Button variant="ghost" onClick={handleResendCode} size="sm">
                {t("login.resendCode")}
              </Button>
            )}
          </div>
          <Button className="w-full" onClick={handleVerification} disabled={verificationCode.length !== 6 || isLoading}>
            {isLoading ? t("login.verifying") : t("login.verify")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto mt-12">
        <h1 className="text-4xl font-bold text-black mb-8">{t("login.welcomeBack")}</h1>
        <div className="mb-6">
          <label className="block text-gray-600 mb-3">{t("login.email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.emailPlaceholder")} />
          {error && <p className="text-error mt-2 text-sm">{error}</p>}
        </div>
        <Button onClick={handleLogin} disabled={!email.trim() || isLoading} className="w-full">
          {isLoading ? t("login.loggingIn") : t("login.logIn")}
        </Button>
        <div className="mt-[2rem] text-center">
          {t("login.noAccountYet")}{" "}
          <a className="text-primary" href="https://home.deriv.com/dashboard" target="_blank" rel="noopener noreferrer">
            {t("login.signUp")}
          </a>
        </div>
      </div>
    </div>
  )
}
