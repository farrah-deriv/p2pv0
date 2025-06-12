import { API, AUTH } from "@/lib/local-variables"

export interface LoginRequest {
  email: string
}

export interface LoginResponse {
  code: string
  message: string
}

export interface VerificationRequest {
  token: string
  type: string
  email: string
}

export interface VerificationResponse {
  access_token?: string
  user?: {
    id: string
    email?: string
  }
}

/**
 * Initiate login with email
 */
export async function login(email: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API.coreUrl}/login`, {
      method: "POST",
      body: JSON.stringify(email),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data[0];
  } catch (error) {
    console.error("Login error:", error)
    throw new Error("Failed to login. Please try again.")
  }
}

/**
 * Verify the code sent to email
 */
export async function verifyCode(verificationData: VerificationRequest): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API.coreUrl}/verify`, {
      method: "POST",
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data[0]
  } catch (error) {
    console.error("Verification error:", error)
    throw new Error("Failed to verify code. Please try again.")
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("auth_token")
}

/**
 * Get the authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      localStorage.removeItem("user_id")
      localStorage.removeItem("socket_token")

      window.location.href = "/"
    }
  } catch (error) {
    console.error("Logout error:", error)
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Fetch user data and store user_id in localStorage
 */
export async function fetchUserIdAndStore(): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) throw new Error("No auth token found")

    const response = await fetch(`${API.baseUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Branch": "development",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`)
    }

    const result = await response.json()
    const userId = result?.data?.id

    if (userId) {
      localStorage.setItem("user_id", userId.toString())
    }
  } catch (error) {
    console.error("Error fetching user ID:", error)
  }
}

/**
 * Get websocket token
 */
export async function getSocketToken(): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) throw new Error("No auth token found")

    const response = await fetch(`${API.baseUrl}/user-websocket-token`, {
      method: "GET",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`)
    }

    const result = await response.json()
    const socketToken = result?.data

    if (socketToken) {
      localStorage.setItem("socket_token", socketToken.toString())
    }
  } catch (error) {
    console.error("Error fetching token:", error)
  }
}
