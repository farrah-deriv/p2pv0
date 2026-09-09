# 📋 Wallet Journey Spec — What to Test

> **Purpose:** Describes the Wallet module on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** P2P Wallet (`/wallet`)
> **URL:** `https://staging-dp2p.deriv.com/wallet`
> **Authentication:** Required — all tests start from a logged-in state

---

## Section 1 — Shared Step Pattern

### Wallet Page Navigation Steps

> Referenced by Flows 1–8. Entry point for all wallet flows.

**Prerequisites:** Logged-in account with P2P enabled, phone verified, non-expired KYC (`TEST_EMAIL` / `TEST_PASSWORD`). Account must **not** have `signup === "v1"` (v1 accounts are redirected to `/`).

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` (Markets page) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to Wallet | Click Wallet in the navigation | URL becomes `/wallet`; `wallet-container` is visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-wallet-loads.spec.ts

**Prerequisites:** Any KYC-verified, non-v1 account.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Verify total balance | Observe the header | `wallet-text-total-balance` is visible showing an amount and currency (e.g. "0.00 USD") | — |
| 4 | Verify transfer button | Observe the action bar | `wallet-btn-transfer` is visible | — |
| 5 | Verify balance card | Observe the balances section | At least one balance card `wallet-card-balance-USD` is visible | — |
| 6 | Verify balance amount | Observe the USD balance card | `wallet-text-balance-USD` shows an amount in the format "0.00 USD" | — |

---

### Flow 2 — verify-wallet-transaction-list.spec.ts

**Prerequisites:** Account with at least one past transaction in the P2P wallet.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Click balance card | Click `wallet-card-balance-USD` | Balances view switches to transaction list view; `wallet-btn-back` is visible | — |
| 4 | Verify transaction rows | Observe the transaction list | At least one row with testid `wallet-row-tx-{id}` is visible | — |
| 5 | Verify transaction type | Observe a row | `wallet-badge-tx-type-{id}` shows "Deposit", "Withdraw", or "Transfer" | — |
| 6 | Verify transaction amount | Observe the same row | `wallet-text-tx-amount-{id}` shows an amount and currency | — |
| 7 | Verify transaction date | Observe the same row | `wallet-text-tx-date-{id}` shows a date or "Today" | — |
| 8 | Navigate back | Click `wallet-btn-back` | Returns to balances view; `wallet-text-total-balance` visible in the dark header | — |

---

### Flow 3 — verify-wallet-transaction-detail.spec.ts

**Prerequisites:** Account with at least one past transaction.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Click balance card | Click `wallet-card-balance-USD` | Transaction list view loads | — |
| 4 | Click a transaction row | Click `wallet-row-tx-{id}` | Transaction detail panel `wallet-details-tx` is visible | — |
| 5 | Verify status | Observe the detail panel | "Transaction status" label and status value ("Success" or "Processing") are visible | — |
| 6 | Verify transaction ID | Observe the detail panel | "Transaction ID" label and a numeric ID are visible | — |
| 7 | Verify from/to wallets | Observe the detail panel | "From" and "To" labels with wallet names are visible | — |
| 8 | Verify amount and date | Observe the detail panel | "Amount", "Date", and "Time" rows are visible with values | — |
| 9 | Navigate back | Click the back button (aria-label "Back to transactions") | Returns to the transaction list | — |

---

### Flow 4 — verify-wallet-transfer.spec.ts

**Prerequisites:** Account with P2P balance > 0 (funded account). Phone verified, non-expired KYC.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Click Transfer | Click `wallet-btn-transfer` | Transfer container `transfer-container` opens; "Transfer" heading visible | — |
| 4 | Verify wallet selectors | Observe the form | "From" selector (`transfer-btn-account-from`) and "To" selector (`transfer-btn-select-to`) are visible | — |
| 5 | Select destination wallet | Click the "To" selector | Wallet picker sheet/popup opens; P2P Wallet and Trading Wallet sections visible | — |
| 6 | Choose a wallet | Click a wallet in the picker (e.g. Trading Wallet) | Picker closes; "To" selector updates to show the selected wallet name | — |
| 7 | Enter amount | Type a valid amount into `transfer-input-amount` | Amount is shown in the input; no error displayed | Transfer amount ≤ available balance |
| 8 | Submit transfer | Click `transfer-btn-submit` | Confirm sheet/popup `transfer-sheet-confirm` opens; "Review and confirm" heading visible | — |
| 9 | Verify review details | Observe the confirm sheet | "From", "To", and "Transfer amount" rows are visible with correct values | — |
| 10 | Confirm transfer | Click `transfer-btn-confirm` | Success screen appears; "Transfer successful" heading visible; `transfer-success-btn-done` and `transfer-success-btn-details` buttons visible | — |
| 11 | Dismiss success screen | Click `transfer-success-btn-done` | Transfer sidebar closes; returns to wallet balances view | — |

---

### Flow 5 — verify-wallet-transfer-percentage.spec.ts

**Prerequisites:** Account with P2P balance > 0. Phone verified, non-expired KYC.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Transfer | Click `wallet-btn-transfer` | `transfer-container` opens | — |
| 4 | Select destination wallet | Click "To" selector → choose Trading Wallet | "To" wallet selector updates | — |
| 5 | Click 25% shortcut | Click `transfer-btn-pct-25` | `transfer-input-amount` is filled with 25% of the source balance | — |
| 6 | Click 50% shortcut | Click `transfer-btn-pct-50` | Input updates to 50% of balance | — |
| 7 | Click 100% shortcut | Click `transfer-btn-pct-100` | Input updates to 100% of balance (full amount) | — |
| 8 | Verify no error | Observe the input area | No `transfer-error-amount` error shown when amount ≤ balance | — |

---

### Flow 6 — verify-wallet-transfer-failure.spec.ts

**Prerequisites:** Account where the transfer will be rejected (e.g. amount that triggers a known rejection code). Phone verified, non-expired KYC.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Transfer | Click `wallet-btn-transfer` | `transfer-container` opens | — |
| 4 | Select wallets and enter amount | Select From/To wallets; enter an amount that causes a transfer failure | Amount field populated | — |
| 5 | Submit | Click `transfer-btn-submit` → confirm in `transfer-sheet-confirm` → click `transfer-btn-confirm` | Error / unsuccessful screen appears; "Transfer unsuccessful" heading visible | — |
| 6 | Verify error CTA | Observe the error screen | At least one action button visible: `transfer-error-btn-retry` ("Try again") or `transfer-error-btn-cancel` ("Not now") | — |
| 7 | Retry | Click `transfer-error-btn-retry` | Returns to the transfer enter-amount form (`transfer-container`) | — |

---

### Flow 7 — verify-wallet-deep-link-transfer.spec.ts

**Prerequisites:** Account with P2P balance > 0. Phone verified, non-expired KYC.

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate via deep link | Navigate directly to `/wallet?operation=TRANSFER` | Wallet page loads; `transfer-container` opens automatically; "Transfer" heading visible | — |
| 3 | Verify URL cleaned | Observe the URL after load | URL becomes `/wallet` (param consumed by `router.replace`) | — |
| 4 | Verify From wallet pre-selected | Observe the From selector | `transfer-btn-account-from` shows P2P wallet pre-selected | — |

---

### Flow 8 — verify-wallet-deposit-sidebar.spec.ts

**Prerequisites:** Account with phone verified, non-expired KYC.

> Follows [Wallet Page Navigation Steps](#wallet-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Click balance card | Click `wallet-card-balance-USD` | Transaction list view loads | — |
| 4 | Verify Buy button visible | Observe the action bar | `wallet-btn-buy` is visible | — |
| 5 | Click Buy | Click `wallet-btn-buy` | Navigates to Markets page (`/`) with `?operation=buy` query param | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Wallet page: temp ban alert

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify temp ban banner | Log in with a temporarily banned account; navigate to `/wallet` | `wallet-alert-temp-ban` element is visible on the page |

---

### G2 — Wallet page: access removed / disabled account

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify access removed screen | Log in with a disabled account (`user.status === "disabled"`); navigate to `/wallet` | `wallet-msg-access-removed` element replaces normal wallet content |

---

### G3 — Transfer: KYC gate when unverified

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Trigger KYC alert on Transfer | Log in with an account that is NOT phone-verified or has expired KYC; navigate to `/wallet`; click `wallet-btn-transfer` | KYC onboarding alert dialog appears instead of the transfer flow |

---

### G4 — Wallet page: no assets empty state

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify no assets empty state | Log in with a new account that has no P2P wallet balance; navigate to `/wallet` | `wallet-empty-state` element is visible; text "No assets yet" shown |

---

### G5 — Transaction list: empty state for currency with no history

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify empty transactions | Log in with an account with a balance card but no transactions; click `wallet-card-balance-USD` | `wallet-empty-transactions` element is visible; text "No transactions found" shown |
