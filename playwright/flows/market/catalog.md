# 📦 Market Technical Catalog

> **Purpose:** TypeScript method chains, locator tables, and implementation decisions for all market flows.
>
> **Feature location:** Markets (root route — `app/page.tsx`, `MarketPage.ts` POM)
> **Playwright test folder:** `playwright/tests/market/`
> **Page Object:** `playwright/pages/MarketPage.ts`

---

## Section 1 — Flow Map

| # | Journey | Spec file | Tags |
|---|---------|-----------|------|
| Flow 1 | Market page loads with Buy/Sell tabs and ad list | `market/verify-market-page-loads.spec.ts` | `@market @smoke @production @desktop @mobile` |
| Flow 2 | Switch between Buy and Sell tabs | `market/verify-market-tab-switch.spec.ts` | `@market @smoke @desktop @mobile` |
| Flow 3 | Change currency via CurrencyFilter | `market/verify-market-currency-filter.spec.ts` | `@market @staging @desktop @mobile` |
| Flow 4 | Filter ads by payment method | `market/verify-market-payment-method-filter.spec.ts` | `@market @staging @desktop @mobile` |
| Flow 5 | Apply sort and "Ads from following" filter | `market/verify-market-filter-sort.spec.ts` | `@market @staging @desktop @mobile` |
| Flow 6 | Open order sidebar from market ad row | `market/verify-market-order-sidebar.spec.ts` | `@market @smoke @staging @desktop @mobile` |
| Flow 7 | Place a buy order from market | `market/verify-market-place-buy-order.spec.ts` | `@market @staging @desktop @mobile` |
| Flow 8 | Navigate to advertiser profile from market | `market/verify-market-advertiser-profile-link.spec.ts` | `@market @staging @desktop @mobile` |
| Flow 9 | Search advertiser by nickname (mobile) | `market/verify-market-advertiser-search.spec.ts` | `@market @staging @mobile` |
| G1 | Maintenance mode disables interactions | `market/verify-market-maintenance.spec.ts` | `@market @staging @desktop @mobile` |
| G2 | No balance warning when P2P wallet is empty | `market/verify-market-no-balance-warning.spec.ts` | `@market @staging @desktop @mobile` |
| G3 | KYC gate blocks order placement | `market/verify-market-kyc-gate.spec.ts` | `@market @staging @desktop @mobile` |
| G4 | Deep link auto-selects tab and currency | `market/verify-market-deep-link.spec.ts` | `@market @staging @desktop @mobile` |
| G5 | Risk warning modal intercepts high-risk advertiser | `market/verify-market-risk-warning.spec.ts` | `@market @staging @desktop @mobile` |

---

## Section 2 — Flow Details

### Flow 1 — verify-market-page-loads.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
await expect(page.getByRole("tablist").getByTestId("markets-tab-buy"), "Buy tab should be visible").toBeVisible();
await expect(page.getByRole("tablist").getByTestId("markets-tab-sell"), "Sell tab should be visible").toBeVisible();
// Desktop table headers
await expect(page.getByRole("columnheader", { name: "Advertisers" }), "Advertisers column header should be visible").toBeVisible();
await expect(page.getByRole("columnheader", { name: "Rates" }), "Rates column header should be visible").toBeVisible();
await expect(page.getByRole("columnheader", { name: "Payment methods" }), "Payment methods column header should be visible").toBeVisible();
// Ad rows
await expect(page.getByTestId("markets-list-ads"), "Ad list should be visible").toBeVisible();
// Filter controls
await expect(page.getByTestId("currency-filter-btn-trigger"), "Currency filter button should be visible").toBeVisible();
await expect(page.getByTestId("payment-filter-btn-trigger"), "Payment method filter button should be visible").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Buy tab trigger | `page.getByRole("tablist").getByTestId("markets-tab-buy")` | `data-testid="markets-tab-buy"` in `app/page.tsx:502` | ✅ |
| Sell tab trigger | `page.getByRole("tablist").getByTestId("markets-tab-sell")` | `data-testid="markets-tab-sell"` in `app/page.tsx:510` | ✅ |
| Advertisers column header | `page.getByRole("columnheader", { name: "Advertisers" })` | `t("market.advertisers")` → "Advertisers" | 🔍 Verify on staging (no `role=columnheader` confirmed — may need `getByText`) |
| Rates column header | `page.getByText("Rates")` | `t("market.rates")` → "Rates" | ✅ |
| Payment methods column header | `page.getByText("Payment methods")` | `t("market.paymentMethods")` → "Payment methods" | ✅ |
| Ad list container | `page.getByTestId("markets-list-ads")` | `data-testid="markets-list-ads"` in `app/page.tsx:756` | ✅ |
| Individual ad card | `page.getByTestId(\`markets-card-ad-${adId}\`)` | `data-testid=\`markets-card-ad-${ad.id}\`` in `app/page.tsx:762` | ✅ |
| Empty state | `page.getByTestId("markets-empty-state")` | `data-testid="markets-empty-state"` in `app/page.tsx:730` | ✅ |
| Currency filter button | `page.getByTestId("currency-filter-btn-trigger")` | `data-testid="currency-filter-btn-trigger"` in `currency-filter.tsx:173` | ✅ |
| Payment method filter button | `page.getByTestId("payment-filter-btn-trigger")` | `data-testid="payment-filter-btn-trigger"` in `payment-methods-filter.tsx:295` | ✅ |
| Market filter trigger button | `page.getByTestId("market-filter-btn-trigger")` | `data-testid="market-filter-btn-trigger"` in `market-filter-dropdown.tsx:175` | ✅ |

---

### Flow 2 — verify-market-tab-switch.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
// Default: Buy tab active
await expect(page.getByRole("tablist").getByTestId("markets-tab-buy"), "Buy tab should be active by default").toHaveAttribute("data-state", "active");
// Switch to Sell
await page.getByRole("tablist").getByTestId("markets-tab-sell").click();
await expect(page.getByRole("tablist").getByTestId("markets-tab-sell"), "Sell tab should become active").toHaveAttribute("data-state", "active");
// Verify Sell action buttons appear (ad-id-suffixed testids — use regex on first visible)
await expect(page.getByRole("button", { name: /Sell/ }).first(), "Sell action button should be visible on Sell tab").toBeVisible();
// Switch back to Buy
await page.getByRole("tablist").getByTestId("markets-tab-buy").click();
await expect(page.getByRole("tablist").getByTestId("markets-tab-buy"), "Buy tab should become active again").toHaveAttribute("data-state", "active");
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Buy tab | `page.getByRole("tablist").getByTestId("markets-tab-buy")` | `data-testid="markets-tab-buy"` in `app/page.tsx:502` | ✅ |
| Sell tab | `page.getByRole("tablist").getByTestId("markets-tab-sell")` | `data-testid="markets-tab-sell"` in `app/page.tsx:510` | ✅ |
| Buy action button (per row) | `page.getByTestId(\`markets-btn-buy-${adId}\`)` | `data-testid=\`markets-btn-buy-${ad.id}\`` in `app/page.tsx:918` | ✅ |
| Sell action button (per row) | `page.getByTestId(\`markets-btn-sell-${adId}\`)` | `data-testid=\`markets-btn-sell-${ad.id}\`` in `app/page.tsx:918` | ✅ |

> **⚠️ Tab value inversion:** In `app/page.tsx`, the "Buy" tab has `value="sell"` and the "Sell" tab has `value="buy"`. This is intentional — "Buy" tab shows sell-type ads (ads where advertisers sell crypto). The `data-state="active"` attribute is what the test observes, not the internal `value` prop. See Decision D1.

---

### Flow 3 — verify-market-currency-filter.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
// Open currency filter
await page.getByTestId("currency-filter-btn-trigger").click();
// Desktop: Popover; Mobile: Drawer (90vh)
const searchInput = page.getByTestId("currency-filter-input-search");
await expect(searchInput, "Currency search input should be visible").toBeVisible();
// Search
await searchInput.fill("USD");
// Select currency from list
await page.getByTestId("currency-filter-btn-USD").click();
// Verify selection applied — heading changes
await expect(page.getByText("I want to buy", { exact: false }), "I want to buy heading should update").toBeVisible();
// No-results state
await searchInput.fill("ZZZ");
await expect(page.getByText("ZZZ is unavailable"), "Currency unavailable message should show").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Currency filter button | `page.getByTestId("currency-filter-btn-trigger")` | `data-testid="currency-filter-btn-trigger"` in `currency-filter.tsx:173` | ✅ |
| Search input | `page.getByTestId("currency-filter-input-search")` | `data-testid="currency-filter-input-search"` in `currency-filter.tsx` | ✅ |
| Clear search button | `page.getByTestId("currency-filter-btn-clear")` | `data-testid="currency-filter-btn-clear"` in `currency-filter.tsx` | ✅ |
| Currency list item | `page.getByTestId("currency-filter-btn-USD")` | `data-testid=\`currency-filter-btn-${currency.symbol ?? currency.id ?? currency.code}\`` | ✅ |
| "I want to buy" heading | `page.getByText("I want to buy", { exact: false })` | `t("market.iWantToBuy")` → "I want to buy" | ✅ |
| "I want to sell" heading | `page.getByText("I want to sell", { exact: false })` | `t("market.iWantToSell")` → "I want to sell" | ✅ |
| Currency unavailable | `page.getByText("ZZZ is unavailable")` | `t("filter.currencyUnavailable", { currency })` → "{currency} is unavailable" | ✅ (parameterised — use runtime currency) |

---

### Flow 4 — verify-market-payment-method-filter.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
// Open payment method filter
await page.getByTestId("payment-filter-btn-trigger").click();
// Desktop: Popover; Mobile: Drawer with heading "Payment method"
const pmHeading = page.getByRole("heading", { name: "Payment method" })
  .or(page.getByText("Payment method").first()); // mobile Drawer heading vs desktop Popover
await expect(pmHeading, "Payment method filter heading should be visible").toBeVisible();
// Select all checkbox visible
await expect(page.getByTestId("payment-filter-checkbox-select-all"), "Select all checkbox should be visible").toBeVisible();
// Deselect all then select one method
await page.getByTestId("payment-filter-checkbox-select-all").uncheck();
await page.getByTestId("payment-filter-input-search").fill("Bank Transfer");
await page.getByText("Bank Transfer", { exact: false }).first().click(); // method display_name varies
// Apply
await page.getByTestId("payment-filter-btn-apply").click();
// Filter button label changes to "Payment method (1)"
await expect(page.getByText("Payment method (1)", { exact: false }), "Filter badge count should show 1").toBeVisible();
// Reset
await page.getByTestId("payment-filter-btn-trigger").click();
await page.getByTestId("payment-filter-btn-reset").click();
await expect(page.getByText("Payment method", { exact: true }), "Filter badge should reset").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Payment method filter button | `page.getByTestId("payment-filter-btn-trigger")` | `data-testid="payment-filter-btn-trigger"` in `payment-methods-filter.tsx:295` | ✅ |
| Drawer heading (mobile) | `page.getByRole("heading", { name: "Payment method" })` | `t("paymentMethod.title")` → "Payment method" | ✅ |
| Select all checkbox | `page.getByTestId("payment-filter-checkbox-select-all")` | `data-testid="payment-filter-checkbox-select-all"` in `payment-methods-filter.tsx` | ✅ |
| Search input in filter | `page.getByTestId("payment-filter-input-search")` | `data-testid="payment-filter-input-search"` in `payment-methods-filter.tsx` | ✅ |
| Clear search button | `page.getByTestId("payment-filter-btn-clear")` | `data-testid="payment-filter-btn-clear"` in `payment-methods-filter.tsx` | ✅ |
| Payment method checkbox | `page.getByTestId(\`payment-filter-checkbox-${methodId}\`)` | `data-testid=\`payment-filter-checkbox-${method.id ?? method.display_name}\`` | ✅ |
| Apply button | `page.getByTestId("payment-filter-btn-apply")` | `data-testid="payment-filter-btn-apply"` in `payment-methods-filter.tsx` | ✅ |
| Reset button | `page.getByTestId("payment-filter-btn-reset")` | `data-testid="payment-filter-btn-reset"` in `payment-methods-filter.tsx` | ✅ |
| Filter count badge | `page.getByText("Payment method (1)", { exact: false })` | `t("market.paymentMethodSelected", { count: 1 })` → "Payment method (1)" | ✅ |

---

### Flow 5 — verify-market-filter-sort.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
// Open filter/sort dropdown
await page.getByTestId("market-filter-btn-trigger").click();
// Following filter checkbox
await expect(page.getByTestId("market-filter-checkbox-following"), "Ads from following checkbox should be visible").toBeVisible();
await page.getByTestId("market-filter-checkbox-following").check();
// Sort by radio
await page.getByTestId("market-filter-radio-sort-rate").check();
// Apply (mobile only — desktop applies on close)
const applyBtn = page.getByTestId("market-filter-btn-apply");
if (await applyBtn.isVisible()) {
  await applyBtn.click();
}
// Red dot indicator on filter button
await expect(page.getByTestId("market-filter-btn-trigger").locator(".red-dot, [data-active='true']"), "Active filter indicator should be visible").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Filter trigger button | `page.getByTestId("market-filter-btn-trigger")` | `data-testid="market-filter-btn-trigger"` in `market-filter-dropdown.tsx:175` | ✅ |
| Following filter checkbox | `page.getByTestId("market-filter-checkbox-following")` | `data-testid="market-filter-checkbox-following"` in `market-filter-dropdown.tsx` | ✅ |
| Sort by tier radio | `page.getByTestId("market-filter-radio-sort-tier")` | `data-testid="market-filter-radio-sort-tier"` in `market-filter-dropdown.tsx` | ✅ |
| Sort by rate radio | `page.getByTestId("market-filter-radio-sort-rate")` | `data-testid="market-filter-radio-sort-rate"` in `market-filter-dropdown.tsx` | ✅ |
| Sort by rating radio | `page.getByTestId("market-filter-radio-sort-rating")` | `data-testid="market-filter-radio-sort-rating"` in `market-filter-dropdown.tsx` | ✅ |
| Apply filters button (mobile) | `page.getByTestId("market-filter-btn-apply")` | `data-testid="market-filter-btn-apply"` in `market-filter-dropdown.tsx` | ✅ |
| Reset button | `page.getByTestId("market-filter-btn-reset")` | `data-testid="market-filter-btn-reset"` in `market-filter-dropdown.tsx` | ✅ |
| Active filter indicator | `page.getByTestId("market-filter-btn-trigger").locator(".red-dot, [data-active='true']")` | Computed `hasActiveFilters` CSS class | 🔍 Verify exact class on staging |

---

### Flow 6 — verify-market-order-sidebar.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
await expect(marketPage.adCard.first(), "At least one ad should be visible").toBeVisible();
// Click Buy button on first ad
await page.getByRole("button", { name: /Buy/ }).first().click();
// Sidebar opens (full-screen overlay — not a Dialog)
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should open").toBeVisible({ timeout: 8000 });
// Verify sidebar content
await expect(page.getByTestId("order-sidebar-input-amount"), "Amount input should be visible").toBeVisible();
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order button should be visible").toBeVisible();
// Place order button is disabled with no amount
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be disabled initially").toBeDisabled();
// Enter valid amount
await page.getByTestId("order-sidebar-input-amount").fill("100");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be enabled after amount entered").toBeEnabled();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Buy button on ad row | `page.getByRole("button", { name: /Buy/ }).first()` | `t("common.buy")` → "Buy" + currency | ✅ (partial regex) |
| Sell button on ad row | `page.getByRole("button", { name: /Sell/ }).first()` | `t("common.sell")` → "Sell" + currency | ✅ (partial regex) |
| Order sidebar container | `page.getByTestId("order-sidebar-container")` | `data-testid="order-sidebar-container"` in `order-sidebar.tsx` | ✅ |
| Close sidebar button | `page.getByTestId("order-sidebar-btn-close")` | `data-testid="order-sidebar-btn-close"` in `order-sidebar.tsx` | ✅ |
| Amount input | `page.getByTestId("order-sidebar-input-amount")` | `data-testid="order-sidebar-input-amount"` in `order-sidebar.tsx` | ✅ |
| Amount error | `page.getByTestId("order-sidebar-error-amount")` | `data-testid="order-sidebar-error-amount"` in `order-sidebar.tsx` | ✅ |
| Place order button | `page.getByTestId("order-sidebar-btn-place-order")` | `data-testid="order-sidebar-btn-place-order"` in `order-sidebar.tsx` | ✅ |
| Secure trade reminder | `page.getByText("Quick reminders for a secure trade")` | `t("order.secureTradeReminder.title")` | ✅ |
| Order limit info | `page.getByText("Order limit")` | `t("order.orderLimit")` → "Order limit" | ✅ |
| "You receive" label (buy order) | `page.getByText("You receive")` | `t("order.youReceive")` → "You receive" | ✅ |
| "You pay" label (sell order) | `page.getByText("You pay")` | `t("order.youPay")` → "You pay" | ✅ |
| Receive payment to (buy order) | `page.getByText("Receive payment to")` | `t("order.receivePaymentTo")` → "Receive payment to" | ✅ |

---

### Flow 7 — verify-market-place-buy-order.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
await page.getByRole("button", { name: /Buy/ }).first().click();
// Sidebar opens
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be visible").toBeVisible({ timeout: 8000 });
// Select payment method (buy orders have payment method selector)
await page.getByTestId("order-sidebar-btn-select-payment").click();
// Payment method modal opens — select a method
await expect(page.getByTestId("order-sidebar-modal-payment-methods"), "Payment method modal should open").toBeVisible();
await page.getByTestId("order-sidebar-checkbox-payment-0").click(); // first available method
await page.getByTestId("order-sidebar-btn-confirm-payment").click();
// Fill amount
await page.getByTestId("order-sidebar-input-amount").fill("100");
// Place order
await page.getByTestId("order-sidebar-btn-place-order").click();
// Redirects to order page
await page.waitForURL(/\/orders\//);
await expect(page, "Page should navigate to order detail").toHaveURL(/\/orders\//);
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Select payment button | `page.getByTestId("order-sidebar-btn-select-payment")` | `data-testid="order-sidebar-btn-select-payment"` in `order-sidebar.tsx` | ✅ |
| Payment methods modal | `page.getByTestId("order-sidebar-modal-payment-methods")` | `data-testid="order-sidebar-modal-payment-methods"` in `order-sidebar.tsx` | ✅ |
| Payment method checkbox | `page.getByTestId(\`order-sidebar-checkbox-payment-${methodId}\`)` | `data-testid=\`order-sidebar-checkbox-payment-${method.id}\`` in `order-sidebar.tsx` | ✅ |
| Add payment method link | `page.getByTestId("order-sidebar-link-add-payment")` | `data-testid="order-sidebar-link-add-payment"` in `order-sidebar.tsx` | ✅ |
| Confirm payment button | `page.getByTestId("order-sidebar-btn-confirm-payment")` | `data-testid="order-sidebar-btn-confirm-payment"` in `order-sidebar.tsx` | ✅ |
| Selected payment method text | `page.getByTestId("order-sidebar-text-payment-method")` | `data-testid="order-sidebar-text-payment-method"` in `order-sidebar.tsx` | ✅ |
| Place order button | `page.getByTestId("order-sidebar-btn-place-order")` | `data-testid="order-sidebar-btn-place-order"` in `order-sidebar.tsx` | ✅ |
| Order URL pattern | `page.waitForURL(/\/orders\//)` | `router.push("/orders/" + order.data.id)` in source | ✅ |
| Insufficient balance error | `page.getByText("Insufficient balance", { exact: false })` | `t("order.insufficientBalance")` | ✅ |
| Order limit error | `page.getByText("Order limit:", { exact: false })` | `t("order.orderLimitError", {...})` → "Order limit: {min} - {max} {currency}" | ✅ (partial) |

---

### Flow 8 — verify-market-advertiser-profile-link.spec.ts

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();
await expect(marketPage.adCard.first(), "Ad card should be visible").toBeVisible();
// Click advertiser name link in first ad row — uses dynamic testid with advertiser_id
const firstAdCard = page.getByTestId("markets-list-ads").locator("[data-testid^='markets-link-advertiser-']").first();
await firstAdCard.click();
// Navigates to advertiser profile
await page.waitForURL(/\/advertiser\//);
await expect(page, "Should navigate to advertiser profile").toHaveURL(/\/advertiser\//);
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Advertiser name link in ad row | `page.getByTestId("markets-list-ads").locator("[data-testid^='markets-link-advertiser-']").first()` | `data-testid=\`markets-link-advertiser-${advertiser_id}\`` in `app/page.tsx` | ✅ |
| Advertiser URL pattern | `page.waitForURL(/\/advertiser\//)` | `router.push(\`/advertiser/${userId}\`)` in `handleAdvertiserClick` | ✅ |

---

### Flow 9 — verify-market-advertiser-search.spec.ts

**TypeScript method chain (mobile only):**

```typescript
// Requires mobile viewport
test.skip(!isMobileViewport, "Mobile search is mobile-only");
await marketPage.gotoMarketPage();
// Open search sheet — tap the search icon in the mobile header
const searchBtn = page.getByRole("button", { name: "Search" }).or(
  page.locator("[aria-label='Search']")
);
await searchBtn.click();
// Sheet opens from top (SheetContent side="top")
await expect(page.getByTestId("mobile-search-sheet"), "Mobile search sheet should open").toBeVisible();
await expect(page.getByTestId("mobile-search-input"), "Search input should be visible").toBeVisible();
// Type nickname
await page.getByTestId("mobile-search-input").fill(TEST_ADVERTISER_NICKNAME);
// Switch to Buy tab in search
await page.getByTestId("mobile-search-tab-buy").click();
// Results appear
await expect(page.getByRole("listitem").first(), "Search result should appear").toBeVisible();
// Tap result's buy/sell button
await page.getByRole("button", { name: /Buy|Sell/ }).first().click();
// Sheet closes, order sidebar opens
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should open from search result").toBeVisible();
// Clear and type no-results query
await searchBtn.click();
await page.getByTestId("mobile-search-input").fill("zzznobodyyy");
await expect(page.getByText("No results found for", { exact: false }), "No results state should be shown").toBeVisible();
// Clear search
await page.getByTestId("mobile-search-btn-clear").click();
await expect(page.getByTestId("mobile-search-input"), "Search input should be cleared").toHaveValue("");
// Go back
await page.getByTestId("mobile-search-btn-back").click();
await expect(page.getByTestId("mobile-search-sheet"), "Mobile search sheet should close").not.toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Search open button (mobile) | `page.getByRole("button", { name: "Search" })` | Icon button with `alt={t("common.search")}` → "Search" | 🔍 Verify on staging — may be icon-only |
| Mobile search sheet | `page.getByTestId("mobile-search-sheet")` | `data-testid="mobile-search-sheet"` in `mobile-advertiser-search.tsx` | ✅ |
| Back button | `page.getByTestId("mobile-search-btn-back")` | `data-testid="mobile-search-btn-back"` in `mobile-advertiser-search.tsx` | ✅ |
| Search input | `page.getByTestId("mobile-search-input")` | `data-testid="mobile-search-input"` in `mobile-advertiser-search.tsx` | ✅ |
| Clear input button | `page.getByTestId("mobile-search-btn-clear")` | `data-testid="mobile-search-btn-clear"` in `mobile-advertiser-search.tsx` | ✅ |
| Buy tab in search | `page.getByTestId("mobile-search-tab-buy")` | `data-testid="mobile-search-tab-buy"` in `mobile-advertiser-search.tsx` | ✅ |
| Sell tab in search | `page.getByTestId("mobile-search-tab-sell")` | `data-testid="mobile-search-tab-sell"` in `mobile-advertiser-search.tsx` | ✅ |
| Load more sentinel | `page.getByTestId("mobile-search-sentinel-load-more")` | `data-testid="mobile-search-sentinel-load-more"` in `mobile-advertiser-search.tsx` | ✅ |
| Result card | `page.getByRole("listitem").first()` | `<li>` per search result | ✅ |
| No results heading | `page.getByText("No results found for", { exact: false })` | `t("common.searchNoResultsTitle", { query })` → `No results found for "{query}"` | ✅ (partial) |
| No results description | `page.getByText("Check spelling or try finding different advertisers.")` | `t("common.searchNoResultsDescription")` | ✅ |

---

### G1 — verify-market-maintenance.spec.ts

**TypeScript method chain:**

```typescript
// Requires staging in maintenance mode or a mocked P2PSystemMaintenance response
await marketPage.gotoMarketPage();
await expect(page.getByText("No ads available"), "Maintenance empty state heading should be visible").toBeVisible();
// Buy/Sell buttons disabled
await expect(page.getByRole("button", { name: /Buy|Sell/ }).first(), "Ad action button should be disabled in maintenance").toBeDisabled();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Maintenance heading | `page.getByText("No ads available")` | `t("market.noAdsMaintenanceTitle")` → "No ads available" | ✅ |
| Empty state container | `page.getByTestId("markets-empty-state")` | `data-testid="markets-empty-state"` in `app/page.tsx:730` | ✅ |
| Disabled ad button | `page.getByRole("button", { name: /Buy|Sell/ }).first()` | `disabled={!!tempBanUntil \|\| isMaintenanceActive}` | ✅ |

---

### G2 — verify-market-no-balance-warning.spec.ts

**TypeScript method chain:**

```typescript
// Requires account with zero P2P wallet balance
await marketPage.gotoMarketPage();
await expect(page.getByTestId("balance-warning-banner"), "Balance warning banner should be visible").toBeVisible();
await expect(page.getByText("No balance in P2P Wallet"), "Warning title should be visible").toBeVisible();
// Transfer funds button
await expect(page.getByTestId("balance-warning-btn-transfer"), "Transfer funds button should be visible").toBeVisible();
await page.getByTestId("balance-warning-btn-transfer").click();
await expect(page, "Should navigate to wallet transfer deep link").toHaveURL(/\/wallet\?operation=TRANSFER/);
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Balance warning banner | `page.getByTestId("balance-warning-banner")` | `data-testid="balance-warning-banner"` in `p2p-balance-warning.tsx` | ✅ |
| Warning title | `page.getByText("No balance in P2P Wallet")` | `t("market.noBalanceTitle")` → "No balance in P2P Wallet" | ✅ |
| Warning description | `page.getByText("Your sell ads are hidden", { exact: false })` | `t("market.noBalanceDescription")` | ✅ (partial) |
| Transfer funds button | `page.getByTestId("balance-warning-btn-transfer")` | `data-testid="balance-warning-btn-transfer"` in `p2p-balance-warning.tsx` | ✅ |

---

### G3 — verify-market-kyc-gate.spec.ts

**TypeScript method chain:**

```typescript
// Requires KYC-unverified account
await marketPage.gotoMarketPage();
await page.getByRole("button", { name: /Buy|Sell/ }).first().click();
// KYC onboarding alert appears instead of order sidebar
await expect(page.getByRole("alertdialog"), "KYC alert dialog should be shown").toBeVisible();
// Order sidebar should NOT be visible
await expect(page.getByRole("button", { name: "Place order" }), "Order sidebar should not open without KYC").not.toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| KYC alert dialog | `page.getByRole("alertdialog")` | `showAlert(createKycOnboardingAlertConfig(...))` | 🔍 Verify alertdialog role on staging |
| Place order (should not appear) | `page.getByRole("button", { name: "Place order" })` | `t("order.placeOrder")` | ✅ |

---

### G4 — verify-market-deep-link.spec.ts

**TypeScript method chain:**

```typescript
// ?operation=sell activates Sell tab
await page.goto("/?operation=sell");
await expect(marketPage.sellTab, "Sell tab should be active via ?operation=sell deep link").toHaveAttribute("data-state", "active");

// ?currency=USD pre-selects currency
await page.goto("/?currency=USD");
await expect(page.getByText("I want to buy", { exact: false }), "I want to buy heading should show USD context").toBeVisible();

// Combined deep link
await page.goto("/?operation=sell&currency=USD");
await expect(marketPage.sellTab, "Sell tab should be active").toHaveAttribute("data-state", "active");
await expect(page.getByText("I want to sell", { exact: false }), "I want to sell heading should be visible").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Sell tab active | `marketPage.sellTab` + `.toHaveAttribute("data-state", "active")` | `?operation=sell` sets `activeTab` in store | ✅ |
| Buy tab active | `marketPage.buyTab` + `.toHaveAttribute("data-state", "active")` | `?operation=buy` sets `activeTab` in store | ✅ |
| "I want to buy" heading | `page.getByText("I want to buy", { exact: false })` | `t("market.iWantToBuy")` → "I want to buy" | ✅ |
| "I want to sell" heading | `page.getByText("I want to sell", { exact: false })` | `t("market.iWantToSell")` → "I want to sell" | ✅ |

---

### G5 — verify-market-risk-warning.spec.ts

**TypeScript method chain:**

```typescript
// Requires an ad from a high-risk advertiser
await marketPage.gotoMarketPage();
await page.getByRole("button", { name: /Buy/ }).first().click();
// Risk warning modal appears
await expect(page.getByTestId("risk-warning-modal"), "Risk warning modal should appear for high-risk advertiser").toBeVisible({ timeout: 8000 });
await expect(page.getByText("This advertiser has a low completion rate", { exact: false })
  .or(page.getByText("Many traders have blocked this advertiser", { exact: false })),
  "Risk warning message should be visible").toBeVisible();
// Continue anyway
await page.getByTestId("risk-warning-btn-continue").click();
await expect(page.getByTestId("risk-warning-modal"), "Risk warning modal should close after Continue").not.toBeVisible();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should open after Continue").toBeVisible();
// Go back
await marketPage.gotoMarketPage();
await page.getByRole("button", { name: /Buy/ }).first().click();
await expect(page.getByTestId("risk-warning-modal"), "Risk warning should reappear").toBeVisible({ timeout: 8000 });
await page.getByTestId("risk-warning-btn-cancel").click();
await expect(page.getByTestId("risk-warning-modal"), "Risk warning should close on Go back").not.toBeVisible();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should NOT open after Go back").not.toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Risk warning modal | `page.getByTestId("risk-warning-modal")` | `data-testid="risk-warning-modal"` in `risk-warning-modal.tsx` | ✅ |
| Low completion rate message | `page.getByText("This advertiser has a low completion rate", { exact: false })` | `t("market.riskWarning.lowCompletion.title")` | ✅ |
| High block count message | `page.getByText("Many traders have blocked this advertiser", { exact: false })` | `t("market.riskWarning.highBlockCount.title")` | ✅ |
| Continue anyway button | `page.getByTestId("risk-warning-btn-continue")` | `data-testid="risk-warning-btn-continue"` in `risk-warning-modal.tsx` | ✅ |
| Cancel / Go back button | `page.getByTestId("risk-warning-btn-cancel")` | `data-testid="risk-warning-btn-cancel"` in `risk-warning-modal.tsx` | ✅ |
| Close button (X) | `page.getByTestId("risk-warning-btn-close")` | `data-testid="risk-warning-btn-close"` in `risk-warning-modal.tsx` | ✅ |

---

## Section 3 — Tags Reference

| Tag | Description |
|-----|-------------|
| `@market` | Feature area tag — all market module tests |
| `@smoke` | Critical path — must pass before any release |
| `@production` | Safe to run on production (read-only, no mutations) |
| `@staging` | Staging only — requires account state, mutations, or Mailisk |
| `@desktop` | Desktop viewport (1280×720, chromium project) |
| `@mobile` | Mobile viewport (Pixel 7 412×915, chromium-mobile project) |

---

## Section 4 — Implementation Decisions

### D1 — Tab value inversion: `value="sell"` = "Buy" tab, `value="buy"` = "Sell" tab

In `app/page.tsx`, the `<Tabs>` component has:
- `<TabsTrigger value="sell">` → renders as the **"Buy"** tab (shows sell-type ads — ads where advertisers sell, users buy)
- `<TabsTrigger value="buy">` → renders as the **"Sell"** tab (shows buy-type ads — ads where advertisers buy, users sell)

This is intentional product logic, not a bug. Tests should locate tabs by their visible label (`"Buy"`, `"Sell"`) using `getByRole("tab", { name: "Buy" })`, never by `value` prop.

---

### D2 — OrderSidebar is a full-screen overlay div, not a Dialog

`components/buy-sell/order-sidebar.tsx` renders as a `div.fixed.inset-0.z-50`, not using Radix `Dialog` or `Drawer`. There is no `role="dialog"` in the sidebar itself. Locate it by `data-testid="order-sidebar-container"` — confirmed in source. Do NOT use `getByRole("dialog")` for the sidebar.

---

### D3 — Source testids are confirmed; POM testids differ

`data-testid` attributes were added to all major market elements. The actual testids differ from legacy POM names — the POM file (`MarketPage.ts`) may reference outdated testid strings. Always use the source-confirmed testids from this catalog, not POM constants. Key differences:

| POM reference | Actual source testid |
|---|---|
| `market-tab-buy` | `markets-tab-buy` |
| `market-tab-sell` | `markets-tab-sell` |
| `market-filter-currency` | `currency-filter-btn-trigger` |
| `market-filter-payment-method` | `payment-filter-btn-trigger` |
| `market-ad-card` | `markets-card-ad-${id}` |
| `market-empty-state` | `markets-empty-state` |

---

### D4 — CurrencyFilter and PaymentMethodsFilter have viewport-split layouts

Both components use the same pattern:
- **Desktop:** `Popover` (compact, w-80)
- **Mobile:** `Drawer` (bottom sheet; CurrencyFilter 90vh, PaymentMethodsFilter h-fit)

The mobile Drawer has a heading (`t("paymentMethod.title")` → "Payment method"); the desktop Popover does not. Assertions for headings must guard on viewport: `if (isMobileViewport) expect(heading).toBeVisible()`.

---

### D5 — MarketFilterDropdown applies immediately on desktop, requires "Apply" on mobile

`MarketFilterDropdown` on desktop closes and applies when the Popover closes (no explicit Apply button). On mobile, a Drawer with explicit "Apply filters" (`t("filter.applyFilters")`) and "Reset" (`t("filter.reset")`) buttons is shown. Tests that assert filter application must handle both paths.

---

### D6 — Mobile advertiser search is a Sheet (slides from top), not a Drawer

`MobileAdvertiserSearch` uses `<Sheet side="top">` (`SheetContent side="top"`), which slides down from the top of the viewport and occupies the full screen. It is distinct from Drawers (which slide from the bottom). There is no desktop counterpart — a desktop search input is embedded directly in the market page header area. Flow 9 is mobile-only.

---

### D7 — Risk warning modal source in `risk-warning-rules.ts`

Whether a risk warning appears is determined by `evaluateRisk(ad)` in `components/buy-sell/risk-warning/risk-warning-rules.ts`. The two conditions are: (1) advertiser completion rate below a threshold, (2) advertiser block count above a threshold. Tests for G5 require a staging advertiser account that meets one of these conditions. Without such an account, G5 flows cannot be fully automated.
