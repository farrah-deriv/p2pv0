/**
 * Local variables for the P2P Trading Platform
 * This file contains configuration values and user information
 * that can be accessed throughout the application.
 *
 * IMPORTANT: This file should be included in .gitignore for production environments
 * as it contains sensitive information like authentication tokens.
 * For production, these values should be loaded from environment variables.
 */

// User information
// Contains the current user's details and authentication token
// In a production environment, this would be dynamically set after login
export const USER = {
  id: 17,
  nickname: "Ameerul",
  token:
    "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiemlwIjoiREVGIn0.sA6RdDxU57pFvGALqAr3REvApSle5uio7k8-m2lyPwXv8BIfEIh6ZGfFXDeb3nIui_5rO1qpXSdWbWbL-ybUQ1_9zABVg4Yy.nYUhfy7YkjPWeEFZT_kLpQ.TINaR1SXwVObILMoLprTblYLfIpc4NRKuEOvSWkd_pihmSkq-4jmVgZhAGIH963F3hApUoiGBwwBqOA-K_qCZE-WBbu4kUqgTqn3HxZhlftsT6lfCgV4SikrStE0ucy4kqZU50K-ZZDrRtqxzJaEVA.7mu9tuaoJrSeQOVx1lDN2audx-FqNpRjezhDHV3RewY",
}

// API endpoints
// Contains the base URL for the API and all endpoint paths
// The baseUrl points to the master branch of the API
// All endpoints are relative paths that will be appended to the baseUrl
export const API = {
  baseUrl: "https://x6pr-kqwm-lfqn.n7d.xano.io/api:iD2pm9AZ:master",
  endpoints: {
    ads: "/adverts", // Endpoints for advertisement operations
    orders: "/orders", // Endpoints for order management
    profile: "/profile", // Endpoints for user profile operations
    balance: "/balance", // Endpoints for balance and transaction operations
    paymentMethods: "/payment-methods", // Endpoints for payment method management
    advertisers: "/advertisers", // Endpoints for advertiser information
    transactions: "/transactions", // Endpoints for transaction history
  },
}

// Application settings
// Contains global configuration settings for the application
// These settings control default values and supported options
export const APP_SETTINGS = {
  defaultCurrency: "USD", // Default currency used throughout the app
  supportedCurrencies: ["USD", "EUR", "GBP", "IDR"], // List of all supported currencies
  defaultLanguage: "EN", // Default language for the application
  supportedLanguages: ["EN", "ES", "FR", "ID"], // List of all supported languages
}

// Auth helper functions
// Contains utility functions for authentication and authorization
// These functions are used throughout the application to manage auth state
export const AUTH = {
  // Returns the authorization headers needed for API requests
  // Includes the Bearer token and data source configuration
  getAuthHeader: () => ({
    Authorization: `Bearer ${USER.token}`,
    "X-Data-Source": "live", // Specifies to use live data instead of test data
    "X-Branch": "master", // Specifies to use the master branch of the API
  }),
  // Utility function to check if the user is authenticated
  isAuthenticated: () => !!USER.token,
}

// Export all variables as a single object for convenience
export default {
  USER,
  API,
  APP_SETTINGS,
  AUTH,
}
