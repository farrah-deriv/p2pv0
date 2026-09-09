import * as AuthAPI from "@/services/api/api-auth"
import { resolveListViewState } from "@/lib/errors/resolve-list-view-state"
import jest from "jest" // Import jest to fix the undeclared variable error

global.fetch = jest.fn()

/**
 * Composes the two halves the wallet list actually depends on — `getTotalBalance()` and the
 * shared `resolveListViewState()` branch order — the same way `app/wallet/page.tsx` wires
 * them: the query's `isError`/`isLoading` plus the mapped wallet count feed the view state
 * that `app/wallet/components/wallet-balances.tsx` renders from.
 *
 * The cohort under test is a phone-only signup with no email and no provisioned P2P wallet.
 * `/v1/client/total-balance` answers 403/404 for them, which used to reject the query and
 * pin the list on "Couldn't load wallets" + Retry. `resolveListViewState` branches error
 * before empty on purpose (a failed fetch must not read as "you have nothing"), so the only
 * correct place to fix it is the API boundary.
 */
describe("wallet list view state for a client with no P2P wallet", () => {
  const jsonResponse = (status: number, body: unknown) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      statusText: `status ${status}`,
      headers: { get: () => "application/json" },
      clone: () => ({ json: async () => body }),
      json: async () => body,
    }) as unknown as Response

  /**
   * Mirrors `app/wallet/page.tsx`: run the query, map the p2p wallet's `balances[]` into
   * the `p2pBalances` rows the way `processBalanceData` does, then resolve the view state.
   * Counting `wallets.items` instead would not model the screen — `<WalletBalances>` is
   * handed `p2pBalances`, so a provisioned wallet holding nothing is still an empty list.
   */
  async function resolveWalletListViewState() {
    let itemCount = 0
    let isError = false

    try {
      const balance = await AuthAPI.getTotalBalance()
      const items = balance.wallets.items as Array<Record<string, any>>
      const p2pWallet = items.find((wallet) => wallet.type === "p2p")
      itemCount = p2pWallet?.balances?.length ?? 0
    } catch {
      isError = true
    }

    return resolveListViewState({ isLoading: false, isError, itemCount })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("lands on the BuyCurrencies empty state when total-balance answers 403", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(403, { errors: [{ code: "PermissionDenied" }] }))

    await expect(resolveWalletListViewState()).resolves.toBe("empty")
  })

  it("lands on the BuyCurrencies empty state when total-balance answers 404", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(404, { errors: [{ code: "NotFound" }] }))

    await expect(resolveWalletListViewState()).resolves.toBe("empty")
  })

  it("keeps the error state and Retry when total-balance genuinely fails", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(500, { errors: [{ code: "ServerError" }] }))

    await expect(resolveWalletListViewState()).resolves.toBe("error")
  })

  it("still renders the list for a client who has wallets", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          wallets: {
            items: [
              {
                type: "p2p",
                total_balance: { approximate_total_balance: "25.00", converted_to: "USD" },
                balances: [{ balance: "25.00", currency: "USD" }],
              },
            ],
          },
        },
      }),
    )

    await expect(resolveWalletListViewState()).resolves.toBe("list")
  })

  /**
   * The actual reporting cohort, from a live network capture: `/v1/client/total-balance`
   * answers 200 with an enabled p2p wallet that has an empty `balances[]` and no
   * item-level `total_balance`. Nothing here is a failure — the client has a wallet and
   * it is empty — so the list must land on BuyCurrencies, not on the error state.
   *
   * Neither guard added in #1540 can catch this: the status is 200, and `userId` is
   * populated because this client does have a P2P profile with a `wallet_id`.
   */
  it("lands on the BuyCurrencies empty state when a 200 wallet item omits total_balance", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          total_balance: { amount: "0.00", currency: "USD" },
          wallets: {
            total_balance: { amount: "0.00", currency: "USD" },
            items: [
              {
                wallet_id: "fafedafa-47e5-431f-8969-b290705d04b4",
                counterparty: "dsvg",
                brand: "deriv",
                type: "p2p",
                status: "enabled",
                balances: [],
                pending_balance: [],
              },
            ],
          },
        },
      }),
    )

    await expect(resolveWalletListViewState()).resolves.toBe("empty")
  })
})
