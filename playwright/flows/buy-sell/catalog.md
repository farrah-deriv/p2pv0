# 📦 Buy-Sell Technical Catalog

> **Purpose:** TypeScript method chains, locator tables, and implementation decisions for all buy-sell order sidebar flows.
>
> **Feature location:** Order sidebar — `components/buy-sell/order-sidebar.tsx`; rate/ad-update modals in `components/buy-sell/`; entry point `app/page.tsx`
> **Playwright test folder:** `playwright/tests/buy-sell/`
> **Page Object:** `playwright/pages/MarketPage.ts` (for entry navigation); no dedicated BuySellPage POM yet — use direct locators from this catalog

---

## Section 1 — Flow Map

| # | Journey | Spec file | Tags |
|---|---------|-----------|------|
| Flow 1 | Buy-side order sidebar — content verification and close | `buy-sell/verify-buy-sell-sidebar-buy-side.spec.ts` | `@buy-sell @smoke @staging @desktop @mobile` |
| Flow 2 | Sell-side order sidebar — content and payment method required guard | `buy-sell/verify-buy-sell-sidebar-sell-side.spec.ts` | `@buy-sell @smoke @staging @desktop @mobile` |
| Flow 3 | Payment method selection panel — open, select, confirm | `buy-sell/verify-buy-sell-payment-selection.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| Flow 4 | Amount validation — order limit errors | `buy-sell/verify-buy-sell-amount-validation.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G1 | Place sell-side order end-to-end | `buy-sell/verify-buy-sell-place-sell-order.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G2 | Insufficient P2P balance prevents sell order | `buy-sell/verify-buy-sell-balance-validation.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G3 | Rate change confirmation modal | `buy-sell/verify-buy-sell-rate-change.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G4 | Ad updated confirmation modal | `buy-sell/verify-buy-sell-ad-updated.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G5 | Add payment method from order sidebar | `buy-sell/verify-buy-sell-add-payment-method.spec.ts` | `@buy-sell @staging @desktop @mobile` |
| G6 | Own-ad Buy/Sell button suppression | `buy-sell/verify-buy-sell-own-ad-no-button.spec.ts` | `@buy-sell @staging @desktop @mobile` |

---

## Section 2 — Flow Details

### Flow 1 — verify-buy-sell-sidebar-buy-side.spec.ts

**Setup:**

```typescript
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginHelpers.login(page, process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!);
  await context.storageState({ path: "playwright/.auth/user.json" });
  await context.close();
});
```

**TypeScript method chain:**

```typescript
// Navigate to market page (Buy tab is active by default)
await marketPage.gotoMarketPage();
await expect(page.getByRole("tablist").getByTestId("markets-tab-buy"), "Buy tab should be active").toHaveAttribute("data-state", "active");

// Click the first "Buy {currency}" button — targets sell-type ads on Buy tab
await page.getByRole("button", { name: /Buy/ }).first().click();

// Sidebar opens as a full-screen overlay div (not a Dialog — see D2)
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be visible").toBeVisible({ timeout: 8000 });

// Verify title contains "Buy" (the full title is "Buy {currency}", e.g. "Buy USD")
await expect(page.getByTestId("order-sidebar-container").getByText(/Buy\s+\w+/).first(), "Sidebar title should contain 'Buy {currency}'").toBeVisible();

// Verify sidebar content elements
await expect(page.getByTestId("order-sidebar-input-amount"), "Amount input should be visible").toBeVisible();
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order button should be visible").toBeVisible();
await expect(page.getByText("Order limit"), "Order limit label should be visible").toBeVisible();
await expect(page.getByText("You pay"), "You pay label should be visible on buy-side").toBeVisible();

// Verify NO payment selection button on buy-side (see D3)
await expect(page.getByTestId("order-sidebar-btn-select-payment"), "Payment selection should NOT be visible for buy-side").not.toBeVisible();

// Place order disabled with no amount
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be disabled initially").toBeDisabled();

// Enter valid amount → Place order becomes enabled
await page.getByTestId("order-sidebar-input-amount").fill("50");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be enabled after entering valid amount").toBeEnabled();

// Close sidebar
await page.getByTestId("order-sidebar-btn-close").click();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be closed").not.toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Buy tab | `page.getByRole("tablist").getByTestId("markets-tab-buy")` | `data-testid="markets-tab-buy"` in `app/page.tsx` | ✅ |
| Buy action button (ad row) | `page.getByRole("button", { name: /Buy/ }).first()` | `data-testid=\`markets-btn-buy-${ad.id}\`` in `app/page.tsx` | ✅ (partial regex) |
| Order sidebar container | `page.getByTestId("order-sidebar-container")` | `data-testid="order-sidebar-container"` in `order-sidebar.tsx` | ✅ |
| Close button | `page.getByTestId("order-sidebar-btn-close")` | `data-testid="order-sidebar-btn-close"` in `order-sidebar.tsx` | ✅ |
| Amount input | `page.getByTestId("order-sidebar-input-amount")` | `data-testid="order-sidebar-input-amount"` in `order-sidebar.tsx` | ✅ |
| Amount error | `page.getByTestId("order-sidebar-error-amount")` | `data-testid="order-sidebar-error-amount"` in `order-sidebar.tsx` | ✅ |
| Place order button | `page.getByTestId("order-sidebar-btn-place-order")` | `data-testid="order-sidebar-btn-place-order"` in `order-sidebar.tsx` | ✅ |
| "Order limit" label | `page.getByText("Order limit")` | `t("order.orderLimit")` → "Order limit" | ✅ |
| "You receive" label (buy-side) | `page.getByText("You receive")` | `t("order.youReceive")` → "You receive" | ✅ |
| Payment selection button (NOT on buy-side) | `page.getByTestId("order-sidebar-btn-select-payment")` | `data-testid="order-sidebar-btn-select-payment"` in `order-sidebar.tsx` (only rendered when `isBuy === true`) | ✅ |

---

### Flow 2 — verify-buy-sell-sidebar-sell-side.spec.ts

**Setup:** Same Pattern B `beforeAll` as Flow 1.

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();

// Switch to Sell tab (value="buy" internally — see D1)
await page.getByRole("tablist").getByTestId("markets-tab-sell").click();
await expect(page.getByRole("tablist").getByTestId("markets-tab-sell"), "Sell tab should be active").toHaveAttribute("data-state", "active");

// Click the first "Sell {currency}" button — targets buy-type ads on Sell tab
await page.getByRole("button", { name: /Sell/ }).first().click();

// Sidebar opens
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be visible").toBeVisible({ timeout: 8000 });

// Verify title contains "Sell"
await expect(page.getByTestId("order-sidebar-container").getByText(/Sell\s+\w+/).first(), "Sidebar title should contain 'Sell {currency}'").toBeVisible();

// Verify "You pay" label (sell-side: user pays from P2P balance)
await expect(page.getByText("You pay"), "You pay label should be visible on sell-side").toBeVisible();

// Verify payment selection button IS visible on sell-side (see D3)
await expect(page.getByTestId("order-sidebar-btn-select-payment"), "Payment selection button should be visible for sell-side").toBeVisible();

// Place order disabled with no amount and no payment method
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be disabled initially").toBeDisabled();

// Enter valid amount — Place order STILL disabled (payment method not selected yet)
await page.getByTestId("order-sidebar-input-amount").fill("50");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should remain disabled without payment method selection").toBeDisabled();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Sell tab | `page.getByRole("tablist").getByTestId("markets-tab-sell")` | `data-testid="markets-tab-sell"` in `app/page.tsx` | ✅ |
| Sell action button (ad row) | `page.getByRole("button", { name: /Sell/ }).first()` | `data-testid=\`markets-btn-sell-${ad.id}\`` in `app/page.tsx` | ✅ (partial regex) |
| Order sidebar container | `page.getByTestId("order-sidebar-container")` | `data-testid="order-sidebar-container"` in `order-sidebar.tsx` | ✅ |
| Payment selection button | `page.getByTestId("order-sidebar-btn-select-payment")` | `data-testid="order-sidebar-btn-select-payment"` in `order-sidebar.tsx` | ✅ |
| "You pay" label (sell-side) | `page.getByText("You pay")` | `t("order.youPay")` → "You pay" | ✅ |
| Place order button | `page.getByTestId("order-sidebar-btn-place-order")` | `data-testid="order-sidebar-btn-place-order"` in `order-sidebar.tsx` | ✅ |

---

### Flow 3 — verify-buy-sell-payment-selection.spec.ts

**Setup:** Same Pattern B `beforeAll` as Flow 1.

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();

// Open sell-side sidebar
await page.getByRole("tablist").getByTestId("markets-tab-sell").click();
await page.getByRole("button", { name: /Sell/ }).first().click();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be open").toBeVisible({ timeout: 8000 });

// Open payment method panel
await page.getByTestId("order-sidebar-btn-select-payment").click();
await expect(page.getByTestId("order-sidebar-modal-payment-methods"), "Payment methods panel should open").toBeVisible();

// Select the first payment method using the prefix pattern (IDs are API-generated)
await page.getByTestId("order-sidebar-modal-payment-methods")
  .locator("[data-testid^='order-sidebar-checkbox-payment-']").first().click();

// Confirm selection
await page.getByTestId("order-sidebar-btn-confirm-payment").click();
await expect(page.getByTestId("order-sidebar-modal-payment-methods"), "Payment methods panel should close").not.toBeVisible();

// Selected payment method name is now visible in the sidebar
await expect(page.getByTestId("order-sidebar-text-payment-method"), "Selected payment method should be shown").toBeVisible();

// Place order still disabled — no amount entered yet
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should remain disabled without amount").toBeDisabled();

// Enter valid amount → Place order becomes enabled (both payment method AND amount are now set)
await page.getByTestId("order-sidebar-input-amount").fill("50");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be enabled with payment method and amount").toBeEnabled();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Payment selection button | `page.getByTestId("order-sidebar-btn-select-payment")` | `data-testid="order-sidebar-btn-select-payment"` in `order-sidebar.tsx` | ✅ |
| Payment methods panel | `page.getByTestId("order-sidebar-modal-payment-methods")` | `data-testid="order-sidebar-modal-payment-methods"` in `order-sidebar.tsx` | ✅ |
| Payment method checkbox (dynamic ID) | `page.locator("[data-testid^='order-sidebar-checkbox-payment-']").first()` | `data-testid=\`order-sidebar-checkbox-payment-${method.id}\`` in `order-sidebar.tsx` | ✅ (prefix pattern — IDs are API-generated, not 0-indexed) |
| Add payment method link | `page.getByTestId("order-sidebar-link-add-payment")` | `data-testid="order-sidebar-link-add-payment"` in `order-sidebar.tsx` | ✅ |
| Confirm payment button | `page.getByTestId("order-sidebar-btn-confirm-payment")` | `data-testid="order-sidebar-btn-confirm-payment"` in `order-sidebar.tsx` | ✅ |
| Selected payment method display | `page.getByTestId("order-sidebar-text-payment-method")` | `data-testid="order-sidebar-text-payment-method"` in `order-sidebar.tsx` | ✅ |

> **⚠️ Checkbox testid uses API-generated IDs:** `order-sidebar-checkbox-payment-{method.id}` uses the payment method's backend ID (e.g. `"12345"`), not a sequential index. Never use `order-sidebar-checkbox-payment-0` — use the prefix pattern `[data-testid^='order-sidebar-checkbox-payment-']` to locate any available checkbox.

---

### Flow 4 — verify-buy-sell-amount-validation.spec.ts

**Setup:** Same Pattern B `beforeAll` as Flow 1.

**TypeScript method chain:**

```typescript
await marketPage.gotoMarketPage();

// Open any order sidebar (either side — order limit validation works for both)
await page.getByRole("button", { name: /Buy|Sell/ }).first().click();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be open").toBeVisible({ timeout: 8000 });

// ── Below minimum limit ──
await page.getByTestId("order-sidebar-input-amount").fill("0.01");
await expect(page.getByTestId("order-sidebar-error-amount"), "Order limit error should be shown").toBeVisible();
await expect(page.getByTestId("order-sidebar-error-amount"), "Error should mention 'Order limit'").toContainText("Order limit");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be disabled with limit error").toBeDisabled();

// Fix to valid amount — error disappears
await page.getByTestId("order-sidebar-input-amount").fill("50");
await expect(page.getByTestId("order-sidebar-error-amount"), "Order limit error should be cleared").not.toBeVisible();

// ── Above maximum limit ──
await page.getByTestId("order-sidebar-input-amount").fill("9999999");
await expect(page.getByTestId("order-sidebar-error-amount"), "Order limit error should reappear").toBeVisible();
await expect(page.getByTestId("order-sidebar-error-amount"), "Error should mention 'Order limit'").toContainText("Order limit");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be disabled with limit error").toBeDisabled();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Amount input | `page.getByTestId("order-sidebar-input-amount")` | `data-testid="order-sidebar-input-amount"` in `order-sidebar.tsx` | ✅ |
| Amount error message | `page.getByTestId("order-sidebar-error-amount")` | `data-testid="order-sidebar-error-amount"` in `order-sidebar.tsx` | ✅ |
| Order limit error text | `page.getByTestId("order-sidebar-error-amount").toContainText("Order limit")` | `t("order.orderLimitError", { min, max, currency })` → "Order limit: {min} – {max} {currency}" | ✅ (partial match — values are dynamic) |
| Insufficient balance error text | `page.getByTestId("order-sidebar-error-amount").toContainText("Insufficient balance")` | `t("order.insufficientBalance")` → contains "Insufficient balance" | ✅ (partial match) |
| Place order button | `page.getByTestId("order-sidebar-btn-place-order")` | `data-testid="order-sidebar-btn-place-order"` in `order-sidebar.tsx` | ✅ |

---

### G1 — verify-buy-sell-place-sell-order.spec.ts

**TypeScript method chain:**

```typescript
// Mutating — creates a real order on staging
await marketPage.gotoMarketPage();
await page.getByRole("tablist").getByTestId("markets-tab-sell").click();
await page.getByRole("button", { name: /Sell/ }).first().click();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should be open").toBeVisible({ timeout: 8000 });

// Select a payment method
await page.getByTestId("order-sidebar-btn-select-payment").click();
await expect(page.getByTestId("order-sidebar-modal-payment-methods"), "Payment methods panel should open").toBeVisible();
await page.getByTestId("order-sidebar-modal-payment-methods")
  .locator("[data-testid^='order-sidebar-checkbox-payment-']").first().click();
await page.getByTestId("order-sidebar-btn-confirm-payment").click();

// Enter valid amount
await page.getByTestId("order-sidebar-input-amount").fill("50");
await expect(page.getByTestId("order-sidebar-btn-place-order"), "Place order should be enabled").toBeEnabled();

// Place the order
await page.getByTestId("order-sidebar-btn-place-order").click();

// Navigates to the order detail page
await page.waitForURL(/\/orders\//);
await expect(page, "Should navigate to order detail page").toHaveURL(/\/orders\//);
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Order URL | `page.waitForURL(/\/orders\//)` | `router.push("/orders/" + order.data.id)` in `order-sidebar.tsx` on success | ✅ |

---

### G3 — verify-buy-sell-rate-change.spec.ts

**TypeScript method chain:**

```typescript
// Rate-change modal — rendered when float rate changes while sidebar is open
await expect(page.getByTestId("rate-change-modal"), "Rate change modal should appear").toBeVisible({ timeout: 10000 });
await expect(page.getByText("Rate updated"), "Rate updated title should be visible").toBeVisible();
await expect(page.getByTestId("rate-change-btn-confirm"), "Confirm and continue button should be visible").toBeVisible();
await expect(page.getByTestId("rate-change-btn-cancel"), "Go back button should be visible").toBeVisible();

// Scenario 1: confirm
await page.getByTestId("rate-change-btn-confirm").click();
await expect(page.getByTestId("rate-change-modal"), "Rate change modal should close after confirm").not.toBeVisible();

// Scenario 2: cancel (go back)
await page.getByTestId("rate-change-btn-cancel").click();
await expect(page.getByTestId("rate-change-modal"), "Rate change modal should close after Go back").not.toBeVisible();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should still be open").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Rate change modal | `page.getByTestId("rate-change-modal")` | `data-testid="rate-change-modal"` in `rate-change-confirmation.tsx` | ✅ |
| "Rate updated" title | `page.getByText("Rate updated")` | `t("order.rateUpdatedTitle")` → "Rate updated" | ✅ |
| Confirm and continue | `page.getByTestId("rate-change-btn-confirm")` | `data-testid="rate-change-btn-confirm"` in `rate-change-confirmation.tsx` | ✅ |
| Go back | `page.getByTestId("rate-change-btn-cancel")` | `data-testid="rate-change-btn-cancel"` in `rate-change-confirmation.tsx` | ✅ |

---

### G4 — verify-buy-sell-ad-updated.spec.ts

**TypeScript method chain:**

```typescript
// Ad updated modal — rendered when ad details change while sidebar is open
await expect(page.getByTestId("ad-updated-modal"), "Ad updated modal should appear").toBeVisible({ timeout: 10000 });
await expect(page.getByText("Ad updated"), "Ad updated title should be visible").toBeVisible();
await expect(page.getByTestId("ad-updated-btn-confirm"), "Review changes button should be visible").toBeVisible();

// Click "Review changes" to reload sidebar with new ad details
await page.getByTestId("ad-updated-btn-confirm").click();
await expect(page.getByTestId("ad-updated-modal"), "Ad updated modal should close").not.toBeVisible();
await expect(page.getByTestId("order-sidebar-container"), "Order sidebar should still be visible with updated content").toBeVisible();
```

**Locator table:**

| Element | Locator | Source | Status |
|---------|---------|--------|--------|
| Ad updated modal | `page.getByTestId("ad-updated-modal")` | `data-testid="ad-updated-modal"` in `ad-updated-confirmation.tsx` | ✅ |
| "Ad updated" title | `page.getByText("Ad updated")` | `t("order.adUpdatedTitle")` → "Ad updated" | ✅ |
| Review changes button | `page.getByTestId("ad-updated-btn-confirm")` | `data-testid="ad-updated-btn-confirm"` in `ad-updated-confirmation.tsx` | ✅ |

---

## Section 3 — Tags Reference

| Tag | Description |
|-----|-------------|
| `@buy-sell` | Feature area tag — all buy-sell order sidebar tests |
| `@smoke` | Critical path — must pass before any release |
| `@staging` | Staging only — requires account state, mutations, or timing conditions |
| `@desktop` | Desktop viewport (1280×720, chromium project) |
| `@mobile` | Mobile viewport (Pixel 7 412×915, chromium-mobile project) |

---

## Section 4 — Implementation Decisions

### D1 — isBuy naming: `isBuy = true` means the user is SELLING (the ad is a buy-type ad)

In `order-sidebar.tsx`, `isBuy = orderType === "buy"` where `orderType` equals the ad's `type` field. A "buy-type" ad is one where the advertiser wants to **buy** crypto — so the visiting user is **selling** to them. The variable name `isBuy` refers to the ad type, not the user's action.

Consequently:
- `isBuy === true` (buy-type ad) → User is selling → Sidebar title: "Sell {currency}" → Payment method selection shown → `t("order.buyersPaymentMethods")`
- `isBuy === false` (sell-type ad) → User is buying → Sidebar title: "Buy {currency}" → No payment selection → `t("order.sellersPaymentMethods")`

This is the inverse of the `markets-tab-buy` / `markets-tab-sell` inversion documented in `playwright/flows/market/catalog.md — D1`. When writing tests, always verify behavior by looking at **which tab is active and what button label is clicked**, never by reading the `value` prop or `isBuy` variable name.

---

### D2 — OrderSidebar is a full-screen overlay div, not a Dialog

`components/buy-sell/order-sidebar.tsx` renders as `div.fixed.inset-0.z-50`, not a Radix `Dialog` or `Drawer`. There is no `role="dialog"` on the sidebar. Always locate it with `page.getByTestId("order-sidebar-container")`. Do NOT use `page.getByRole("dialog")` for the sidebar — it will not find it.

The confirmation modals that appear *inside* the sidebar flow are standard Radix components:
- `rate-change-confirmation.tsx` — Desktop: `Dialog`; Mobile: `Drawer`
- `ad-updated-confirmation.tsx` — Desktop: `Dialog`; Mobile: `Drawer`
- `risk-warning-modal.tsx` — Desktop: `Dialog`; Mobile: `Drawer` (covered in `playwright/flows/market/ — G5`)

All modal/drawer components use `data-testid` on their root container, so tests can locate them by testid regardless of viewport.

---

### D3 — Payment method selection only appears on the sell-side (`isBuy === true`)

The payment method selection button (`order-sidebar-btn-select-payment`) is conditionally rendered: `{isBuy && <... data-testid="order-sidebar-btn-select-payment" ...>}`. It is only visible when the user is selling (clicking "Sell {currency}" on a buy-type ad, `isBuy = true`).

On the buy-side (`isBuy = false`), the sidebar shows the advertiser's payment methods as a read-only list — there is no selection step. The `order-sidebar-btn-select-payment` element is absent from the DOM entirely on buy-side, so `not.toBeVisible()` assertions are valid.

The Place Order disabled guard reflects this:
- Buy-side: disabled until `amount > 0` (no payment method required)
- Sell-side: disabled until `amount > 0 AND selectedPaymentMethods.length > 0`

---

### D4 — Payment method checkbox testids use API-generated IDs, not sequential indexes

`order-sidebar-checkbox-payment-{method.id}` uses the backend-assigned payment method ID (e.g. `"67890"`), not a 0-based index. The legacy market catalog shows `order-sidebar-checkbox-payment-0` — this is incorrect for real accounts. Always select payment method checkboxes via the prefix locator pattern:

```typescript
page.getByTestId("order-sidebar-modal-payment-methods")
  .locator("[data-testid^='order-sidebar-checkbox-payment-']").first()
```

---

### D5 — Test folder location deviates from app/ route naming convention

`playwright/tests/buy-sell/` is used for buy-sell specs even though there is no `app/buy-sell/` route segment — the feature lives in `components/buy-sell/` and is hosted by `app/page.tsx` (the root route). This deviates from the CLAUDE.md rule that test folder names must mirror `app/` route segments.

**Rationale:** The order sidebar and its confirmation modals are a cohesive feature group defined under `components/buy-sell/`. Putting these tests in `playwright/tests/market/` would conflate market-browsing tests with order-placement tests, making the test suite harder to navigate. If future maintainers want strict alignment with the routing table, move these specs to `playwright/tests/market/buy-sell/`.
