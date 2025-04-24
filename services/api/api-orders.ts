import { API, AUTH } from "@/lib/local-variables"

// Type definitions
export interface Order {
  id: string
  type: "Buy" | "Sell"
  status: "Pending" | "Completed" | "Cancelled" | "Disputed"
  amount: Value
  rate: {
    value: string
    currency: string
  }
  advert: {
    user: {
      id: number
      nickname: string
    }
  }
  price: Value
  paymentMethod: string
  created_at: string
  expires_at: string
  completed_at?: string
  cancelled_at?: string
  payment_currency: string
  is_reviewable: boolean
  rating: number
}

export interface OrderFilters {
  status?: "Pending" | "Completed" | "Cancelled" | "Disputed"
  type?: "Buy" | "Sell"
  period?: "today" | "week" | "month" | "all"
  is_open?: boolean
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

export async function getOrders(filters?: OrderFilters): Promise<Order[]> {
  try {
    const queryParams = new URLSearchParams()

    if (filters) {
      if (filters.status) queryParams.append("status", filters.status)
      if (filters.type) queryParams.append("type", filters.type)
      if (filters.period) queryParams.append("period", filters.period)
      if (filters.is_open !== undefined) queryParams.append("is_open", filters.is_open.toString())
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const url = `${API.baseUrl}${API.endpoints.orders}${queryString}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, { headers })

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

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Error fetching order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = {}
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

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error marking payment as sent: ${response.statusText}`)
    }

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

export async function releasePayment(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/release`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error releasing payment: ${response.statusText}`)
    }

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

export async function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/cancel`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error cancelling order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { success: true }
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
    const body = JSON.stringify({ reason })

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`Error disputing order: ${response.statusText}`)
    }

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

export async function createOrder(advertId: number, amount: number): Promise<Order> {
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
      },
    })

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`Error creating order: ${response.statusText}`)
    }

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

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error paying for order: ${response.statusText}`)
    }

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

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`Error reviewing order: ${response.statusText}`)
    }

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

export async function completeOrder(orderId: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/complete`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error completing order: ${response.statusText}`)
    }

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

export async function sendChatMessage(
  orderId: string,
  message: string,
  attachment?: string | null,
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
      })
    } else {
      body = JSON.stringify({
        data: {
          message,
        },
      })
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`Error sending message: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { success: true, message: { content: message, time: new Date().toISOString() } }
    }

    const time = new Date().toISOString()

    return {
      success: true,
      message: data.data ||
        data.message || {
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
        },
      },
      price: {
        value: "1450000",
        currency: "IDR",
      },
      paymentMethod: "Bank Transfer",
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      payment_currency: "IDR",
      is_reviewable: true,
      rating: 0,
    }
  },
}
