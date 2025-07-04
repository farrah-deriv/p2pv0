export async function getCurrencies(): Promise<string[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const endpoint = "/settings"
  const url = `${apiUrl}${endpoint}`

  try {
    console.log("Fetching currencies from:", url)
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("API URL:", url)
    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("Raw response text:", responseText)

    let apiData: any
    try {
      apiData = JSON.parse(responseText)
      console.log("Parsed API data:", apiData)
    } catch (error) {
      console.error("Error parsing JSON:", error)
      console.error("Raw response that failed to parse:", responseText)
      return []
    }

    if (apiData && apiData.currencies && Array.isArray(apiData.currencies)) {
      console.log("Found currencies in API response:", apiData.currencies)
      return apiData.currencies
    }

    console.log("API response doesn't contain expected currencies structure, using fallback")
    return []
  } catch (error) {
    console.error("Error fetching currencies:", error)
    return []
  }
}
