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

    const cleanFields: Record<string, any> = {}

    Object.keys(fields).forEach((key) => {
      if (fields[key] && typeof fields[key] === "string") {
        cleanFields[key] = fields[key]
      }
    })

    const requestBody = {
      data: {
        method: formattedMethod,
        fields: cleanFields,
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
    const { method_type, ...cleanFields } = fields

    const finalFields: Record<string, any> = {}

    Object.keys(cleanFields).forEach((key) => {
      if (cleanFields[key] && typeof cleanFields[key] === "string") {
        finalFields[key] = cleanFields[key]
      }
    })

    const requestBody = {
      data: {
        fields: finalFields,
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
