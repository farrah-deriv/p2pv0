let USER_DATA = null;
let USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NDk2MzY3Nzd9XSwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJjbGllbnRfaWQiOjQzOSwiZW1haWwiOiJmYXJyYWhAcmVnZW50bWFya2V0cy5jb20iLCJleHAiOjE3NDk3MjMxNzcsImlhdCI6MTc0OTYzNjc3NywiaXNfYW5vbnltb3VzIjpmYWxzZSwicGhvbmUiOiIiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJlNmZhYjhmZS1mNTdlLTQ5YzQtYTk4YS02N2FiMzU2M2ZkZTgiLCJzdWIiOiIxMTI0MmFjYy1hNzg2LTQ5MDgtYThhZC1jNTA0NDQ3Zjc0YTUiLCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZmFycmFoQHJlZ2VudG1hcmtldHMuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjExMjQyYWNjLWE3ODYtNDkwOC1hOGFkLWM1MDQ0NDdmNzRhNSJ9fQ.IfzmmcQWZ1zyZODVinb-q0NYdPyKfTd0IP7P7AyQCIE";
let USER_ID = 36;
if (typeof window !== "undefined") {
  USER_DATA = JSON.parse(localStorage.getItem("user_data") ?? "{}")
  USER_TOKEN = localStorage.getItem("auth_token") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NDk2MzY3Nzd9XSwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJjbGllbnRfaWQiOjQzOSwiZW1haWwiOiJmYXJyYWhAcmVnZW50bWFya2V0cy5jb20iLCJleHAiOjE3NDk3MjMxNzcsImlhdCI6MTc0OTYzNjc3NywiaXNfYW5vbnltb3VzIjpmYWxzZSwicGhvbmUiOiIiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJlNmZhYjhmZS1mNTdlLTQ5YzQtYTk4YS02N2FiMzU2M2ZkZTgiLCJzdWIiOiIxMTI0MmFjYy1hNzg2LTQ5MDgtYThhZC1jNTA0NDQ3Zjc0YTUiLCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZmFycmFoQHJlZ2VudG1hcmtldHMuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjExMjQyYWNjLWE3ODYtNDkwOC1hOGFkLWM1MDQ0NDdmNzRhNSJ9fQ.IfzmmcQWZ1zyZODVinb-q0NYdPyKfTd0IP7P7AyQCIE";
  USER_ID = localStorage.getItem("user_id") ?? "36";
}

export const USER = {
  id: USER_ID,
  nickname: USER_DATA?.nickname,
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
