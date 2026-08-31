import { useUserDataStore } from "@/stores/user-data-store"
import { getCoreUrl } from "@/lib/get-core-url"
import { getSocketUrl } from "@/lib/get-socket-url"

let USER_DATA = null
let USER_TOKEN = null
let USER_ID = null
let SOCKET_TOKEN = null
let CLIENT_ID = null
let CORE_URL = ""
let SOCKET_URL = ""

if (typeof window !== "undefined") {
  USER_TOKEN = localStorage.getItem("auth_token") ?? ""

  USER_DATA = useUserDataStore.getState().userData

  USER_ID = useUserDataStore.getState().userId ?? ""

  SOCKET_TOKEN = localStorage.getItem("socket_token") ?? ""

  CLIENT_ID = useUserDataStore.getState().clientId ?? ""

  CORE_URL = getCoreUrl()
  SOCKET_URL = getSocketUrl()
}

export const USER = {
  id: USER_ID,
  advertsAreListed: USER_DATA?.adverts_are_listed,
  first_name: USER_DATA?.first_name,
  last_name: USER_DATA?.last_name,
  email: USER_DATA?.email,
  wallet_id: USER_DATA?.wallet_id,
  nickname: USER_DATA?.nickname,
  socketToken: SOCKET_TOKEN,
  userToken: USER_TOKEN,
}

export const API = {
  baseUrl: `${CORE_URL}/p2p/v1`,
  p2pV2BaseUrl: `${CORE_URL}/p2p/v2`,
  coreUrl: `${CORE_URL}/v1`,
  socketUrl: `${SOCKET_URL}/p2p/v1/events`,
  notificationUrl: `${CORE_URL}/notifications/v1`,
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
    walletsTransactions: "/wallets/transactions",
  },
}

export const WALLETS = {
  cashierUrl: `${CORE_URL}/v1/cashier/url`,
  defaultParams: {
    wallet_id: USER_DATA?.balances?.find((b) => b.currency === "USD")?.wallet_id,
    user_id: CLIENT_ID || "",
    operation: "DEPOSIT",
    currency: "USD",
    brand_id: USER_DATA?.brand || "",
  },
}

export const AUTH = {
  getAuthHeader: () => ({
    "Content-Type": "application/json",
  }),

  getNotificationHeader: () => ({
    "Content-Type": "application/json",
  }),
}

export const APP_SETTINGS = {
  defaultCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "IDR"],
  defaultLanguage: "EN",
  supportedLanguages: ["EN", "ES", "FR", "ID", "IT", "PT"],
}

export const NOTIFICATIONS = {
  applicationId: process.env.NEXT_PUBLIC_NOTIFICATION_APPLICATION_ID,
  subscriberHashUrl: `${CORE_URL}/notifications/v1`,
}

export default {
  USER,
  API,
  APP_SETTINGS,
  AUTH,
  NOTIFICATIONS,
  WALLETS,
}
