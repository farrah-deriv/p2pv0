import { z } from "zod"
import { useUserDataStore } from "@/stores/user-data-store"
import { p2pFetch } from "./p2p-fetch"
import { getCoreUrl } from "@/lib/get-core-url"
import {
  extractWalletTransactionsNextCursor,
  WALLET_TRANSACTIONS_PAGE_SIZE,
  type WalletTransactionsPageResult,
} from "@/lib/wallet-transactions-pagination"
import { parseArrayWithItemIsolation, parseWithSchema, reportedNumber, reportedString } from "@/lib/api/schema-coercion"
import { schemaReporter } from "@/lib/api/schema-reporter"

export type { WalletTransactionsPageResult } from "@/lib/wallet-transactions-pagination"
export { WALLET_TRANSACTIONS_PAGE_SIZE } from "@/lib/wallet-transactions-pagination"

const getAuthHeader = () => ({
  "Content-Type": "application/json",
})

const WALLET_TRANSACTIONS_ENDPOINT = "v1/wallets/transactions"

// Money fields live under each transaction's `metadata` — optional/nullable
// since different transaction types (top-up, transfer, etc.) don't all carry
// fee data. `.passthrough()` at every level keeps every other metadata field
// (order_type, wallet_transaction_type, statement_metadata, ...) untouched.
const walletTransactionMoneyFieldsSchema = z
  .object({
    metadata: z
      .object({
        transaction_net_amount: reportedString({
          endpoint: WALLET_TRANSACTIONS_ENDPOINT,
          field: "data[].metadata.transaction_net_amount",
          reporter: schemaReporter,
        })
          .nullable()
          .optional(),
        transaction_gross_amount: reportedString({
          endpoint: WALLET_TRANSACTIONS_ENDPOINT,
          field: "data[].metadata.transaction_gross_amount",
          reporter: schemaReporter,
        })
          .nullable()
          .optional(),
        transaction_fee_amount: reportedString({
          endpoint: WALLET_TRANSACTIONS_ENDPOINT,
          field: "data[].metadata.transaction_fee_amount",
          reporter: schemaReporter,
        })
          .nullable()
          .optional(),
        transaction_fee_percentage: reportedNumber({
          endpoint: WALLET_TRANSACTIONS_ENDPOINT,
          field: "data[].metadata.transaction_fee_percentage",
          reporter: schemaReporter,
        })
          .nullable()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export async function fetchTransactions(
  selectedCurrencyCode?: string,
  pageCursor?: string,
): Promise<WalletTransactionsPageResult> {
  const userData = useUserDataStore.getState().userData

  const walletId = userData?.wallet_id
  if (!walletId) {
    return { transactions: [], nextCursor: null }
  }

  const params = new URLSearchParams({
    wallet_id: walletId,
    per_page: String(WALLET_TRANSACTIONS_PAGE_SIZE),
  })
  if (selectedCurrencyCode) {
    params.set("transaction_currency", selectedCurrencyCode)
  }
  if (pageCursor) {
    params.set("page_cursor", pageCursor)
  }

  const url = `${getCoreUrl()}/v1/wallets/transactions?${params.toString()}`

  return p2pFetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeader(),
    },
  })
    .then((res) => res.json())
    .then((data: Record<string, unknown>) => {
      const nested = data?.data as { transactions?: unknown[] } | undefined
      const rawTransactions = nested?.transactions ?? []
      const transactions = parseArrayWithItemIsolation(walletTransactionMoneyFieldsSchema, rawTransactions, {
        endpoint: WALLET_TRANSACTIONS_ENDPOINT,
        field: "data",
        reporter: schemaReporter,
      })
      return {
        transactions,
        nextCursor: extractWalletTransactionsNextCursor(data ?? {}),
      }
    })
    .catch((err) => {
      console.error("❌ Error:", err)
      throw err
    })
}

export async function fetchWalletsList() {
  const url = `${getCoreUrl()}/v1/wallets`

  return p2pFetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeader(),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      return data
    })
    .catch((err) => {
      console.error("❌ Error:", err)
      throw err
    })
}

export async function getCurrencies(): Promise<any> {
  try {
    const url = `${getCoreUrl()}/v1/core/business/config/currencies`
    const headers = getAuthHeader()

    const response = await p2pFetch(url, {
      method: "POST",
      headers,
      credentials: "include",
    })

    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}

export type TransferValidateWalletType = "main" | "p2p" | "partners" | "platform"

export interface ValidateTransferParams {
  source_type: string
  destination_type: string
  amount: string
  balance: string
  source_id: string
  destination_id: string
  source_currency: string
  destination_currency: string
  source_platform_name?: string
  destination_platform_name?: string
}

export interface TransferValidateFee {
  percentage: number
  currency: string
  amount: string
  source?: string
}

export interface TransferValidateDetails {
  transfer: {
    is_cross_currency: boolean
    type: string
  }
  source: {
    id: string
    currency: string
    type: string
    net_amount: string
    amount: string
  }
  fee: TransferValidateFee
  destination: {
    type: string
    amount: string
    id: string
    estimated: boolean
    currency: string
  }
}

export interface TransferValidateErrorDetails {
  amount?: number
  amount_in_usd?: number
  min_amount_usd?: number
  source_currency?: string
}

export interface TransferValidateErrorItem {
  code?: string
  details?: TransferValidateErrorDetails
  i18n_key?: string
  message?: string
  status?: number
}

export interface TransferValidateResponse {
  data?: {
    is_valid: boolean
    details: TransferValidateDetails
  }
  errors?: Array<TransferValidateErrorItem>
}

const TRANSFER_VALIDATE_ENDPOINT = "v1/core/business/config/transfer/validate"

// Validates only the transfer-preview money fields — `.passthrough()` at
// every level keeps `transfer`/`is_cross_currency`/ids/etc. untouched.
const transferValidateMoneyFieldsSchema = z
  .object({
    data: z
      .object({
        details: z
          .object({
            source: z
              .object({
                amount: reportedString({
                  endpoint: TRANSFER_VALIDATE_ENDPOINT,
                  field: "data.details.source.amount",
                  reporter: schemaReporter,
                }),
                net_amount: reportedString({
                  endpoint: TRANSFER_VALIDATE_ENDPOINT,
                  field: "data.details.source.net_amount",
                  reporter: schemaReporter,
                }),
              })
              .passthrough(),
            // `quote.fee?.amount`/`quote.fee?.percentage` are read with optional
            // chaining + fallbacks in transfer.tsx (unlike source/destination,
            // read without guards) — some transfer types have no fee at all, so
            // this must not reject the whole quote when `fee` is absent.
            fee: z
              .object({
                amount: reportedString({
                  endpoint: TRANSFER_VALIDATE_ENDPOINT,
                  field: "data.details.fee.amount",
                  reporter: schemaReporter,
                })
                  .nullable()
                  .optional(),
                percentage: reportedNumber({
                  endpoint: TRANSFER_VALIDATE_ENDPOINT,
                  field: "data.details.fee.percentage",
                  reporter: schemaReporter,
                })
                  .nullable()
                  .optional(),
              })
              .passthrough()
              .nullable()
              .optional(),
            destination: z
              .object({
                amount: reportedString({
                  endpoint: TRANSFER_VALIDATE_ENDPOINT,
                  field: "data.details.destination.amount",
                  reporter: schemaReporter,
                }),
              })
              .passthrough(),
          })
          .passthrough(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export async function validateTransfer(
  params: ValidateTransferParams,
): Promise<TransferValidateResponse> {
  const url = `${getCoreUrl()}/v1/core/business/config/transfer/validate`
  const response = await p2pFetch(url, {
    method: "POST",
    headers: getAuthHeader(),
    credentials: "include",
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    try {
      const errorBody = await response.json()
      if (Array.isArray(errorBody) && errorBody.length > 0) {
        return { errors: errorBody }
      }
      if (errorBody?.errors && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
        return { errors: errorBody.errors }
      }
    } catch {
      // JSON parse failed — fall through
    }
    return { errors: [{ message: `validate transfer failed: ${response.status}` }] }
  }

  const rawData = await response.json()
  const data = parseWithSchema(transferValidateMoneyFieldsSchema, rawData, {
    endpoint: TRANSFER_VALIDATE_ENDPOINT,
    reporter: schemaReporter,
  }) as unknown as TransferValidateResponse
  return data
}

export async function walletTransfer(params: {
  amount: string
  currency: string
  destination_wallet_id: string
  request_id: string
  source_wallet_id: string
}): Promise<any> {
  const url = `${getCoreUrl()}/v1/wallets/transfers`
  const headers = getAuthHeader()

  const response = await p2pFetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    try {
      const errorBody = await response.json()
      // Normalise the various failure body shapes into { errors: [...] } so the
      // caller can surface the backend's structured rejection reason and CTA
      // via getWalletTransferRejectionInfo.
      if (Array.isArray(errorBody) && errorBody.length > 0) {
        return { errors: errorBody }
      }
      if (errorBody?.errors && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
        return { errors: errorBody.errors }
      }
      if (
        errorBody?.data?.errors &&
        Array.isArray(errorBody.data.errors) &&
        errorBody.data.errors.length > 0
      ) {
        return { errors: errorBody.data.errors }
      }
      // Single structured error object (has a code and/or context) — wrap it.
      if (errorBody && (errorBody.code || errorBody.context || errorBody.message)) {
        return { errors: [errorBody] }
      }
    } catch {
      // JSON parse failed — fall through to a generic transport-level error.
    }
    return { errors: [{ message: `wallet transfer failed: ${response.status}`, code: "transfer_failed" }] }
  }

  return await response.json()
}

export async function fetchBalance(selectedCurrency: string): Promise<number> {
  try {
    const userId = useUserDataStore.getState().userId

    if (!userId) {
      return 0
    }

    const url = `${getCoreUrl()}/p2p/v1/users/${userId}`

    const response = await p2pFetch(url, {
      credentials: "include",
      headers: {
        ...getAuthHeader(),
        accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()

    if (responseData && responseData.data) {
      const data = responseData.data
      const balance = data.balances?.find((b: any) => b.currency === selectedCurrency)?.amount
      return balance ? Number.parseFloat(balance) : 0
    }

    return 0
  } catch (error) {
    console.error("Error fetching user balance:", error)
    throw error
  }
}

export async function fetchUserBalances(): Promise<any> {
  try {
    const userId = useUserDataStore.getState().userId

    if (!userId) {
      return { balances: [] }
    }

    const url = `${getCoreUrl()}/p2p/v1/users/${userId}`

    const response = await p2pFetch(url, {
      credentials: "include",
      headers: {
        ...getAuthHeader(),
        accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`)
    }

    const responseData = await response.json()

    if (responseData?.data?.balances) {
      return { balances: responseData.data.balances }
    }

    return { balances: [] }
  } catch (error) {
    console.error("Error fetching user balances:", error)
    throw error
  }
}

export async function fetchExchangeRate(params: {
  source_currency: string
  destination_currency: string
}): Promise<any> {
  try {
    const url = `${getCoreUrl()}/v1/wallets/exchange-rate?source_currency=${params.source_currency}&destination_currency=${params.destination_currency}`
    const headers = getAuthHeader()

    const response = await p2pFetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    return null
  }
}

export async function walletExchangeTransfer(params: {
  amount: string
  source_currency: string
  destination_wallet_id: string
  request_id: string
  source_wallet_id: string
  destination_currency: string
  rate_token: string
  exchange_rate: string
}): Promise<any> {
  try {
    const url = `${getCoreUrl()}/v1/wallets/transfers/exchange`
    const headers = getAuthHeader()

    const response = await p2pFetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(params),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in exchange transfer:", error)
    return null
  }
}

export async function fetchTransactionByReferenceId(referenceId: string): Promise<any> {
  try {
    const url = `${getCoreUrl()}/v1/wallets/transactions?reference_id=${referenceId}`
    const headers = getAuthHeader()

    const response = await p2pFetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching transaction by reference ID:", error)
    return null
  }
}
