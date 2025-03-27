/**
 * Local variables for the P2P Trading Platform
 * This file contains configuration values and user information
 * that can be accessed throughout the application.
 */

// User information
export const USER = {
  id: 17,
  nickname: "ernest",
  token:
    "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiemlwIjoiREVGIn0.sA6RdDxU57pFvGALqAr3REvApSle5uio7k8-m2lyPwXv8BIfEIh6ZGfFXDeb3nIui_5rO1qpXSdWbWbL-ybUQ1_9zABVg4Yy.nYUhfy7YkjPWeEFZT_kLpQ.TINaR1SXwVObILMoLprTblYLfIpc4NRKuEOvSWkd_pihmSkq-4jmVgZhAGIH963F3hApUoiGBwwBqOA-K_qCZE-WBbu4kUqgTqn3HxZhlftsT6lfCgV4SikrStE0ucy4kqZU50K-ZZDrRtqxzJaEVA.7mu9tuaoJrSeQOVx1lDN2audx-FqNpRjezhDHV3RewY",
}

// API endpoints
export const API = {
  baseUrl: "https://x6pr-kqwm-lfqn.n7d.xano.io/api:iD2pm9AZ:development",
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
    // Add any other required headers
    "X-Data-Source": "live",
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

