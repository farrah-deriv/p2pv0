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
  comment: string
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

    // Log request details
    console.group("📤 GET Orders Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Filters:", filters)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET Orders Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching orders: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = []
    }

    console.log("✅ Successfully fetched orders")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Orders Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 GET Order By ID Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", id)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET Order By ID Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = {}
    }

    console.log("✅ Successfully fetched order details")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Order By ID Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Mark Payment As Sent Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Mark Payment As Sent Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error marking payment as sent: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully marked payment as sent")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Mark Payment As Sent Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Release Payment Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Release Payment Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error releasing payment: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully released payment")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Release Payment Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Cancel Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.log("Reason:", reason)
    console.log("Request Body:", body)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Cancel Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error cancelling order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully cancelled order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Cancel Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Dispute Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.log("Reason:", reason)
    console.log("Request Body:", body)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Dispute Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error disputing order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully disputed order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Dispute Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Create Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Request Body:", body)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Create Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error creating order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      throw new Error("Invalid response format")
    }

    console.log("✅ Successfully created order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Create Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

    // Log request details
    console.group("📤 POST Pay Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Pay Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error paying for order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully paid for order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Pay Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Review an order
 */
export async function reviewOrder(orderId: string, reviewData: ReviewData): Promise<{ success: boolean }> {
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
      }
    })

    // Log request details
    console.group("📤 POST Review Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Order ID:", orderId)
    console.log("Review Data:", reviewData)
    console.log("Request Body:", body)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Review Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error reviewing order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { success: true }
    }

    console.log("✅ Successfully reviewed order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Review Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
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

  // Add this new method
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
    }
  },
}

