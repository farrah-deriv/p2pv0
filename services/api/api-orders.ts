import { API, AUTH, USER } from "@/lib/local-variables"

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
  createdAt: string
  expiresAt: string
  completedAt?: string
  cancelledAt?: string
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

// Add this new interface for chat messages
export interface ChatMessage {
  id: string
  orderId: string
  senderId: number
  content: string
  timestamp: string
  isRead: boolean
}

// API Functions
/**
 * Get all orders with optional filters
 */
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

/**
 * Get order details by ID
 */
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

/**
 * Mark payment as sent (for buy orders)
 */
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

/**
 * Confirm payment received and release funds (for sell orders)
 */
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

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, reason: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/cancel`
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
      throw new Error(`Error cancelling order: ${response.statusText}`)
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

/**
 * Dispute an order
 */
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

/**
 * Create a new order
 */
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

/**
 * Pay for an order
 */
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

/**
 * Review an order
 */
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

/**
 * Send a message to the order chat
 * @param orderId - The ID of the order
 * @param message - The message content to send
 * @returns Promise with the result of the operation
 */
export async function sendChatMessage(
  orderId: string,
  message: string,
): Promise<{ success: boolean; message: ChatMessage }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}/${orderId}/chat`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const body = JSON.stringify({
      data: {
        attachment: "",
        message,
      },
    })

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
      data = { success: true, message: { content: message, timestamp: new Date().toISOString() } }
    }

    return {
      success: true,
      message: data.data ||
        data.message || {
        id: Date.now().toString(),
        orderId,
        senderId: 0, // Will be replaced by the actual sender ID from the server
        content: message,
        timestamp: new Date().toISOString(),
        isRead: false,
      },
    }
  } catch (error) {
    throw error
  }
}

export const OrdersAPI = {
  // Keep existing methods...
  getOrders: getOrders,
  getOrderById: getOrderById,
  markPaymentAsSent: markPaymentAsSent,
  releasePayment: releasePayment,
  cancelOrder: cancelOrder,
  disputeOrder: disputeOrder,
  createOrder: createOrder,
  payOrder: payOrder,
  reviewOrder: reviewOrder,
  sendChatMessage,


  getOrderByIdMock: async (orderId: string): Promise<Order> => {
    // In a real app, this would be an API call
    // For now, we'll simulate a delay and return mock data
    await new Promise((resolve) => setTimeout(resolve, 500))

    // This is mock data - in a real app, you'd fetch from an API
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
