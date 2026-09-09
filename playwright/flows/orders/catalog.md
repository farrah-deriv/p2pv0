# 🗺️ Orders Journey Catalog — Technical Reference

> Source of truth: `playwright/pages/OrdersPage.ts`, `playwright/pages/OrderDetailPage.ts`
> Created: 2026-06-26 | Last updated: 2026-06-26

---

## Section 1 — Journey Index

| Journey ID | Spec File | Tags |
|---|---|---|
| Flow 1 | `orders/verify-orders-list-loads.spec.ts` | `@desktop @mobile @orders @smoke @production` |
| Flow 2 | `orders/verify-orders-list-with-orders.spec.ts` | `@desktop @mobile @orders @staging` |
| Flow 3 | `orders/verify-orders-past-date-filter.spec.ts` | `@desktop @orders @staging` |
| Flow 4 | `orders/verify-orders-rate-past-order.spec.ts` | `@desktop @mobile @orders @staging` |
| Flow 5 | `orders/verify-order-detail-loads.spec.ts` | `@desktop @mobile @orders @staging` |
| Flow 6 | `orders/verify-order-detail-buyer-actions.spec.ts` | `@desktop @mobile @orders @staging` |
| Flow 7 | `orders/verify-order-detail-seller-actions.spec.ts` | `@desktop @mobile @orders @staging` |
| G1 | `orders/verify-order-complaint.spec.ts` | `@desktop @orders @staging` |
| G2 | `orders/verify-orders-temp-ban-alert.spec.ts` | `@desktop @mobile @orders @staging` |
| G3 | `orders/verify-orders-previous-orders.spec.ts` | `@desktop @mobile @orders @staging` |
| G4 | `orders/verify-order-otp-error.spec.ts` | `@desktop @mobile @orders @staging` |

> Spec file paths are relative to `playwright/tests/` — do not include the `playwright/tests/` prefix.

---

## Section 2 — Flow Details

### Flow 1 — Orders list loads (smoke)

**Account setup (Pattern C — env var):**
```typescript
// loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally
```

**Test pattern:**
```typescript
await loginPage.login();
await ordersPage.gotoOrdersPage();
await expect(ordersPage.activeOrdersTab, "Active tab should be visible").toBeVisible();
await expect(ordersPage.pastOrdersTab, "Past tab should be visible").toBeVisible();
// If no active orders:
await expect(page.getByTestId("orders-empty-state"), "Empty state should be visible when no orders").toBeVisible();
```

**⚠️ POM gap note:** The existing `OrdersPage.orderCards` locator uses `getByTestId("order-card")` which does NOT exist in source. The actual testid is `orders-row-{id}` (dynamic). Update the POM before writing tests.

---

### Flow 2 — Orders list with active orders

**Account setup (Pattern C — env var, account must have ≥1 active order):**
```typescript
// loginPage.login() handles credential validation
```

**Test pattern:**
```typescript
await loginPage.login();
await ordersPage.gotoOrdersPage();
// Use .first() since testid is dynamic (orders-row-{id})
await expect(page.locator('[data-testid^="orders-row-"]').first(), "First order row should be visible").toBeVisible();
await expect(page.locator('[data-testid^="orders-badge-status-"]').first(), "Status badge should be visible").toBeVisible();
// Time remaining (for pending orders)
await expect(page.locator('[data-testid^="orders-text-time-remaining-"]').first(), "Time remaining should be visible for active orders").toBeVisible();
// Navigate to order detail by clicking a row
await page.locator('[data-testid^="orders-row-"]').first().click();
await expect(page.getByTestId("order-details-badge-status"), "Order detail status badge should be visible").toBeVisible();
```

---

### Flow 3 — Past orders date filter

**Account setup (Pattern C — account must have ≥1 past order):**
```typescript
// loginPage.login() handles credential validation
```

**Test pattern:**
```typescript
await loginPage.login();
await ordersPage.gotoOrdersPage();
await ordersPage.switchToPastOrders();
await expect(page.locator('[data-testid^="orders-row-"]').first(), "Past order row should be visible").toBeVisible();
// Date filter is only shown when past orders exist
await expect(page.getByTestId("orders-select-date-filter"), "Date filter should be visible for past orders with results").toBeVisible();
// Interact with the date filter (DateFilter component — no inner testid; use role)
await page.getByTestId("orders-select-date-filter").getByRole("button").first().click();
// 🔍 Verify exact date filter dropdown locators on staging
```

---

### Flow 4 — Rate past order

**Account setup (Pattern C — account must have a reviewable past order):**
```typescript
// loginPage.login() handles credential validation
```

**Test pattern:**
```typescript
await loginPage.login();
await ordersPage.gotoOrdersPage();
await ordersPage.switchToPastOrders();
// Rate button testid is dynamic: orders-btn-rate-{id}
await page.locator('[data-testid^="orders-btn-rate-"]').first().click();
// Rating sidebar opens — RatingSidebar component (no dedicated testid on the sidebar container)
// 🔍 Verify rating sidebar locator on staging
await expect(page.getByText("Would you recommend this", { exact: false }), "Rating prompt should be visible").toBeVisible();
```

---

### Flow 5 — Order detail loads

**Account setup (Pattern C — env var, must know an ORDER_ID):**
```typescript
let ORDER_ID: string = undefined!;
test.beforeAll(() => {
  const id = process.env.ORDER_ID;
  if (!id) throw new Error("ORDER_ID must be set in playwright/.env.staging for order detail tests");
  ORDER_ID = id;
});
```

**Test pattern:**
```typescript
await loginPage.login();
await page.goto(`/orders/${ORDER_ID}`);
await expect(page.getByTestId("order-details-badge-status"), "Status badge should be visible").toBeVisible();
// View order details
await page.getByTestId("order-details-btn-view-details").click();
await expect(page.getByText("Order details"), "Order details modal/sidebar should open").toBeVisible();
// Payment accordion
await expect(page.getByTestId("order-details-accordion-payment"), "Payment accordion should be visible").toBeVisible();
// Time remaining (pending orders)
await expect(page.getByTestId("order-details-text-time-remaining"), "Time remaining should be shown for pending orders").toBeVisible();
```

**⚠️ POM gap note:** Existing `OrderDetailPage` uses stale testids (`order-detail-id`, `order-detail-status`, `order-btn-confirm-payment`, etc.) that do NOT match source. Update the POM before writing tests. Correct testids are `order-details-badge-status`, `order-details-btn-paid`, `order-details-btn-cancel`, `order-details-btn-received`.

---

### Flow 6 — Buyer actions on pending_payment order

**Account setup (Pattern C — buyer account with a `pending_payment` order):**
```typescript
let ORDER_ID: string = undefined!;
test.beforeAll(() => {
  const id = process.env.ORDER_ID;
  if (!id) throw new Error("ORDER_ID must be set (pending_payment buyer-side order)");
  ORDER_ID = id;
});
```

**Test pattern (serial — order state changes between steps):**
```typescript
test.describe.configure({ mode: 'serial' });

// Step: verify action buttons
await loginPage.login();
await page.goto(`/orders/${ORDER_ID}`);
await expect(page.getByTestId("order-details-btn-cancel"), "Cancel button should be visible for buyer pending_payment").toBeVisible();
await expect(page.getByTestId("order-details-btn-paid"), "I've paid button should be visible").toBeVisible();

// Step: open payment confirmation sidebar
await page.getByTestId("order-details-btn-paid").click();
await expect(page.getByTestId("order-details-sheet-confirm-payment"), "Payment confirmation sidebar should open").toBeVisible();

// Step: upload proof of payment (file upload)
// NOTE: This uses a real file upload — provide a test file
await page.setInputFiles('[data-testid="order-details-sheet-confirm-payment"] input[type="file"]', 'playwright/test-data/sample-payment-proof.jpg');
await expect(page.getByTestId("order-details-btn-confirm-payment"), "Submit button should be enabled after file selection").toBeEnabled();
await page.getByTestId("order-details-btn-confirm-payment").click();
// Toast appears after submission
await expect(page.getByText("Proof of transfer submitted"), "Success toast should appear").toBeVisible();

// Step: cancel order flow (separate test — resets to fresh pending_payment order)
await page.getByTestId("order-details-btn-cancel").click();
await expect(page.getByTestId("order-details-alert-cancel"), "Cancel confirmation dialog should open").toBeVisible();
await page.getByTestId("order-details-btn-confirm-cancel").click();
// After cancellation — status badge updates
await expect(page.getByTestId("order-details-badge-status"), "Status badge should reflect cancelled state").toBeVisible();
```

---

### Flow 7 — Seller actions on pending_release order

**Account setup (Pattern C — seller account with a `pending_release` order):**
```typescript
let ORDER_ID: string = undefined!;
test.beforeAll(() => {
  const id = process.env.ORDER_ID;
  if (!id) throw new Error("ORDER_ID must be set (pending_release seller-side order)");
  ORDER_ID = id;
});
```

**Test pattern (serial):**
```typescript
test.describe.configure({ mode: 'serial' });

await loginPage.login();
await page.goto(`/orders/${ORDER_ID}`);
await expect(page.getByTestId("order-details-btn-received"), "I've received payment button should be visible").toBeVisible();
await page.getByTestId("order-details-btn-received").click();

// When orderVerificationEnabled = true (default):
await expect(page.getByTestId("order-details-sheet-confirm-received"), "OTP sidebar should open").toBeVisible();
await expect(page.getByTestId("order-details-input-otp"), "OTP input should be visible").toBeVisible();
// Enter OTP from email — 6 digits auto-submit
// [OTP value must be retrieved via MailiskUtils in staging]
await page.getByTestId("order-details-input-otp").fill("123456"); // replace with real OTP

// After successful OTP — order completes
await expect(page.getByTestId("order-details-badge-status"), "Status should update to Completed").toBeVisible();
// Rate transaction (if reviewable)
await expect(page.getByTestId("order-details-btn-rate"), "Rate transaction button should appear for completed reviewable orders").toBeVisible();
await page.getByTestId("order-details-btn-rate").click();
await expect(page.getByText("Would you recommend this", { exact: false }), "Rating sidebar should open").toBeVisible();
```

---

### G1 — Complaint form on timed-out order

**Account setup (Pattern C — account with a `timed_out` order):**
```typescript
let ORDER_ID: string = undefined!;
test.beforeAll(() => {
  const id = process.env.ORDER_ID_TIMEOUT;
  if (!id) throw new Error("ORDER_ID_TIMEOUT must be set (timed_out order)");
  ORDER_ID = id;
});
```

**Test pattern:**
```typescript
await loginPage.login();
await page.goto(`/orders/${ORDER_ID}`);
await expect(page.getByTestId("order-details-btn-complaint"), "Complain button should be visible for timed_out orders").toBeVisible();
await page.getByTestId("order-details-btn-complaint").click();
await expect(page.getByTestId("complaint-form-container"), "Complaint form should open").toBeVisible();
await page.locator('[data-testid^="complaint-btn-reason-"]').first().click();
await page.getByTestId("complaint-checkbox-confirm").click();
await expect(page.getByTestId("complaint-btn-submit"), "Submit button should be enabled after selection + checkbox").toBeEnabled();
await page.getByTestId("complaint-btn-submit").click();
```

---

### G2 — Temp ban alert on orders page

**Account setup (Pattern C — temp-banned account):**
```typescript
// Requires a dedicated test account that is temporarily banned
```

**Test pattern:**
```typescript
await loginPage.login(); // banned account credentials
await ordersPage.gotoOrdersPage();
await expect(page.getByTestId("orders-alert-temp-ban"), "Temp ban alert should be visible").toBeVisible();
```

---

### G3 — Previous orders section (v1 signup)

**Account setup (Pattern C — account with `signup === "v1"`):**

**Test pattern:**
```typescript
await loginPage.login(); // v1 signup account
await ordersPage.gotoOrdersPage();
await expect(page.getByTestId("orders-btn-check-previous"), "Check previous orders button should be visible for v1 accounts").toBeVisible();
await page.getByTestId("orders-btn-check-previous").click();
await expect(page.getByTestId("orders-section-previous"), "Previous orders section should render").toBeVisible();
await expect(page.getByText("Previous orders"), "Previous orders heading should be visible").toBeVisible();
// Navigate back
await page.getByRole("button", { name: "Close" }).click(); // 🔍 Verify back button locator on staging
await expect(ordersPage.activeOrdersTab, "Orders list should return after back navigation").toBeVisible();
```

---

### G4 — OTP error on payment received

**Account setup (Pattern C — seller on a `pending_release` order):**

**Test pattern:**
```typescript
await loginPage.login();
await page.goto(`/orders/${ORDER_ID}`);
await page.getByTestId("order-details-btn-received").click();
await expect(page.getByTestId("order-details-sheet-confirm-received"), "OTP sidebar should be visible").toBeVisible();
// Enter wrong OTP
await page.getByTestId("order-details-input-otp").fill("000000");
await expect(page.getByTestId("order-details-error-otp"), "OTP error message should be visible").toBeVisible();
// Verify resend flow (after timer expires)
// 🔍 Timer is 59s — use a pre-expired account state or mock timer in test
```

---

## Section 3 — Tags Reference

| Tag | When to apply |
|---|---|
| `@orders` | All tests in the Orders module |
| `@smoke` | Critical happy path only — fast, no account state change (Flow 1) |
| `@production` | Safe to run on production — read-only, no mutations (Flow 1) |
| `@staging` | Requires staging env — uses pre-existing orders or mutates order state |
| `@desktop` | Desktop viewport (1280×720) |
| `@mobile` | Mobile viewport (chromium-mobile, Pixel 7) |

---

## Section 4 — Feature-Specific Decisions

### Dynamic testids on order rows

Order rows and badges use `data-testid={`orders-row-${order.id}`}` — the `id` is a runtime server value. Tests must use prefix selectors: `page.locator('[data-testid^="orders-row-"]')`. Never hardcode a specific order ID in a locator.

**Impact on generated code:** Always use attribute prefix selectors (`^=`) or `.first()` when selecting order row elements. Never use `getByTestId("orders-row-123")` with a literal ID.

### Serial mode for state-mutating order flows

Flows 6 and 7 mutate order state (pay, cancel, complete). Tests within these flows must run in `test.describe.configure({ mode: 'serial' })` to prevent race conditions where a later test depends on state set by an earlier test.

**Impact on generated code:** Add `test.describe.configure({ mode: 'serial' })` at the top of spec files for Flows 6 and 7.

### Buyer vs seller role determines visible buttons

The buttons rendered on the order detail page depend on both the order `type` (buy/sell) and whether the current user is the order creator or the advert creator:
- **Buyer on pending_payment**: sees `order-details-btn-paid` + `order-details-btn-cancel`
- **Seller on pending_release / timed_out / disputed**: sees `order-details-btn-received`
- **Completed + reviewable**: sees `order-details-btn-rate`
- **Timed-out (buyer side)**: sees `order-details-btn-complaint`

**Impact on generated code:** Each buyer/seller action flow must use a dedicated test account in the correct role. Do not use the same account for both buyer and seller flows.

### OTP sidebar vs direct completion

`PaymentReceivedConfirmationSidebar` opens only when `orderVerificationEnabled = true` (default, loaded from `AuthAPI.getSettings()`). If the setting is disabled, clicking `order-details-btn-received` calls `OrdersAPI.completeOrder` directly with no OTP step.

**Impact on generated code:** Flow 7 tests should check for the OTP sidebar first. If it doesn't appear within a reasonable timeout, fall back to asserting the direct completion path (status badge changes to Completed).

### Payment proof upload is file I/O

The payment confirmation sidebar (`order-details-sheet-confirm-payment`) requires a real file upload via `page.setInputFiles()`. The file input has `id="file-upload"` and `type="file"` but no direct `data-testid`. Use `page.setInputFiles('#file-upload', ...)` or scope it within the sidebar's container.

**Impact on generated code:** Place a sample test file at `playwright/test-data/sample-payment-proof.jpg`. The submit button (`order-details-btn-confirm-payment`) is disabled until a file is selected — always verify `.toBeEnabled()` before clicking.

### Desktop vs mobile chat behaviour

On the orders list page, clicking the chat icon (`orders-btn-chat-{id}`) behaves differently:
- **Desktop**: navigates to `/orders/{id}` (same as clicking the row)
- **Mobile**: opens an inline `OrderChat` panel within the same page (does NOT navigate)

The `OrderChat` component itself shows on desktop as the right column of the order detail page layout. On mobile, chat is a full-screen view reachable from both the orders list chat icon and the chat icon on the order detail page.

**Impact on generated code:** Use `isMobileViewport` fixture to branch assertions. On mobile, assert `order-chat-container` is visible after clicking chat; on desktop, assert URL change to `/orders/{id}`.

### Check previous orders button (v1 signup gate)

The "Check previous orders" button (`orders-btn-check-previous`) is only rendered when `userData?.signup === "v1"`. This requires a dedicated v1 legacy account for testing. The button reveals an iframe pointing to the old P2P v1 orders page.

**Impact on generated code:** G3 requires a dedicated v1 signup test account credential. The iframe content is cross-origin and cannot be asserted — only assert the `orders-section-previous` container and heading text.
