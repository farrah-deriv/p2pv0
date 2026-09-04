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

  /** Mirrors `app/wallet/page.tsx`: run the query, then resolve the list's view state. */
  async function resolveWalletListViewState() {
    let itemCount = 0
    let isError = false

    try {
      const balance = await AuthAPI.getTotalBalance()
      itemCount = balance.wallets.items.length
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
            items: [{ type: "p2p", total_balance: { approximate_total_balance: "25.00", converted_to: "USD" } }],
          },
        },
      }),
    )

    await expect(resolveWalletListViewState()).resolves.toBe("list")
  })
})
