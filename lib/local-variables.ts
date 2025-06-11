let USER_DATA = null;
let USER_TOKEN = null;
let USER_ID = null;
let SOCKET_TOKEN = null;
if (typeof window !== "undefined") {
  USER_DATA = JSON.parse(localStorage.getItem("user_data") ?? "{}")
  USER_TOKEN = localStorage.getItem("auth_token") ?? "";
  USER_ID = localStorage.getItem("user_id") ?? "";
  SOCKET_TOKEN = localStorage.getItem("socket_token") ?? "";
}

export const USER = {
  id: USER_ID,
  nickname: USER_DATA?.nickname,
  socketToken: SOCKET_TOKEN,
  token: USER_TOKEN,
}

export const API = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  coreUrl: process.env.NEXT_PUBLIC_CORE_URL,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  endpoints: {
    ads: "/adverts",
    orders: "/orders",
    profile: "/profile",
    balance: "/balance",
    paymentMethods: "/payment-methods",
    availablePaymentMethods: "/available-payment-methods",
    userPaymentMethods: "/user-payment-methods",
    advertisers: "/users",
    transactions: "/transactions",
    userFavourites: "/user-favourites",
    userBlocks: "/user-blocks",
  },
}

export const WALLETS = {
  cashierUrl: process.env.NEXT_PUBLIC_CASHIER_URL,
  defaultParams: {
    client_id: process.env.NEXT_PUBLIC_WALLETS_CLIENT_ID,
    wallet_id: process.env.NEXT_PUBLIC_WALLETS_ID,
    brand: "uae",
    operation: "DEPOSIT",
    currency: "USD",
  },
}

export const APP_SETTINGS = {
  defaultCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "IDR"],
  defaultLanguage: "EN",
  supportedLanguages: ["EN", "ES", "FR", "ID"],
}

export const AUTH = {
  getAuthHeader: () => ({
    Authorization: `Bearer ${USER.token}`,
    // Read headers from environment variables with fallbacks
    "X-Data-Source": process.env.NEXT_PUBLIC_DATA_SOURCE,
    "X-Branch": process.env.NEXT_PUBLIC_BRANCH,
  }),
  isAuthenticated: () => !!USER.token,
}

export const NOTIFICATIONS = {
  applicationId: process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID,
  subscriberHashUrl: process.env.NEXT_PUBLIC_NOTIFICATION_URL,
}

export default {
  USER,
  API,
  APP_SETTINGS,
  AUTH,
  NOTIFICATIONS,
  WALLETS,
}
