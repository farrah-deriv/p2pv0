import { API, AUTH } from "@/lib/local-variables"

export interface PaymentMethod {
  id: string
  name: string
  type: string
  details: Record<string, string>
  instructions?: string
  isDefault?: boolean
}

export interface PaymentMethodResponse {
  success: boolean
  data?: PaymentMethod
  errors?: Array<{ code: string; message: string }>
}

export async function getUserPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch(`${API.baseUrl}/user-payment-methods`, {
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch payment methods:", error)
    throw error
  }
}

export async function getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.availablePaymentMethods}`, {
      headers: {
        accept: "application/json",
        ...AUTH.getAuthHeader(),
      },
    })
    const responseData = await response.json()

    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      return responseData.data
    } else {
      return []
    }
  } catch (error) {
    return []
  }
}

export async function addPaymentMethod(method: string, fields: Record<string, any>): Promise<PaymentMethodResponse> {
  try {
    const formattedMethod = method.toLowerCase()

    let formattedFields: Record<string, any> = {}

    if (formattedMethod === "alipay") {
      formattedFields = {
        account: fields.alipay_id,
      }

      if (fields.instructions) {
        formattedFields.instructions = fields.instructions
      }
    } else if (formattedMethod === "bank_transfer") {
      formattedFields = {
        account: fields.account || "",
        bank_code: fields.bank_code || "-",
        bank_name: fields.bank_name || "",
        branch: fields.branch || "-",
        instructions: fields.instructions || "-",
      }
    } else {
      formattedFields = { ...fields }
    }

    const requestBody = {
      data: {
        method: formattedMethod,
        fields: formattedFields,
      },
    }

    const response = await fetch(`${API.baseUrl}/user-payment-methods`, {
      method: "POST",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : { success: response.ok }
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)
      return {
        success: false,
        errors: [{ code: "parse_error", message: "Failed to parse server response" }],
      }
    }

    if (!response.ok) {
      const errors = responseData.errors || []

      const formattedErrors = errors.map((err: any) => ({
        code: err.code || "unknown_error",
        message: getErrorMessageFromCode(err.code),
      }))

      return {
        success: false,
        errors:
          formattedErrors.length > 0
            ? formattedErrors
            : [{ code: "api_error", message: `API Error: ${response.status} ${response.statusText}` }],
      }
    }

    return { success: true, data: responseData.data }
  } catch (error) {
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")

    return {
      success: false,
      errors: [
        {
          code: "exception",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      ],
    }
  }
}

export async function updatePaymentMethod(id: string, fields: Record<string, any>): Promise<PaymentMethodResponse> {
  try {
    // Remove method_type from fields before sending
    const { method_type, ...cleanFields } = fields

    const requestBody = {
      data: {
        fields: cleanFields,
      },
    }

    const response = await fetch(`${API.baseUrl}/user-payment-methods/${id}`, {
      method: "PATCH",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : { success: response.ok }
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)
      return {
        success: false,
        errors: [{ code: "parse_error", message: "Failed to parse server response" }],
      }
    }

    if (!response.ok) {
      const errors = responseData.errors || []

      const formattedErrors = errors.map((err: any) => ({
        code: err.code || "unknown_error",
        message: err.message || getErrorMessageFromCode(err.code),
      }))

      return {
        success: false,
        errors:
          formattedErrors.length > 0
            ? formattedErrors
            : [{ code: "api_error", message: `API Error: ${response.status} ${response.statusText}` }],
      }
    }

    return { success: true, data: responseData.data }
  } catch (error) {
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")

    return {
      success: false,
      errors: [
        {
          code: "exception",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      ],
    }
  }
}

function getErrorMessageFromCode(code: string): string {
  const errorMessages: Record<string, string> = {
    DuplicatePaymentMethod: "You already have this payment method added to your account.",
    PaymentMethodUsedByOpenOrder:
      "This payment method is currently being used by an open order and cannot be modified.",
    InvalidPaymentMethod: "The payment method information is invalid.",
    PaymentMethodNotFound: "The payment method could not be found.",
  }

  return errorMessages[code] || `Error: ${code}`
}

export async function deletePaymentMethod(id: string): Promise<PaymentMethodResponse> {
  try {
    const response = await fetch(`${API.baseUrl}/user-payment-methods/${id}`, {
      method: "DELETE",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, errors: errorData.errors }
      } catch (error) {
        return { success: false, errors: [{ code: "api_error", message: response.statusText }] }
      }
    }

    return { success: true }
  } catch (error) {
    console.error(`Failed to delete payment method with ID ${id}:`, error)
    return {
      success: false,
      errors: [{ code: "exception", message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export const PaymentMethodsAPI = {
  getUserPaymentMethods,
  getAvailablePaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
}
