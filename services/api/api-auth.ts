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
  errors?: string[]
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
      headers: {
        "X-Enable-Session": "true"
      },
      credentials: "include",
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
export async function getSession(): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API.coreUrl}/session`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      return {
        errors: ["User not authenticated."]
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error(error)
    return {
      errors: ["User not authenticated."]
    }
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API.coreUrl}/logout`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

  } catch (error) {
    console.error(error)
    throw new Error("User not authenticated.")
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
    const response = await fetch(`${API.baseUrl}/users/me`, {
      method: "GET",
      headers: {
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
      localStorage.setItem("user_data", JSON.stringify(result.data))
    }
  } catch (error) {
    console.error("Error fetching user ID:", error)
  }
}

/**
 * Get websocket token
 */
export async function getSocketToken(token: string): Promise<void> {
  try {

    const response = await fetch(`${API.baseUrl}/user-websocket-token`, {
      method: "GET",
      headers: {
        "X-Data-Source": process.env.NEXT_PUBLIC_DATA_SOURCE,
        "X-Branch": "development",
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
