# 📋 Buy-Sell Journey Spec — What to Test

> **Purpose:** Describes the order sidebar placement flows on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** Order sidebar — `components/buy-sell/order-sidebar.tsx` and related confirmation modals; entry point is `app/page.tsx` (root `/` route)
> **URL:** `https://staging-dp2p.deriv.com/`
> **Authentication:** Required — all tests start from a logged-in state
> **Related module:** See `playwright/flows/market/flow.md` for ad listing, tab switching, currency filter, and risk warning flows

---

## Section 1 — Shared Steps

> Referenced by Flows 1–4. Assumes the user is already logged in.

**Prerequisites:** Valid staging account (`TEST_EMAIL`, `TEST_PASSWORD`); KYC verified; not temp-banned; at least one active ad in the default currency

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Login via Ory Kratos | Redirected to `/` (P2P Markets page) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Verify market loaded | Observe the page | "Buy" and "Sell" tab triggers visible; at least one ad row visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-buy-sell-sidebar-buy-side.spec.ts

**Display name:** Buy-side order sidebar — content verification, place-order guard, and close

**Prerequisites:** At least one sell-type ad on staging (visible on the Buy tab); logged-in user is not the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Steps | Market page loads; "Buy" tab is active by default | — |
| 2 | Open order sidebar | Click the "Buy {currency}" action button on a sell-type ad row | Order sidebar opens as a full-screen overlay | — |
| 3 | Verify sidebar title | Observe the sidebar heading | Heading contains "Buy" and the currency code (e.g. "Buy USD") | — |
| 4 | Verify sidebar content | Observe sidebar elements | Exchange rate value, order limit range ("Order limit: {min} – {max}"), and amount input with placeholder "0.00" are all visible | — |
| 5 | Verify "You pay" label | Observe the amount section | "You pay" label is visible (buy-side: user pays local currency to receive crypto) | — |
| 6 | Verify no payment method selector | Observe the sidebar | The payment method selection button is **not** visible — buy-side does not require the user to select a payment method | — |
| 7 | Verify "Place order" initially disabled | Observe the "Place order" button | Button is disabled when no amount is entered | — |
| 8 | Enter a valid amount | Type a value within the ad's min–max limits in the amount input | "Place order" button becomes enabled; no error message shown | `Amount within [ad.min_limit, ad.max_limit]` |
| 9 | Close the sidebar | Click the close (✕) button | Sidebar slides out; market page is fully visible again; no sidebar overlay | — |

---

### Flow 2 — verify-buy-sell-sidebar-sell-side.spec.ts

**Display name:** Sell-side order sidebar — content verification and payment method required guard

**Prerequisites:** At least one buy-type ad on staging (visible on the Sell tab); logged-in user has at least one payment method configured; user is not the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Steps | Market page loads | — |
| 2 | Switch to Sell tab | Click the "Sell" tab trigger | Sell tab becomes active; ad rows show "Sell {currency}" action buttons | — |
| 3 | Open order sidebar | Click the "Sell {currency}" action button on a buy-type ad row | Order sidebar opens | — |
| 4 | Verify sidebar title | Observe the sidebar heading | Heading contains "Sell" and the currency code (e.g. "Sell USD") | — |
| 5 | Verify "You pay" label | Observe the amount section | "You pay" label is visible (sell-side: user pays from P2P balance) | — |
| 6 | Verify payment method selector visible | Observe the sidebar | A "Select payment method" button is visible — sell-side requires the user to specify where to receive payment | — |
| 7 | Verify "Place order" disabled (no input) | Observe the "Place order" button | Button is disabled — neither amount nor payment method selected | — |
| 8 | Enter a valid amount only | Type a value within limits in the amount input; do not select a payment method | "Place order" button remains disabled | `Amount within [ad.min_limit, ad.max_limit]` |
| 9 | Verify payment method still required | Observe the "Place order" button | Button stays disabled because no payment method has been selected | — |

---

### Flow 3 — verify-buy-sell-payment-selection.spec.ts

**Display name:** Payment method selection panel — open, select, and confirm

**Prerequisites:** Sell-side order sidebar is accessible; logged-in user has at least one payment method compatible with the advertiser's accepted methods

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Steps | Market page loads | — |
| 2 | Switch to Sell tab and open sidebar | Click "Sell" tab; click "Sell {currency}" on a buy-type ad row | Order sidebar opens | — |
| 3 | Open payment method panel | Click the payment method selection button | Payment method selection modal/panel opens showing the user's available payment methods as a list of checkboxes | — |
| 4 | Select a payment method | Click the checkbox next to one payment method | Checkbox becomes checked | — |
| 5 | Confirm selection | Click the "Confirm" button | Panel closes; the selected payment method name is displayed in the sidebar below the selection button | — |
| 6 | Verify "Place order" still disabled | Observe the "Place order" button | Button is still disabled — amount has not been entered yet | — |
| 7 | Enter a valid amount | Type a value within the ad's limits in the amount input | "Place order" button becomes enabled | `Amount within [ad.min_limit, ad.max_limit]` |

---

### Flow 4 — verify-buy-sell-amount-validation.spec.ts

**Display name:** Amount input validation — order limit errors

**Prerequisites:** At least one ad on staging (either side); order sidebar can be opened

#### Below minimum limit

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Steps; click any Buy/Sell button to open the order sidebar | Order sidebar is open | — |
| 2 | Enter amount below minimum | Type a value smaller than the ad's minimum order limit | Inline error appears below the amount input: "Order limit: {min} – {max} {currency}" | `Amount < ad.min_limit (e.g. 0.01)` |
| 3 | Verify "Place order" disabled | Observe the "Place order" button | Button remains disabled while the error is shown | — |
| 4 | Correct the amount | Clear and type a valid amount within limits | Error disappears; "Place order" reflects the updated enabled/disabled state | — |

#### Above maximum limit

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Steps; open the order sidebar | Order sidebar is open | — |
| 2 | Enter amount above maximum | Type a value larger than the ad's maximum order limit | Inline error appears: "Order limit: {min} – {max} {currency}" | `Amount > ad.max_limit (e.g. 9999999)` |
| 3 | Verify "Place order" disabled | Observe the "Place order" button | Button remains disabled | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Place sell-side order end-to-end

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Sell order created successfully | On Sell tab, click "Sell {currency}" on a buy-type ad; select a payment method; enter a valid amount within limits; click "Place order" | Order is created; page navigates to `/orders/{orderId}` |

> **Note:** This is a mutating test — it creates a real order on staging. Requires a dedicated test account. See also `playwright/flows/market/flow.md — Flow 7` for the buy-side equivalent (which is NOT duplicated here).

---

### G2 — Insufficient P2P balance prevents sell order

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Amount above P2P balance shows error | Open a sell-side order sidebar (Sell tab → buy-type ad); enter an amount greater than the logged-in user's current P2P wallet balance | Inline error "Insufficient balance" appears below the amount input; "Place order" button remains disabled |

> **Note:** Requires a staging account whose P2P balance is known and limited. The zero-balance banner is covered in `playwright/flows/market/flow.md — G2`.

---

### G3 — Rate change confirmation modal

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Rate update shows confirmation modal | Open a float-rate ad's order sidebar; while the sidebar is open, the exchange rate changes on the backend (via WebSocket) | "Rate updated" modal appears with the old rate, the new rate, "Confirm and continue", and "Go back" buttons visible |
| 2 | "Confirm and continue" proceeds with new rate | Click "Confirm and continue" in the rate-change modal | Modal closes; order placement proceeds at the updated rate |
| 3 | "Go back" dismisses without placing order | Click "Go back" | Modal closes; user is returned to the sidebar where the new rate is now displayed |

> **Note:** Requires staging timing: the float-rate ad's rate must change while the sidebar is open. May be triggered more deterministically by a float-rate ad on a currency with frequent rate updates, or via a backend tool that pushes a rate-change WebSocket event.

---

### G4 — Ad updated confirmation modal

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Ad detail change shows confirmation modal | Open an order sidebar; while the sidebar is open, the advertiser updates the ad (limits, rate, or payment methods) | "Ad updated" modal appears with a "Review changes" button |
| 2 | "Review changes" refreshes sidebar content | Click "Review changes" | Modal closes; sidebar content updates to reflect the latest ad details |

> **Note:** Requires staging cooperation — the advertiser account must update the ad while the user's sidebar is open. Can also be triggered if the `Place order` API returns an `OrderAdvertVersionChanged` error.

---

### G5 — Add payment method from order sidebar

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | "Add payment method" link shown when no compatible methods | Open a sell-side order sidebar when the user has no payment methods compatible with the advertiser's accepted methods; open the payment method panel | An "Add payment method" link is shown in the panel (instead of, or alongside, an empty list) |
| 2 | Clicking "Add payment method" navigates away | Click the "Add payment method" link | User navigates to the payment method management screen where a new method can be added |

---

### G6 — Own-ad Buy/Sell button suppression

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Own ads do not show a Buy/Sell action button | Login as a user who has an active buy-type or sell-type ad; navigate to the market page and locate that user's own ad in the list | No "Buy {currency}" or "Sell {currency}" button is rendered on the user's own ad row |
