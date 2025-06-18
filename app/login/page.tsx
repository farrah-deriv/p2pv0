"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import * as AuthAPI from "@/services/api/api-auth"

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "verification">("login")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [resendTimer, setResendTimer] = useState(59)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await AuthAPI.login({ email })

      if (response.code === "Success") {
        setVerificationMessage(response.message);
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
        setError(response.message || "Login failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || "Failed to login. Please try again.")
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

      const response = await AuthAPI.verifyCode(verificationData);

      if (response.access_token) {
        localStorage.setItem("auth_token", response.access_token)

        await AuthAPI.fetchUserIdAndStore()
        await AuthAPI.getSocketToken(response.access_token)

        window.location.href = "/"
        
      } else {
        setError("Verification failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Verification failed:", error)
      setError(error.message || "Failed to verify code. Please try again.")
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
        setError(response.message || "Failed to resend code.")
      }
    } catch (error: any) {
      setError(error.message || "Failed to resend code. Please try again.")
    }
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setStep("login")} className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
            Back
          </Button>
        </div>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Verification</h1>

          <p className="text-gray-600 mb-8">
            {verificationMessage}
          </p>
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
            />
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>
          <div className="text-center mb-8 space-y-2">
            <p className="text-gray-600">{"Didn't receive the code?"}</p>
            {resendTimer > 0 ? (
              <p className="text-gray-600">Resend code ({resendTimer}s)</p>
            ) : (
              <Button variant="ghost" onClick={handleResendCode} size="sm">
                Resend code
              </Button>
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleVerification}
            disabled={verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto mt-12">
        <h1 className="text-4xl font-bold text-black mb-8">Welcome back!</h1>
        <div className="mb-6">
          <label className="block text-gray-600 mb-3">Email</label>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
        <Button
          onClick={handleLogin}
          disabled={!email.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </div>
    </div>
  )
}
