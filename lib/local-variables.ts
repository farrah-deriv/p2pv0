export const USER = {
  id: process.env.NEXT_PUBLIC_USER_ID,
  nickname: process.env.NEXT_PUBLIC_USER_NICKNAME,
  token: process.env.NEXT_PUBLIC_USER,
}

export const API = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
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
