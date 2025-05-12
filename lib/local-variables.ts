export const USER = {
  id: process.env.NEXT_PUBLIC_USER_ID,
  nickname: process.env.NEXT_PUBLIC_USER_NICKNAME,
  token: process.env.NEXT_PUBLIC_USER_TOKEN,
}

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

export const WALLETS = {
  cashierUrl: "https://deriv-app.xano.io/api:_y_PtoVK/cashier/url",
  defaultParams: {
    client_id: "e104c979-b10c-4727-b233-19064314c793",
    wallet_id: "e104c979-b10c-4727-b233-19064314c793",
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
    "X-Data-Source": process.env.NEXT_PUBLIC_API_DATA_SOURCE,
    "X-Branch": process.env.NEXT_PUBLIC_API_BRANCH,
  }),
  isAuthenticated: () => !!USER.token,
}

export const NOTIFICATIONS = {
  applicationId: "H8Lp22BoI5C_",
  subscriberHashUrl: "https://deriv-app.xano.io/api:Z9LpLrma/notification/v1/subscribers",
}

export default {
  USER,
  API,
  APP_SETTINGS,
  AUTH,
  NOTIFICATIONS,
  WALLETS,
}
