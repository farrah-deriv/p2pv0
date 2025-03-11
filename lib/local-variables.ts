/**
 * Local variables for the P2P Trading Platform
 * This file contains configuration values and user information
 * that can be accessed throughout the application.
 */

// User information
export const USER = {
  id: 44,
  nickname: "ernest",
  token:
    "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiemlwIjoiREVGIn0.z6oVRfqY4z3dnr78avC1mMnJCCSPxa6EdUqWMLK1ejjptbKi4Ax-m5ceatnOLTdT3CACjGAXyeRZKk1Sa-ObPP-vsltPifx4.-XX5i1-7VKhLIfSlT9joTg.8NJUj93HGOHlc5o2V9BRmX0i60lRqAYf6pTMZvJjbP3d7LxVsZK_kdUWNy7mUmAQ7fJgw05IQA0kKaKWcaHW6EEd4UfxwVSWRSN8F7mwGJSRsMNIz0_6-Vh3axc5j_zzA15wOsWitnXKnnQUvYSn-A.5ooG4D1mUNgoPgVcf0GvTLd09nepqFCrSgR3cHZkuEk",
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
    advertisers: "/advertisers",
    transactions: "/transactions",
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
    "X-Data-Source": "test",
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

