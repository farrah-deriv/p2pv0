/**
 * Local variables for the P2P Trading Platform
 * This file contains configuration values and user information
 * that can be accessed throughout the application.
 */

// User information
export const USER = {
  id: process.env.NEXT_PUBLIC_USER_ID,
  nickname: process.env.NEXT_PUBLIC_USER_NICKNAME,
  token: process.env.NEXT_PUBLIC_USER_TOKEN,
}

// API endpoints
export const API = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  socketUrl: process.env.NEXT_PUBLIC_API_SOCKET_URL,
  endpoints: {
    ads: "/adverts",
    orders: "/orders",
    profile: "/profile",
    balance: "/balance",
    paymentMethods: "/payment-methods",
    advertisers: "/users",
    transactions: "/transactions",
    userFavourites: "/user-favourites",
    userBlocks: "/user-blocks",
  },
}

// Application settings
export const APP_SETTINGS = {
  defaultCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "IDR"],
  defaultLanguage: "EN",
  supportedLanguages: ["EN", "ES", "FR", "ID"],
}

// Auth helper functions
export const AUTH = {
  getAuthHeader: () => ({
    Authorization: `Bearer ${USER.token}`,
    // Read headers from environment variables with fallbacks
    "X-Data-Source": process.env.NEXT_PUBLIC_API_DATA_SOURCE,
    "X-Branch": process.env.NEXT_PUBLIC_API_BRANCH,
  }),
  isAuthenticated: () => !!USER.token,
}

// Export all variables as a single object for convenience
export default {
  USER,
  API,
  APP_SETTINGS,
  AUTH,
}
