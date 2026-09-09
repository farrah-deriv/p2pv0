# 📋 Market Journey Spec — What to Test

> **Purpose:** Describes the P2P Markets page flows on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** Markets (root route — `app/page.tsx`)
> **URL:** `https://staging-dp2p.deriv.com/`
> **Authentication:** Required — all tests start from a logged-in state
> **Staging only:** Some flows mutate account state (order placement, filter persistence)

---

## Section 1 — Shared Navigation Steps

> Referenced by Flows 1–9. Assumes the user is already logged in.

**Prerequisites:** Valid staging account (`TEST_EMAIL`, `TEST_PASSWORD`)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Login via Ory Kratos | Redirected to `/` (P2P Markets) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Verify market page loaded | Observe the page | "Buy" and "Sell" tab triggers are visible; ad table header row is visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-market-page-loads.spec.ts

**Display name:** Market page loads with Buy/Sell tabs and ad list

**Prerequisites:** Staging has active ads in the default currency

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads without errors | — |
| 2 | Verify Buy tab is active by default | Observe the Tabs component | "Buy" tab trigger is visible and has active styling | — |
| 3 | Verify table column headers | Observe the ad table header row (desktop) | "Advertisers", "Rates", "Payment methods" column headings are visible | — |
| 4 | Verify at least one ad row | Observe the ad list | At least one ad card/row is visible containing an advertiser name, rate value, and a Buy/Sell action button | — |
| 5 | Verify currency filter button | Observe the filter bar | Currency filter button (showing a currency code) is visible | — |
| 6 | Verify payment method filter button | Observe the filter bar | "Payment method" filter button is visible | — |
| 7 | Verify filter/sort button | Observe the filter bar | Filter button (with funnel icon) is visible | — |

---

### Flow 2 — verify-market-tab-switch.spec.ts

**Display name:** Switch between Buy and Sell tabs to see corresponding ads

**Prerequisites:** Staging has active buy-type and sell-type ads

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads; "Buy" tab is active | — |
| 2 | Note current ads | Observe ad list | At least one ad row is visible under the Buy tab | — |
| 3 | Click Sell tab | Click the "Sell" tab trigger | Sell tab becomes active; ad list refreshes; action buttons in ad rows change from "Buy {currency}" to "Sell {currency}" | — |
| 4 | Click Buy tab again | Click the "Buy" tab trigger | Buy tab becomes active again; action button labels return to "Buy {currency}" | — |

---

### Flow 3 — verify-market-currency-filter.spec.ts

**Display name:** Change currency via the CurrencyFilter to see currency-specific ads

**Prerequisites:** At least two active currencies exist on staging

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads with default currency | — |
| 2 | Open currency filter | Click the currency filter button | Desktop: Popover opens; Mobile: bottom Drawer opens (90vh); search input is visible | — |
| 3 | Search for a currency | Type a 3-letter currency code in the search input | Currency list filters to show matching currencies | `e.g. "USD"` |
| 4 | Select a currency | Click a currency from the list | Filter closes; page shows "I want to buy {currency}" / "I want to sell {currency}" heading; ad list refreshes for that currency | — |
| 5 | Verify no-results state | Type a non-existent currency code | Empty state shows "{currency} is unavailable" | `e.g. "ZZZ"` |

---

### Flow 4 — verify-market-payment-method-filter.spec.ts

**Display name:** Filter ads by payment method to show only matching ads

**Prerequisites:** Staging has ads with multiple payment methods configured

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads | — |
| 2 | Open payment method filter | Click the "Payment method" filter button | Desktop: Popover opens; Mobile: bottom Drawer opens with heading "Payment method"; search input and payment method list are visible | — |
| 3 | Deselect all / select a specific method | Uncheck "All payment method" then check a specific method | Only that method remains selected | — |
| 4 | Apply the filter | Click "Apply" button | Filter closes; "Payment method (1)" label appears on the filter button; ad list refreshes showing only ads with the selected payment method | — |
| 5 | Reset the filter | Reopen the filter; click "Reset" | Filter resets to all payment methods selected; filter button reverts to "Payment method" label | — |

---

### Flow 5 — verify-market-filter-sort.spec.ts

**Display name:** Apply market sort and "Ads from following" filter via the filter dropdown

**Prerequisites:** Logged-in user follows at least one advertiser who has active ads

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads | — |
| 2 | Open filter dropdown | Click the Filter button (funnel icon) | Desktop: Popover opens with "Filter" heading; Mobile: bottom Drawer opens; "Ads from advertisers you follow" checkbox and "Sort by" radio group are visible | — |
| 3 | Enable "Ads from following" | Check the "Ads from advertisers you follow" checkbox | Checkbox becomes checked | — |
| 4 | Change sort order | Select "Exchange rate (low-high)" radio option | Radio option is selected | — |
| 5 | Apply filters (mobile only) | Click "Apply filters" button (mobile only) | Filter closes; red dot indicator appears on the Filter button; ad list re-orders accordingly | — |
| 6 | Reset filters (mobile only) | Reopen filter; click "Reset" | All filters reset to default; red dot disappears from Filter button | — |

---

### Flow 6 — verify-market-order-sidebar.spec.ts

**Display name:** Open order sidebar by clicking a Buy/Sell button on an ad row

**Prerequisites:** Market has active ads; logged-in user is KYC verified and not the same as the advertiser; user is not temp-banned

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads; ad rows are visible | — |
| 2 | Click the Buy/Sell button | Click the "Buy {currency}" or "Sell {currency}" button on any ad row | Order sidebar opens (full-screen overlay) with the ad's details | — |
| 3 | Verify sidebar content | Observe the order sidebar | Amount input with placeholder "0.00", exchange rate info, order limit info, "Place order" button are all visible | — |
| 4 | Verify "Place order" is initially disabled | Observe the Place order button | "Place order" button is disabled (no amount entered) | — |
| 5 | Enter an amount within limits | Type a valid amount in the amount input | "Place order" button becomes enabled | — |

---

### Flow 7 — verify-market-place-buy-order.spec.ts

**Display name:** Place a buy order from the market page order sidebar

**Prerequisites:** Logged-in user is KYC verified; has a funded P2P wallet; the ad is a sell-type ad (visible on Buy tab); user is not temp-banned

> **Note:** This is a mutating test — it creates a real order on staging. Use a dedicated test account.

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads | — |
| 2 | Open order sidebar | Click the "Buy {currency}" button on a sell-type ad row | Order sidebar opens | — |
| 3 | Select payment method | Under "Receive payment to", select a payment method from the list | Payment method is selected; "Selected" label appears on the chosen method | — |
| 4 | Enter order amount | Enter a valid amount within the advertiser's limits | Amount is accepted; "Insufficient balance" error is not shown | — |
| 5 | Click Place order | Click the "Place order" button | Order is created; page navigates to `/orders/{orderId}` | — |

---

### Flow 8 — verify-market-advertiser-profile-link.spec.ts

**Display name:** Navigate to an advertiser profile by clicking their name on an ad row

**Prerequisites:** Logged-in user is KYC verified; market has active ads

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads; ad rows are visible | — |
| 2 | Click an advertiser name | Click the advertiser nickname/name link in any ad row | Page navigates to `/advertiser/{advertiserId}` | — |
| 3 | Verify advertiser profile loaded | Observe the destination page | Advertiser name heading is visible; back navigation is available | — |

---

### Flow 9 — verify-market-advertiser-search.spec.ts

**Display name:** Search for an advertiser by nickname using mobile search (mobile only)

**Prerequisites:** Mobile viewport; known advertiser nickname exists on staging; user is KYC verified

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Market page loads | — |
| 2 | Open the search sheet | Tap the search icon/button | Full-screen Sheet opens (slides from top) with a search input focused | — |
| 3 | Type an advertiser nickname | Type a known nickname in the search input | Results list populates with matching advertiser ad cards | `TEST_ADVERTISER_NICKNAME` |
| 4 | Verify search results | Observe the results list | At least one result card is visible showing the advertiser's name and ad details | — |
| 5 | Tap an ad result to open sidebar | Tap the Buy/Sell button on a result card | Search sheet closes; order sidebar opens back on the market page | — |
| 6 | Verify no-results state | Clear and type a non-existent nickname | Empty state shows "No results found for {query}" | `e.g. "zzznobodyyy"` |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Maintenance mode disables market interactions

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Market in maintenance mode | Force `isMaintenanceActive = true` (or use a staging env where maintenance is active); navigate to `/` | "No ads available" heading is visible; Buy/Sell buttons on ad rows are disabled or hidden; maintenance empty state is shown |

> **Note:** This requires either backend cooperation or a staging environment that simulates maintenance state. Cannot be triggered from the UI alone.

---

### G2 — No balance warning shown when P2P wallet is empty

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Zero P2P balance shows warning banner | Login with an account that has zero P2P wallet balance; navigate to `/` | `P2PBalanceWarning` alert is visible with title "No balance in P2P Wallet" and "Transfer funds" button |
| 2 | Transfer funds button navigates to wallet transfer | Click "Transfer funds" | Page navigates to `/wallet?operation=TRANSFER` |

---

### G3 — KYC gate blocks order placement from market

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Unverified user cannot open order sidebar | Login with a KYC-unverified account; navigate to `/`; click any Buy/Sell button | KYC onboarding alert dialog is shown instead of opening the order sidebar |

---

### G4 — Deep link auto-selects tab and currency

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | `?operation=sell` activates Sell tab | Navigate to `/?operation=sell` | Sell tab is active on page load |
| 2 | `?operation=buy` activates Buy tab | Navigate to `/?operation=buy` | Buy tab is active on page load |
| 3 | `?currency=USD` pre-selects currency | Navigate to `/?currency=USD` | Currency filter shows "USD"; ad list shows USD ads |
| 4 | Combined deep link | Navigate to `/?operation=sell&currency=USD` | Sell tab is active AND currency is pre-set to USD |

---

### G5 — Risk warning modal intercepts high-risk advertiser interaction

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Low completion rate shows risk warning | Click Buy/Sell on an ad from an advertiser with low completion rate | Risk warning modal appears with "This advertiser has a low completion rate" title; "Continue anyway" and "Go back" buttons are visible |
| 2 | "Go back" closes the modal | Click "Go back" in the risk warning modal | Modal closes; market page is still shown; order sidebar does NOT open |
| 3 | "Continue anyway" opens order sidebar | Click "Continue anyway" | Modal closes; order sidebar opens for the selected ad |

> **Note:** Triggering the risk warning requires an advertiser whose stats meet the risk thresholds defined in `components/buy-sell/risk-warning/risk-warning-rules.ts`. This may require a specially configured staging account.
