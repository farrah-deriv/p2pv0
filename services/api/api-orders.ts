import { API, AUTH } from "@/lib/local-variables"
import { p2pFetch } from "./p2p-fetch"

export class OrderChatSendError extends Error {
  readonly code: string
  readonly tags: string[]

  constructor(code: string, tags: string[] = []) {
    super(code)
    this.name = "OrderChatSendError"
    this.code = code
    this.tags = tags
  }
}

function extractP2PApiError(data: unknown, fallbackCode: string): { code: string; tags: string[] } {
  if (!data || typeof data !== "object") {
    return { code: fallbackCode, tags: [] }
  }

  const body = data as {
    code?: unknown
    detail?: { tags?: unknown }
    errors?: Array<{ code?: unknown; detail?: { tags?: unknown } }>
  }

  const code =
    (typeof body.errors?.[0]?.code === "string" && body.errors[0].code) ||
    (typeof body.code === "string" && body.code) ||
    fallbackCode

  const rawTags = body.errors?.[0]?.detail?.tags ?? body.detail?.tags
  const tags = Array.isArray(rawTags) ? rawTags.map(String) : []

  return { code, tags }
}

// Type definitions
export interface Order {
  id: string
  type: "buy" | "sell"
  status: "pending_payment" | "pending_release" | "timed_out" | "completed" | "cancelled" | "disputed" | "refunded" | "Pending" | "Completed" | "Cancelled" | "Disputed"
  amount: Value
  rate: {
    value: string
    currency: string
  }
  advert: {
    user: {
      id: number
      nickname: string
      is_online?: boolean
      last_online_at?: number
    }
  }
  user: {
    id: number
    nickname: string
    is_online?: boolean
    last_online_at?: number
  }
  price: Value
  paymentMethod: string
  created_at: string
  expires_at: string
  completed_at?: string
  cancelled_at?: string
  payment_currency: string
  payment_amount: string
  is_reviewable: boolean
  rating: number
  counterparty_name?: string
  disputed_at?: string
  has_buyer_submitted_pot?: boolean
}

export interface OrderFilters {
  status?: "Pending" | "Completed" | "Cancelled" | "Disputed"
  type?: "Buy" | "Sell"
  is_open?: boolean
  date_from?: string
  date_to?: string
}

export interface Value {
  value: number
  currency: string
}

export interface ReviewData {
  rating: number
  recommend: boolean | null
  comment?: string
}

export interface ChatMessage {
  id: string
  orderId: string
  senderId: number
  content: string
  time: string
  isRead: boolean
}

export async function getOrders(filters?: OrderFilters, page?: number, perPage?: number): Promise<Order[]> {
  try {
    const queryParams = new URLSearchParams()

    if (filters) {
      if (filters.status) queryParams.append("status", filters.status)
      if (filters.type) queryParams.append("type", filters.type)
      if (filters.is_open !== undefined) queryParams.append("is_open", filters.is_open.toString())
      if (filters.date_from) queryParams.append("date_from", filters.date_from)
      if (filters.date_to) queryParams.append("date_to", filters.date_to)
    }

    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const url = `${API.baseUrl}${API.endpoints.orders}${queryString}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (response.status === 403) {
      return []
    }

    if (!response.ok) {
      throw new Error(`Error fetching orders: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = []
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function getOrderById(id: string): Promise<Order> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function markPaymentAsSent(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/payment-sent`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data ?? { success: true }
  } catch (error) {
    throw error
  }
}

export async function releasePayment(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/release`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data ?? { success: true }
  } catch (error) {
    throw error
  }
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/cancel`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function disputeOrder(orderId: string, reason: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/dispute`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const body = JSON.stringify({
      data: {
        reason,
      },
    })

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data ?? { success: true }
  } catch (error) {
    throw error
  }
}

export async function createOrder(advertId: number, exchangeRate: number, amount: number, paymentMethodIds: string[], advertVersion?: number): Promise<Order> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const body = JSON.stringify({
      data: {
        advert_id: advertId,
        amount: amount,
        ...(exchangeRate != null && { exchange_rate: exchangeRate }),
        ...(paymentMethodIds.length > 0 && { payment_method_ids: paymentMethodIds }),
        ...(advertVersion !== undefined && { advert_version: advertVersion }),
      },
    })

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    })

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error("Invalid response format")
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function payOrder(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/pay`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data ?? { success: true }
  } catch (error) {
    throw error
  }
}

export async function reviewOrder(
  orderId: string,
  reviewData: ReviewData,
): Promise<{ success: boolean; errors: any[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/review`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const body = JSON.stringify({
      data: {
        rating: reviewData.rating,
        recommend: reviewData.recommend,
      },
    })

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.code || response.statusText || "UnknownError"
      throw new Error(errorCode)
    }

    return data ?? { success: true, errors: [] }
  } catch (error) {
    throw error
  }
}

export async function completeOrder(orderId: string, otpValue: string | null): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/complete`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        data: {
          verification_code: otpValue,
        },
      }),
    })

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { success: true, errors: [] }
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function sendChatMessage(
  orderId: string,
  message: string,
  attachment?: string | null,
  isPOT?: boolean,
): Promise<{ success: boolean; message: ChatMessage }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/chat`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    let body = ""
    if (attachment) {
      body = JSON.stringify({
        attachment,
        data: {
          is_proof_of_transfer: isPOT,
        },
      })
    } else {
      body = JSON.stringify({
        data: {
          message,
        },
      })
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    })

    const responseText = await response.text()
    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const { code, tags } = extractP2PApiError(data, response.statusText || "UnknownError")
      throw new OrderChatSendError(code, tags)
    }

    const time = new Date().toISOString()

    return {
      success: true,
      message: data?.data ||
        data?.message || {
        id: Date.now().toString(),
        orderId,
        senderId: 0,
        content: message,
        time,
        isRead: false,
      },
    }
  } catch (error) {
    throw error
  }
}

export async function requestOrderCompletionOtp(orderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/verification_code`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      method: "POST",
      credentials: "include",
      headers,
    })

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { success: true }
    }

    return data
  } catch (error) {
    throw error
  }
}

export const OrdersAPI = {
  getOrders,
  getOrderById,
  markPaymentAsSent,
  releasePayment,
  cancelOrder,
  disputeOrder,
  createOrder,
  payOrder,
  reviewOrder,
  sendChatMessage,
  completeOrder,
  requestOrderCompletionOtp,

  getOrderByIdMock: async (orderId: string): Promise<Order> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      id: orderId,
      type: "Buy",
      status: "Pending",
      amount: {
        value: 145000.0,
        currency: "IDR",
      },
      rate: {
        value: "10.00",
        currency: "USD",
      },
      advert: {
        user: {
          id: 123,
          nickname: "Mariana_Rueda",
          is_online: true,
          last_online_at: Date.now(),
        },
      },
      user: {
        id: 0,
        nickname: "Buyer",
        is_online: false,
        last_online_at: Date.now(),
      },
      price: {
        value: "1450000",
        currency: "IDR",
      },
      paymentMethod: "Bank Transfer",
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      payment_currency: "IDR",
      is_reviewable: true,
      rating: 0,
    }
  },
}
