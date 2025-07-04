const API = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  endpoints: {
    settings: "/api/settings",
  },
}

const AUTH = {
  getAuthHeader: () => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}

const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP"]

export const getCurrencies = async (): Promise<string[]> => {
  try {
    console.log("getCurrencies: Making API call to:", `${API.baseUrl}${API.endpoints.settings}`)

    const response = await fetch(`${API.baseUrl}${API.endpoints.settings}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH.getAuthHeader(),
      },
    })

    console.log("getCurrencies: Response status:", response.status)
    console.log("getCurrencies: Response ok:", response.ok)

    if (!response.ok) {
      console.log("getCurrencies: Response not ok, using fallback currencies")
      return DEFAULT_CURRENCIES
    }

    const responseText = await response.text()
    console.log("getCurrencies: Raw response text:", responseText)

    const data = JSON.parse(responseText)
    console.log("getCurrencies: Parsed response data:", data)

    // TODO: Update this based on actual API response structure
    if (data && data.currencies && Array.isArray(data.currencies)) {
      console.log("getCurrencies: Found currencies in response:", data.currencies)
      return data.currencies
    }

    console.log("getCurrencies: No currencies found in expected structure, using fallback")
    return DEFAULT_CURRENCIES
  } catch (error) {
    console.error("getCurrencies: Error fetching currencies:", error)
    return DEFAULT_CURRENCIES
  }
}
