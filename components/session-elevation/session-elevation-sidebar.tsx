"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { PanelWrapper } from "@/components/ui/panel-wrapper"
import { Button } from "@/components/ui/button"
import { InputOTP } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { useTranslations } from "@/lib/i18n/use-translations"
import { getElevationPhone, SessionElevationError, startElevation, type ElevationFlow, verifyElevation } from "@/services/api/api-session-elevation"
import { useSessionElevationStore } from "@/stores/session-elevation-store"
import { useUserDataStore } from "@/stores/user-data-store"

const RESEND_SECONDS = 59

export function SessionElevationSidebar() {
  const { t } = useTranslations()
  const userData = useUserDataStore((state) => state.userData)
  const isOpen = useSessionElevationStore((state) => state.isOpen)
  const action = useSessionElevationStore((state) => state.action)
  const close = useSessionElevationStore((state) => state.close)
  const complete = useSessionElevationStore((state) => state.complete)
  const [flow, setFlow] = useState<ElevationFlow | null>(null)
  const [code, setCode] = useState("")
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [attemptCap, setAttemptCap] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const emailRef = useRef(userData?.email)
  const actionRef = useRef(action)

  const clearTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setSeconds(RESEND_SECONDS)
    timer.current = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearTimer()
          return 0
        }
        return current - 1
      })
    }, 1000)
  }, [clearTimer])

  const send = useCallback(async () => {
    const elevationAction = actionRef.current
    if (!elevationAction) return
    startTimer()
    setIsSending(true)
    setError(null)
    setAttemptCap(false)
    setCode("")
    try {
      const email = emailRef.current?.trim()
      const identifier = email || (await getElevationPhone())
      if (!identifier) throw new SessionElevationError("No verification factor is available", "unavailable")
      setFlow(await startElevation(identifier, elevationAction, !email))
    } catch (caught) {
      setFlow(null)
      setError(caught instanceof SessionElevationError && caught.code === "attempt_cap" ? t("sessionElevation.tooManyAttempts") : t("sessionElevation.sendFailed"))
    } finally {
      setIsSending(false)
    }
  }, [startTimer, t])

  useEffect(() => {
    if (isOpen) {
      // Capture the factor once per elevation request. Changes to profile data
      // while the panel is open must not silently send another OTP.
      emailRef.current = userData?.email
      actionRef.current = action
      void send()
    }
    else clearTimer()
    return clearTimer
    // The elevation request is initiated only when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const verify = async (value: string) => {
    if (!flow || isVerifying || attemptCap) return
    setIsVerifying(true)
    setError(null)
    try {
      await verifyElevation(flow, value, action!)
      await complete()
    } catch (caught) {
      const capped = caught instanceof SessionElevationError && caught.code === "attempt_cap"
      setAttemptCap(capped)
      setCode("")
      const totpRequired = caught instanceof SessionElevationError && caught.code === "totp_required"
      setError(capped ? t("sessionElevation.tooManyAttempts") : totpRequired ? t("sessionElevation.totpRequired") : t("sessionElevation.invalidCode"))
    } finally {
      setIsVerifying(false)
    }
  }

  if (!isOpen) return null

  return (
    <PanelWrapper onClose={isVerifying ? () => {} : close} layerClassName="z-[60]">
      <div className="relative flex flex-1 flex-col overflow-auto px-6 pb-6 pt-3 text-start">
        <h2 className="mb-2 text-2xl font-bold text-slate-1200">{t("sessionElevation.title")}</h2>
        <p className="mb-8 text-sm text-grayscale-600">{t("sessionElevation.description")}</p>
        <div dir="ltr">
          <InputOTP
            length={6}
            value={code}
            onChange={(value) => {
              setCode(value)
              setError(null)
              if (value.length === 6) void verify(value)
            }}
            disabled={isSending || isVerifying || attemptCap || !flow}
            status={error ? "error" : "neutral"}
          />
        </div>
        {error && <p className="mt-3 text-start text-xs text-error">{error}</p>}
        <div className="mt-8">
          <p className="text-sm text-grayscale-600">{t("sessionElevation.resendPrompt")}</p>
          {seconds > 0 ? (
            <p className="mt-2 text-sm text-grayscale-600">{t("login.resendCodeTimer", { seconds })}</p>
          ) : (
            <Button variant="ghost" size="sm" className="mt-1 p-0 font-normal text-grayscale-600 underline hover:bg-transparent" onClick={() => void send()} disabled={isSending || isVerifying}>
              {t("login.resendCode")}
            </Button>
          )}
        </div>
        {isVerifying && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" aria-busy="true">
            <Spinner size="lg" />
          </div>
        )}
        </div>
    </PanelWrapper>
  )
}
