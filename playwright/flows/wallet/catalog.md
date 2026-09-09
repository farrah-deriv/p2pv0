# Wallet Journey Catalog

**Analysis date:** 2026-06-26

---

## Section 1 — Journey Index

| # | Journey | Spec file | Tags | Priority |
|---|---------|-----------|------|----------|
| Flow 1 | Wallet page loads — total balance, transfer button, USD balance card | `wallet/verify-wallet-loads.spec.ts` | `@desktop @mobile @wallet @smoke @production` | P0 |
| Flow 2 | Click balance card → transaction list with rows | `wallet/verify-wallet-transaction-list.spec.ts` | `@desktop @mobile @wallet @staging` | P1 |
| Flow 3 | Click transaction row → transaction detail panel | `wallet/verify-wallet-transaction-detail.spec.ts` | `@desktop @mobile @wallet @staging` | P1 |
| Flow 4 | Transfer happy path — enter amount, confirm, success | `wallet/verify-wallet-transfer.spec.ts` | `@desktop @mobile @wallet @staging` | P0 |
| Flow 5 | Transfer percentage shortcuts — 25/50/75/100% fill | `wallet/verify-wallet-transfer-percentage.spec.ts` | `@desktop @mobile @wallet @staging` | P2 |
| Flow 6 | Transfer failure — error screen with retry | `wallet/verify-wallet-transfer-failure.spec.ts` | `@desktop @mobile @wallet @staging` | P2 |
| Flow 7 | Deep link `?operation=TRANSFER` — transfer opens automatically | `wallet/verify-wallet-deep-link-transfer.spec.ts` | `@desktop @mobile @wallet @staging` | P1 |
| Flow 8 | Deposit sidebar — Buy button navigates to market | `wallet/verify-wallet-deposit-sidebar.spec.ts` | `@desktop @mobile @wallet @staging` | P2 |
| G1 | Temp ban alert visible on wallet page | `wallet/verify-wallet-temp-ban-alert.spec.ts` | `@desktop @mobile @wallet @staging` | P3 |
| G2 | Disabled account shows access-removed screen | `wallet/verify-wallet-access-removed.spec.ts` | `@desktop @mobile @wallet @staging` | P3 |
| G3 | Transfer KYC gate for unverified account | `wallet/verify-wallet-transfer-kyc-gate.spec.ts` | `@desktop @mobile @wallet @staging` | P3 |
| G4 | No assets empty state | `wallet/verify-wallet-no-assets.spec.ts` | `@desktop @mobile @wallet @staging` | P3 |
| G5 | Empty transactions state for currency with no history | `wallet/verify-wallet-empty-transactions.spec.ts` | `@desktop @mobile @wallet @staging` | P3 |

---

## Section 2 — Flow Details

### Flow 1 — verify-wallet-loads.spec.ts

```typescript
await walletPage.page.goto('/wallet');

// Verify total balance header
await expect(walletPage.page.getByTestId('wallet-text-total-balance')).toBeVisible();

// Verify Transfer button
await expect(walletPage.page.getByTestId('wallet-btn-transfer')).toBeVisible();

// Verify USD balance card
await expect(walletPage.page.getByTestId('wallet-card-balance-USD')).toBeVisible();
await expect(walletPage.page.getByTestId('wallet-text-balance-USD')).toBeVisible();
```

---

### Flow 2 — verify-wallet-transaction-list.spec.ts

```typescript
await walletPage.page.goto('/wallet');

// Click balance card to switch to transaction list view
await walletPage.page.getByTestId('wallet-card-balance-USD').click();
await expect(walletPage.page.getByTestId('wallet-btn-back')).toBeVisible();

// Verify at least one transaction row
await expect(walletPage.page.locator('[data-testid^="wallet-row-tx-"]').first()).toBeVisible();
await expect(walletPage.page.locator('[data-testid^="wallet-badge-tx-type-"]').first()).toBeVisible();
await expect(walletPage.page.locator('[data-testid^="wallet-text-tx-amount-"]').first()).toBeVisible();
await expect(walletPage.page.locator('[data-testid^="wallet-text-tx-date-"]').first()).toBeVisible();

// Navigate back
await walletPage.page.getByTestId('wallet-btn-back').click();
await expect(walletPage.page.getByTestId('wallet-text-total-balance')).toBeVisible();
```

---

### Flow 3 — verify-wallet-transaction-detail.spec.ts

```typescript
await walletPage.page.goto('/wallet');

// Enter transaction list
await walletPage.page.getByTestId('wallet-card-balance-USD').click();

// Click first transaction row
await walletPage.page.locator('[data-testid^="wallet-row-tx-"]').first().click();
await expect(walletPage.page.getByTestId('wallet-details-tx')).toBeVisible();

// Verify detail panel fields
await expect(walletPage.page.getByText('Transaction status')).toBeVisible();
await expect(walletPage.page.getByText('Transaction ID')).toBeVisible();
await expect(walletPage.page.getByText('Transaction type')).toBeVisible();
await expect(walletPage.page.getByText('From')).toBeVisible();
await expect(walletPage.page.getByText('To')).toBeVisible();
await expect(walletPage.page.getByText('Amount')).toBeVisible();
await expect(walletPage.page.getByText('Date')).toBeVisible();
await expect(walletPage.page.getByText('Time')).toBeVisible();

// Navigate back to transaction list
await walletPage.page.getByRole('button', { name: 'Back to transactions' }).click();
```

---

### Flow 4 — verify-wallet-transfer.spec.ts

```typescript
await walletPage.page.goto('/wallet');

// Open Transfer
await walletPage.page.getByTestId('wallet-btn-transfer').click();
await expect(walletPage.page.getByTestId('transfer-container')).toBeVisible();
await expect(walletPage.page.getByRole('heading', { name: 'Transfer' })).toBeVisible();

// From wallet is pre-selected (P2P wallet)
await expect(walletPage.page.getByTestId('transfer-btn-account-from')).toBeVisible();

// Select To wallet
await walletPage.page.getByTestId('transfer-btn-select-to').click();
// Mobile: transfer-sheet-wallet-picker; Desktop: popup with transfer-sheet-wallet-picker-btn-close
await walletPage.page.locator('[data-testid^="transfer-btn-wallet-"]').first().click();
await expect(walletPage.page.getByTestId('transfer-btn-account-to')).toBeVisible();

// Enter amount
await walletPage.page.getByTestId('transfer-input-amount').fill('1');

// Submit
await walletPage.page.getByTestId('transfer-btn-submit').click();
await expect(walletPage.page.getByTestId('transfer-sheet-confirm')).toBeVisible();
await expect(walletPage.page.getByText('Review and confirm')).toBeVisible();

// Confirm
await walletPage.page.getByTestId('transfer-btn-confirm').click();
await expect(walletPage.page.getByText('Transfer successful')).toBeVisible();
await expect(walletPage.page.getByTestId('transfer-success-btn-done')).toBeVisible();
await expect(walletPage.page.getByTestId('transfer-success-btn-details')).toBeVisible();

// Dismiss
await walletPage.page.getByTestId('transfer-success-btn-done').click();
```

---

### Flow 5 — verify-wallet-transfer-percentage.spec.ts

```typescript
await walletPage.page.goto('/wallet');
await walletPage.page.getByTestId('wallet-btn-transfer').click();

// Select To wallet first
await walletPage.page.getByTestId('transfer-btn-select-to').click();
await walletPage.page.locator('[data-testid^="transfer-btn-wallet-"]').first().click();

// Test 25% shortcut
await walletPage.page.getByTestId('transfer-btn-pct-25').click();
const amount25 = await walletPage.page.getByTestId('transfer-input-amount').inputValue();
expect(Number(amount25)).toBeGreaterThan(0);

// Test 100% shortcut
await walletPage.page.getByTestId('transfer-btn-pct-100').click();
const amount100 = await walletPage.page.getByTestId('transfer-input-amount').inputValue();
expect(Number(amount100)).toBeGreaterThan(Number(amount25));

// Verify no error shown
await expect(walletPage.page.getByTestId('transfer-error-amount')).not.toBeVisible();
```

---

### Flow 6 — verify-wallet-transfer-failure.spec.ts

```typescript
await walletPage.page.goto('/wallet');
await walletPage.page.getByTestId('wallet-btn-transfer').click();

// Select wallets and enter failing amount
await walletPage.page.getByTestId('transfer-btn-select-to').click();
await walletPage.page.locator('[data-testid^="transfer-btn-wallet-"]').first().click();
await walletPage.page.getByTestId('transfer-input-amount').fill('99999999'); // Exceeds balance

// Verify error inline
await expect(walletPage.page.getByTestId('transfer-error-amount')).toBeVisible();

// If submit is still possible, test API-level failure
// ...

// On failure screen
await expect(walletPage.page.getByText('Transfer unsuccessful')).toBeVisible();
// CTA buttons
await expect(walletPage.page.getByTestId('transfer-error-btn-retry')).toBeVisible();
await walletPage.page.getByTestId('transfer-error-btn-retry').click();
await expect(walletPage.page.getByTestId('transfer-container')).toBeVisible();
```

---

### Flow 7 — verify-wallet-deep-link-transfer.spec.ts

```typescript
// Navigate directly with deep link
await walletPage.page.goto('/wallet?operation=TRANSFER');

// Transfer container should open automatically
await expect(walletPage.page.getByTestId('transfer-container')).toBeVisible();

// URL should be cleaned (router.replace removes the param)
await expect(walletPage.page).toHaveURL('/wallet');

// From wallet pre-selected (P2P wallet)
await expect(walletPage.page.getByTestId('transfer-btn-account-from')).toBeVisible();
```

---

### Flow 8 — verify-wallet-deposit-sidebar.spec.ts

```typescript
await walletPage.page.goto('/wallet');

// Click balance card to enter currency view
await walletPage.page.getByTestId('wallet-card-balance-USD').click();

// Buy button should be visible in action bar
await expect(walletPage.page.getByTestId('wallet-btn-buy')).toBeVisible();

// Click Buy — navigates to market with buy operation
await walletPage.page.getByTestId('wallet-btn-buy').click();
await expect(walletPage.page).toHaveURL(/\?operation=buy/);
```

---

### G1 — verify-wallet-temp-ban-alert.spec.ts

```typescript
// Login with temp-banned account
await walletPage.page.goto('/wallet');
await expect(walletPage.page.getByTestId('wallet-alert-temp-ban')).toBeVisible();
```

---

### G2 — verify-wallet-access-removed.spec.ts

```typescript
// Login with disabled account
await walletPage.page.goto('/wallet');
await expect(walletPage.page.getByTestId('wallet-msg-access-removed')).toBeVisible();
```

---

### G3 — verify-wallet-transfer-kyc-gate.spec.ts

```typescript
// Login with non-phone-verified or expired KYC account
await walletPage.page.goto('/wallet');
await walletPage.page.getByTestId('wallet-btn-transfer').click();
// KYC alert dialog appears instead of transfer-container
await expect(walletPage.page.getByRole('dialog')).toBeVisible();
await expect(walletPage.page.getByTestId('transfer-container')).not.toBeVisible();
```

---

### G4 — verify-wallet-no-assets.spec.ts

```typescript
// Login with new account, no P2P balance
await walletPage.page.goto('/wallet');
await expect(walletPage.page.getByTestId('wallet-empty-state')).toBeVisible();
await expect(walletPage.page.getByText('No assets yet')).toBeVisible();
```

---

### G5 — verify-wallet-empty-transactions.spec.ts

```typescript
// Login with account that has a balance card but no transactions
await walletPage.page.goto('/wallet');
await walletPage.page.getByTestId('wallet-card-balance-USD').click();
await expect(walletPage.page.getByTestId('wallet-empty-transactions')).toBeVisible();
await expect(walletPage.page.getByText('No transactions found')).toBeVisible();
```

---

## Section 3 — Testid Inventory

### Static testids (page-level)

| Testid | Element | Notes |
|--------|---------|-------|
| `wallet-container` | Page root div | Always present |
| `wallet-text-total-balance` | Total balance text | Balances view only |
| `wallet-btn-transfer` | Transfer action button | Disabled when `!hasBalance` or maintenance active |
| `wallet-btn-buy` | Buy action button | Visible in currency (transaction list) view only |
| `wallet-btn-sell` | Sell action button | Visible in currency view only |
| `wallet-btn-deposit` | Deposit button | Present in DOM but CSS `hidden` — not visible |
| `wallet-btn-back` | Back to balances | Currency/transaction view only |
| `wallet-alert-temp-ban` | Temp ban banner | Only when `tempBanUntil` set and not in maintenance |
| `wallet-empty-state` | No assets empty state | When `balances.length === 0` |
| `wallet-empty-transactions` | No transactions state | When no transactions for currency or in maintenance |
| `wallet-skeleton` | Loading skeleton | During initial balance load |
| `wallet-msg-access-removed` | Disabled account screen | When `user.status === "disabled"` |
| `wallet-sidebar-container` | Deposit/Withdraw sidebar | DEPOSIT or WITHDRAW operation |
| `wallet-sidebar-btn-close` | Close sidebar button | Inside sidebar |
| `wallet-sidebar-btn-deposit` | Marketplace option in deposit | Navigates to `/?operation=buy` |
| `wallet-sidebar-btn-withdraw` | Marketplace option in withdraw | Navigates to `/?operation=sell` |
| `wallet-sidebar-btn-transfer` | Transfer full-screen wrapper | TRANSFER operation container |
| `wallet-details-tx` | Transaction detail panel | When transaction row clicked |
| `wallet-sentinel-load-more` | End of transaction list marker | Shown when transactions exist |

### Dynamic testids

| Pattern | Selector to use | Notes |
|---------|----------------|-------|
| `wallet-card-balance-{currency}` | `getByTestId('wallet-card-balance-USD')` | One per currency; only USD currently shown |
| `wallet-text-balance-{currency}` | `getByTestId('wallet-text-balance-USD')` | Balance text inside the card |
| `wallet-row-tx-{id}` | `[data-testid^="wallet-row-tx-"]` | One per transaction row |
| `wallet-badge-tx-type-{id}` | `[data-testid^="wallet-badge-tx-type-"]` | Transaction type label |
| `wallet-text-tx-amount-{id}` | `[data-testid^="wallet-text-tx-amount-"]` | Amount display |
| `wallet-text-tx-date-{id}` | `[data-testid^="wallet-text-tx-date-"]` | Date display |

### Transfer component testids

| Testid | Element | Notes |
|--------|---------|-------|
| `transfer-container` | Transfer enter-amount screen | `step === "enterAmount"` |
| `transfer-btn-close` | Close transfer | |
| `transfer-btn-select-from` | From wallet selector (unselected) | When no source wallet selected |
| `transfer-btn-account-from` | From wallet selector (selected) | When source wallet is pre-selected |
| `transfer-btn-select-to` | To wallet selector (unselected) | Tap to open picker |
| `transfer-btn-account-to` | To wallet selector (selected) | After wallet chosen |
| `transfer-btn-swap` | Swap From/To wallets | |
| `transfer-input-amount` | Amount input field | |
| `transfer-error-amount` | Inline amount error | Only when invalid amount entered |
| `transfer-btn-pct-25` | 25% shortcut | |
| `transfer-btn-pct-50` | 50% shortcut | |
| `transfer-btn-pct-75` | 75% shortcut | |
| `transfer-btn-pct-100` | 100% shortcut | |
| `transfer-btn-submit` | Transfer submit button | Disabled until amount+wallets valid |
| `transfer-sheet-wallet-picker` | Wallet picker (mobile bottom sheet) | Mobile only |
| `transfer-sheet-wallet-picker-grip` | Drag handle on picker | Mobile only |
| `transfer-sheet-wallet-picker-btn-close` | Close wallet picker (desktop) | Desktop popup only |
| `transfer-btn-wallet-{walletId}` | Wallet option in picker | Dynamic — use `[data-testid^="transfer-btn-wallet-"]` |
| `transfer-sheet-confirm` | Confirm sheet/popup | Both mobile (bottom sheet) and desktop (popup) |
| `transfer-sheet-confirm-grip` | Drag handle on confirm sheet | Mobile only |
| `transfer-sheet-confirm-btn-close` | Close confirm popup | Desktop only |
| `transfer-btn-confirm` | Confirm transfer button | Inside confirm sheet |
| `transfer-success-btn-done` | "Got it" on success screen | `step === "success"` |
| `transfer-success-btn-details` | "View details" on success screen | `step === "success"` |
| `transfer-error-btn-retry` | "Try again" on failure | `step === "unsuccessful"`, CTA varies |
| `transfer-error-btn-cancel` | "Not now" / "Got it" on failure | CTA varies by rejection code |
| `transfer-error-btn-contact` | "Contact us" on failure | Only for `contact_us` rejection CTA |

---

## Section 4 — Feature-Specific Decisions

### 4.1 — Stale testids in existing POM

`playwright/pages/WalletPage.ts` uses **incorrect testids** that do not match the source:

| POM testid (stale) | Actual testid (source) |
|---|---|
| `wallet-p2p-balance` | `wallet-text-total-balance` |
| `wallet-btn-deposit` | Present in DOM but CSS `display:none` (`hidden` class) — **do not assert visible** |
| `wallet-btn-withdraw` | Not present in source; withdraw is accessed via deposit sidebar flow |
| `wallet-transaction-list` | No such testid — use `[data-testid^="wallet-row-tx-"]` |

**The POM must be updated before any flows are implemented.**

### 4.2 — v1 signup accounts are redirected away

`app/wallet/page.tsx` has:
```typescript
if (userData?.signup === "v1") { router.push("/") }
```
v1 accounts are immediately redirected to `/`. All wallet flows require **non-v1 accounts**. Add an assertion at the start of wallet flows that the URL is still `/wallet` after load.

### 4.3 — Two distinct page views: Balances vs Transaction list

The wallet page renders two mutually exclusive views controlled by `displayBalances` state:

- **Balances view** (`displayBalances === true`): shows `wallet-text-total-balance` in dark header, balance cards (`wallet-card-balance-{currency}`), `wallet-btn-transfer`
- **Transaction list view** (`displayBalances === false`): shows `wallet-btn-back`, `wallet-btn-buy`/`wallet-btn-sell` in header, transaction rows

Clicking a balance card transitions from Balances → Transaction list. `wallet-btn-back` returns to Balances. Flows 2, 3, and 8 require clicking a balance card first.

### 4.4 — Deposit and Withdraw buttons are CSS-hidden

`wallet-btn-deposit` and `wallet-btn-withdraw` exist in the DOM inside `WalletSummary` but are wrapped in `className="hidden flex-col ..."` — they are **never visible** in the current UI. Do not assert `toBeVisible()` on these. The active deposit/withdraw path is:

1. Currency view → `wallet-btn-buy` → navigates to `/?operation=buy`
2. Currency view → `wallet-btn-sell` → navigates to `/?operation=sell`

The old "Deposit" sidebar (`wallet-sidebar-container`) is only reachable if `handleDepositClick` is called, which is currently unreachable from the hidden button. Document but do not test.

### 4.5 — Transfer sidebar is full-screen, not a panel

When `operation === "TRANSFER"`, `WalletSidebar` renders a full-screen overlay (`fixed inset-0`) containing the `Transfer` component directly — not a slide-in drawer. `transfer-container` fills the whole screen. `wallet-sidebar-btn-transfer` is the wrapper's testid but `transfer-container` is what the Transfer UI uses.

### 4.6 — Transfer confirm sheet: same testid for mobile and desktop

`transfer-sheet-confirm` is used for both the mobile bottom sheet and the desktop popup — the component renders both based on viewport but shares the testid. Playwright will match either; no viewport fork needed for the confirm step.

### 4.7 — Transfer success "View details" fetches by reference ID

`transfer-success-btn-details` triggers `fetchTransactionByReferenceId(requestId)` — an async API call. After clicking, wait for `wallet-details-tx` to appear before asserting detail content. This may take 1–2 seconds.

### 4.8 — Transfer failure CTA varies by rejection code

The error screen buttons change based on `transferRejectionCta`:
- `contact_us` → only `transfer-error-btn-contact` ("Contact us")
- `got_it` → only `transfer-error-btn-cancel` ("Got it")
- `deposit_now` → only `transfer-error-btn-retry` ("Deposit now")
- `change_method`/`make_changes` → only `transfer-error-btn-retry` ("Try again")
- `got_it_contact_us` → both `transfer-error-btn-cancel` and `transfer-error-btn-contact`
- default → both `transfer-error-btn-cancel` ("Not now") and `transfer-error-btn-retry` ("Try again")

Flow 6 should assert the default case (both buttons visible) using a transfer amount that triggers a generic failure.

### 4.9 — Deep link bypass of hasBalance guard

The `?operation=TRANSFER` deep link bypasses the `!hasBalance` guard in `handleTransferClick`. Even a zero-balance account navigated via this URL will have the transfer sidebar open. Flow 7 does not require a funded account — but the `walletPage.gotoWalletPage('TRANSFER')` method in the POM already handles this correctly.

### 4.10 — Maintenance mode disables transfer and shows empty transactions

When `isMaintenanceActive === true`:
- `wallet-btn-transfer` has `disabled={actionsDisabled}` (disabled)
- Balance shown as `p2pBalanceAmount` (from userData, not the wallet API)
- `wallet-empty-transactions` is shown instead of transaction list (even if transactions exist)

Do not write transfer flows against a maintenance-mode account. Maintenance flows are a separate gap (not in scope for current flows).

### 4.11 — Serial mode for transfer flows

Flows 4, 5, and 6 all mutate wallet balance state. Run them in `test.describe.configure({ mode: 'serial' })` to prevent concurrent balance changes causing assertion failures.
