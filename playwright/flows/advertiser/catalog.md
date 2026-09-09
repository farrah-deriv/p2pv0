# 🗺️ Advertiser Journey Catalog — Technical Reference

> Source of truth: `playwright/pages/AdvertiserPage.ts`
> Created: 2026-06-25 | Last updated: 2026-06-25

---

## Section 1 — Journey Index

| Journey ID | Spec File | Tags |
|---|---|---|
| Flow 1 | `advertiser/verify-advertiser-profile-loads.spec.ts` | `@desktop @mobile @advertiser @smoke @staging` |
| Flow 2 | `advertiser/verify-advertiser-no-ads.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 3 | `advertiser/verify-advertiser-follow.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 4 | `advertiser/verify-advertiser-unfollow.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 5 | `advertiser/verify-advertiser-block.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 6 | `advertiser/verify-advertiser-unblock.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 7 | `advertiser/verify-advertiser-order-sidebar.spec.ts` | `@desktop @mobile @advertiser @staging` |
| Flow 8 | `advertiser/verify-advertiser-deep-link-adid.spec.ts` | `@desktop @mobile @advertiser @staging` |
| G1 | `advertiser/verify-advertiser-own-profile.spec.ts` | `@desktop @mobile @advertiser @staging` |
| G2 | `advertiser/verify-advertiser-deep-link-missing-ad.spec.ts` | `@desktop @mobile @advertiser @staging` |
| G3 | `advertiser/verify-advertiser-stats-modal.spec.ts` | `@desktop @mobile @advertiser @staging` |

> Spec file paths are relative to `playwright/tests/` — do not include the `playwright/tests/` prefix.

---

## Section 2 — Flow Details

### Shared setup — env var credentials

```typescript
let TEST_EMAIL: string = undefined!;
let TEST_PASSWORD: string = undefined!;
let TEST_ADVERTISER_ID: string = undefined!;

test.beforeAll(() => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  const advertiserId = process.env.TEST_ADVERTISER_ID;
  if (!email || !password || !advertiserId) {
    throw new Error(
      "TEST_EMAIL, TEST_PASSWORD and TEST_ADVERTISER_ID must be set in playwright/.env.staging"
    );
  }
  TEST_EMAIL = email;
  TEST_PASSWORD = password;
  TEST_ADVERTISER_ID = advertiserId;
});
```

### Shared navigation helper

```typescript
await loginPage.login(); // Ory Kratos 2-step: /login → /enter-password → /
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded(); // asserts advertiserName heading visible
```

---

### Flow 1 — Advertiser profile page loads with stats and ads

**Account setup:** Env var credentials (shared setup). `TEST_ADVERTISER_ID` account must have at least one active ad.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded();

// Verify stats row
await expect(
  page.getByText("Buy completion rate (30d)"),
  "Buy completion rate label should be visible"
).toBeVisible();
await expect(
  page.getByText("Sell completion rate (30d)"),
  "Sell completion rate label should be visible"
).toBeVisible();
await expect(
  page.getByRole("button", { name: "View more" }),
  "View more button should be visible"
).toBeVisible();

// Verify online ads section
await expect(
  page.getByText("Online ads"),
  "Online ads section heading should be visible"
).toBeVisible();

// Verify table headers (desktop only — hidden on mobile via lg:table-header-group)
if (!isMobileViewport) {
  await expect(page.getByRole("columnheader", { name: "Rates" }), "Rates column header").toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Order limits" }), "Order limits column header").toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Time limit" }), "Time limit column header").toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Payment methods" }), "Payment methods column header").toBeVisible();
}

// Verify at least one Buy or Sell button in the ads table
await expect(
  page.getByRole("button", { name: /^(Sell|Buy) [A-Z]{3}$/ }).first(),
  "At least one Buy/Sell action button should be visible"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Advertiser nickname | `page.getByTestId('advertiser-text-nickname')` | `data-testid="advertiser-text-nickname"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Online status badge | `page.getByTestId('advertiser-badge-online-status')` | `data-testid="advertiser-badge-online-status"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Completion rate | `page.getByTestId('advertiser-text-completion-rate')` | `data-testid="advertiser-text-completion-rate"` in `advertiser-stats.tsx` | ✅ |
| Order count | `page.getByTestId('advertiser-text-order-count')` | `data-testid="advertiser-text-order-count"` in `advertiser-stats.tsx` | ✅ |
| Buy completion label | `getByText('Buy completion rate (30d)')` | i18n: `t('advertiser.buyCompletionRate30d')` | ✅ |
| Sell completion label | `getByText('Sell completion rate (30d)')` | i18n: `t('advertiser.sellCompletionRate30d')` | ✅ |
| View more button | `getByRole('button', { name: 'View more' })` | i18n: `t('advertiser.viewMore')` | ✅ |
| Online ads heading | `getByText('Online ads')` | i18n: `t('advertiser.onlineAds')` | ✅ |
| Rates column | `getByRole('columnheader', { name: 'Rates' })` | i18n: `t('advertiser.rates')` | ✅ |
| Order limits column | `getByRole('columnheader', { name: 'Order limits' })` | i18n: `t('advertiser.orderLimits')` | ✅ |
| Time limit column | `getByRole('columnheader', { name: 'Time limit' })` | i18n: `t('advertiser.timeLimit')` | ✅ |
| Payment methods column | `getByRole('columnheader', { name: 'Payment methods' })` | i18n: `t('advertiser.paymentMethods')` | ✅ |
| Ad row (per ad) | `page.getByTestId(\`advertiser-row-ad-${adId}\`)` | `data-testid=\`advertiser-row-ad-${ad.id}\`` in `app/advertiser/[id]/page.tsx` | ✅ |
| Ad rate text | `page.getByTestId(\`advertiser-text-rate-${adId}\`)` | `data-testid=\`advertiser-text-rate-${ad.id}\`` | ✅ |
| Ad limits text | `page.getByTestId(\`advertiser-text-limits-${adId}\`)` | `data-testid=\`advertiser-text-limits-${ad.id}\`` | ✅ |
| Trade button (per ad) | `page.getByTestId(\`advertiser-btn-trade-${adId}\`)` | `data-testid=\`advertiser-btn-trade-${ad.id}\`` | ✅ |
| Buy/Sell action button | `getByRole('button', { name: /^(Sell\|Buy) [A-Z]{3}$/ })` | i18n: `t('common.sell')` / `t('common.buy')` + currency | 🔍 Verify regex on staging |

---

### Flow 2 — Advertiser profile shows empty state

**Account setup:** Env var credentials; `TEST_ADVERTISER_ID` must have no active ads.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded();

await expect(
  page.getByTestId("advertiser-empty-ads"),
  "Empty ads container should be visible"
).toBeVisible();
await expect(
  page.getByText("No ads yet"),
  "Empty state title should be visible"
).toBeVisible();
await expect(
  page.getByText("This advertiser do not have any active ads."),
  "Empty state description should be visible"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Empty ads container | `page.getByTestId('advertiser-empty-ads')` | `data-testid="advertiser-empty-ads"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Empty state title | `getByText('No ads yet')` | i18n: `t('advertiser.noAdsYet')` | ✅ |
| Empty state description | `getByText('This advertiser do not have any active ads.')` | i18n: `t('advertiser.noActiveAds')` | ✅ |

---

### Flow 3 — Follow an advertiser

**Account setup:** Env var credentials; logged-in user must NOT be following `TEST_ADVERTISER_ID`.

**Note:** Follow/Block buttons are only rendered when `userId != profile.id`. Use a test account that is different from the advertiser account.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);

// Confirm not already following
await expect(
  page.getByRole("button", { name: "Follow" }),
  "Follow button should be visible when not following"
).toBeVisible();

await page.getByRole("button", { name: "Follow" }).click();

// 🔍 Verify on staging — toast mechanism:
await expect(
  page.getByText("Successfully followed"),
  "Follow success toast should be visible"
).toBeVisible();

// Button state change
await expect(
  page.getByRole("button", { name: "Following" }),
  "Button should change to Following after follow"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Follow button | `page.getByTestId('advertiser-btn-follow')` | `data-testid="advertiser-btn-follow"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Follow toast | `getByText('Successfully followed')` | i18n: `t('advertiser.successfullyFollowed')` | ✅ |
| Following / Unfollow button | `page.getByTestId('advertiser-btn-unfollow')` | `data-testid="advertiser-btn-unfollow"` in `app/advertiser/[id]/page.tsx` | ✅ |

---

### Flow 4 — Unfollow an advertiser via the Following button

**Account setup:** Env var credentials; logged-in user IS currently following `TEST_ADVERTISER_ID`.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);

// Click the Following/Unfollow button directly
await page.getByTestId("advertiser-btn-unfollow").click();

await expect(
  page.getByText("Successfully unfollowed"),
  "Unfollow success toast should be visible"
).toBeVisible();
await expect(
  page.getByRole("button", { name: "Follow" }),
  "Button should revert to Follow"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Following / Unfollow button | `page.getByTestId('advertiser-btn-unfollow')` | `data-testid="advertiser-btn-unfollow"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Unfollow toast | `getByText('Successfully unfollowed')` | i18n: `t('advertiser.successfullyUnfollowed')` | ✅ |
| Follow button (after) | `page.getByTestId('advertiser-btn-follow')` | `data-testid="advertiser-btn-follow"` in `app/advertiser/[id]/page.tsx` | ✅ |

---

### Flow 5 — Block an advertiser

**Account setup:** Env var credentials; logged-in user is NOT blocking `TEST_ADVERTISER_ID`.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);

await page.getByTestId("advertiser-btn-block").click();

// Alert dialog confirmation
// Title is parameterised: "Block {nickname}?" — use partial match
await expect(
  page.getByRole("alertdialog").or(page.getByRole("dialog")),
  "Block confirmation dialog should be visible"
).toBeVisible();
await expect(
  page.getByText("Block", { exact: false }).filter({ hasText: /\?/ }).first(),
  "Block confirmation title should be visible"
).toBeVisible();

// Confirm
await page.getByRole("button", { name: "Block" }).last().click();

// Blocked state
// Toast is parameterised: "{nickname} blocked." — use partial match
await expect(
  page.getByText("blocked.", { exact: false }),
  "Block success toast should be visible"
).toBeVisible();
await expect(
  page.getByRole("heading", { name: "You've blocked this user" }),
  "Blocked state heading should be visible"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Block button | `page.getByTestId('advertiser-btn-block')` | `data-testid="advertiser-btn-block"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Block confirmation dialog | `getByRole('alertdialog')` or `getByRole('dialog')` | Radix AlertDialog | 🔍 Verify role on staging |
| Block confirm button | `getByRole('button', { name: 'Block' }).last()` | i18n: `t('advertiser.block')` in dialog | ✅ |
| Block toast | `getByText('blocked.', { exact: false })` | i18n: `t('advertiser.userBlocked', { nickname })` — parameterised | ✅ partial match |
| Blocked heading | `getByRole('heading', { name: "You've blocked this user" })` | i18n: `t('advertiser.youveBlockedUser')` | ✅ |

---

### Flow 6 — Unblock an advertiser

**Account setup:** Env var credentials; logged-in user IS blocking `TEST_ADVERTISER_ID`.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);

// Verify blocked state
await expect(
  page.getByRole("heading", { name: "You've blocked this user" }),
  "Blocked heading should be visible"
).toBeVisible();

await page.getByTestId("advertiser-btn-unblock").click();

// Toast is parameterised: "{nickname} unblocked." — use partial match
await expect(
  page.getByText("unblocked.", { exact: false }),
  "Unblock success toast should be visible"
).toBeVisible();

// Normal profile view restored
await expect(
  page.getByText("Online ads"),
  "Ads section should be visible after unblock"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Unblock button | `page.getByTestId('advertiser-btn-unblock')` | `data-testid="advertiser-btn-unblock"` in `app/advertiser/[id]/page.tsx` | ✅ |
| Unblock toast | `getByText('unblocked.', { exact: false })` | i18n: `t('advertiser.userUnblocked', { nickname })` — parameterised | ✅ partial match |
| Blocked heading | `getByRole('heading', { name: "You've blocked this user" })` | i18n: `t('advertiser.youveBlockedUser')` | ✅ |

---

### Flow 7 — Open order sidebar from an advertiser's ad

**Account setup:** Env var credentials; `TEST_ADVERTISER_ID` has active ads; logged-in user is NOT the advertiser and is not blocked; no temp ban.

**Note:** The `OrderSidebar` is the same component used on the Markets page. This flow verifies that ad row click correctly passes the ad to the sidebar — not the full order completion flow. See `orders/` module for order completion flows.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded();

// Click first available Buy/Sell button
const actionButton = page.getByRole("button", { name: /^(Sell|Buy) [A-Z]{3}$/ }).first();
await actionButton.click();

// Order sidebar should open (unless risk warning modal is triggered first)
// For a safe test account (no risk flags) the sidebar opens directly:
await expect(
  page.getByTestId("order-sidebar-container"),
  "Order sidebar should be open"
).toBeVisible({ timeout: 5000 });
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Trade button (per ad) | `page.getByTestId(\`advertiser-btn-trade-${adId}\`).first()` | `data-testid=\`advertiser-btn-trade-${ad.id}\`` in `app/advertiser/[id]/page.tsx` | ✅ |
| Buy/Sell action button | `getByRole('button', { name: /^(Sell\|Buy) [A-Z]{3}$/ }).first()` | i18n: `t('common.sell')` / `t('common.buy')` + currency | 🔍 Verify regex on staging |
| Order sidebar | `page.getByTestId("order-sidebar-container")` | `data-testid="order-sidebar-container"` in `order-sidebar.tsx` | ✅ |

---

### Flow 8 — Deep link with `?adId=` param auto-opens order sidebar

**Account setup:** Env var credentials; `TEST_ADVERTISER_ID` has a known ad with `TEST_AD_ID`; not blocked.

**Test pattern:**

```typescript
await loginPage.login();
// Navigate directly with adId deep link
await page.goto(`/advertiser/${TEST_ADVERTISER_ID}?adId=${TEST_AD_ID}`);

// Profile loads then sidebar opens automatically when adverts array includes the adId
await advertiserPage.verifyAdvertiserPageLoaded();

// Sidebar auto-opens after adverts load:
await expect(
  page.getByTestId("order-sidebar-container"),
  "Order sidebar should auto-open for the deep-linked ad"
).toBeVisible({ timeout: 10000 });
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Order sidebar | `page.getByTestId("order-sidebar-container")` | `data-testid="order-sidebar-container"` in `order-sidebar.tsx` | ✅ |

---

### G1 — Own profile hides Follow and Block buttons

**Account setup:** Env var credentials; navigate to the advertiser profile of the SAME account that is logged in. Requires `TEST_OWN_ADVERTISER_ID` = the logged-in user's own advertiser ID.

**Test pattern:**

```typescript
await loginPage.login();
// Navigate to own advertiser profile
await advertiserPage.gotoAdvertiserPage(TEST_OWN_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded();

// Follow and Block buttons must NOT be rendered (userId == profile.id guard in source)
await expect(
  page.getByRole("button", { name: "Follow" }),
  "Follow button should not be visible on own profile"
).not.toBeVisible();
await expect(
  page.getByRole("button", { name: "Block" }),
  "Block button should not be visible on own profile"
).not.toBeVisible();
```

---

### G2 — Deep link with non-existent adId shows alert

**Account setup:** Env var credentials; use a fake ad ID that does not exist.

**Test pattern:**

```typescript
await loginPage.login();
await page.goto(`/advertiser/${TEST_ADVERTISER_ID}?adId=9999999`);
await advertiserPage.verifyAdvertiserPageLoaded();

// Alert dialog should appear once adverts have loaded and the ID is not found
await expect(
  page.getByRole("heading", { name: "Ad not available" }),
  "Ad not available alert title should be visible"
).toBeVisible({ timeout: 10000 });
await expect(
  page.getByText("This ad is no longer available. Choose another ad."),
  "Alert description should be visible"
).toBeVisible();
await page.getByRole("button", { name: "Got it" }).click();
await expect(
  page.getByRole("heading", { name: "Ad not available" }),
  "Alert should close after Got it"
).not.toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Alert title | `getByRole('heading', { name: 'Ad not available' })` | i18n: `t('order.adNotAvailableTitle')` | ✅ |
| Alert description | `getByText('This ad is no longer available. Choose another ad.')` | i18n: `t('order.adNotAvailableMessage')` | ✅ |
| Got it button | `getByRole('button', { name: 'Got it' })` | i18n: `t('common.gotIt')` | ✅ |

---

### G3 — View advertiser stats detail modal

**Account setup:** Env var credentials; `TEST_ADVERTISER_ID` has stats data.

**Test pattern:**

```typescript
await loginPage.login();
await advertiserPage.gotoAdvertiserPage(TEST_ADVERTISER_ID);
await advertiserPage.verifyAdvertiserPageLoaded();

await page.getByRole("button", { name: "View more" }).click();

// Desktop: Dialog; Mobile: Drawer — both have title "Advertiser info"
await expect(
  page.getByText("Advertiser info"),
  "Stats modal title should be visible"
).toBeVisible();

// Verify stats rows in the modal
await expect(page.getByText("Buy completion rate (30d)").last(), "Buy completion row").toBeVisible();
await expect(page.getByText("Sell completion rate (30d)").last(), "Sell completion row").toBeVisible();
await expect(page.getByText("Total trades (30d)").last(), "Total trades 30d row").toBeVisible();
await expect(page.getByText("Total all time trades").last(), "Total all time trades row").toBeVisible();

await page.getByRole("button", { name: "Close" }).click();
await expect(
  page.getByText("Advertiser info"),
  "Stats modal should close"
).not.toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| View more button | `getByRole('button', { name: 'View more' })` | i18n: `t('advertiser.viewMore')` | ✅ |
| Modal title | `getByText('Advertiser info')` | i18n: `t('advertiser.advertiserInfo')` | ✅ |
| Total trades 30d row | `getByText('Total trades (30d)').last()` | i18n: `t('advertiser.totalTrades30d')` | ✅ |
| Total all time row | `getByText('Total all time trades').last()` | i18n: `t('advertiser.totalAllTimeTrades')` | ✅ |
| Close button | `getByRole('button', { name: 'Close' })` | i18n: `t('advertiser.close')` | ✅ |

---

## Section 3 — Tags Reference

| Tag | When to apply |
|---|---|
| `@advertiser` | All tests in the Advertiser module |
| `@smoke` | Flow 1 only — profile load is read-only and does not mutate account state |
| `@staging` | All advertiser tests — follow/block/unblock mutate account state and require staging credentials |
| `@desktop` | Desktop viewport (1280×720, `chromium` project) |
| `@mobile` | Mobile viewport (412×915, `chromium-mobile` project) |

---

## Section 4 — Feature-Specific Decisions

### Source testids are confirmed; POM testid names differ

`data-testid` attributes have been added to all major advertiser elements. The actual testids differ from legacy POM names — use source-confirmed values from this catalog. Key differences:

| POM reference | Actual source testid |
|---|---|
| `advertiser-name` | `advertiser-text-nickname` |
| `advertiser-btn-block` | `advertiser-btn-block` ✅ (matches) |
| N/A | `advertiser-btn-follow` |
| N/A | `advertiser-btn-unfollow` |
| N/A | `advertiser-btn-add-closed-group` |
| N/A | `advertiser-btn-remove-closed-group` |
| N/A | `advertiser-btn-unblock` |
| N/A | `advertiser-empty-ads` |
| N/A | `advertiser-row-ad-${id}`, `advertiser-btn-trade-${id}` |

**Impact on generated code:** Use `getByTestId('advertiser-text-nickname')` instead of `getByTestId('advertiser-name')` for the nickname heading. All follow/block/unblock buttons now have confirmed testids — use them directly.

### Follow/Block buttons only shown when `userId != profile.id`

The action button area (`<div className="flex items-center">`) is wrapped in `{userId != profile?.id && (...)}`. When viewing your own profile, neither "Follow" nor "Block" is rendered at all.

**Impact on generated code:** All follow/block/unblock tests must use a test account that is different from the advertiser. Use a dedicated advertiser account (`TEST_ADVERTISER_ID`) that is never the same as `TEST_EMAIL`.

### Block dialog shows a parameterised title

The block confirmation dialog title is `t('advertiser.blockUser', { nickname })` = `"Block {nickname}?"`. The exact text depends on the advertiser's nickname at runtime.

**Impact on generated code:** Use `getByText('Block', { exact: false })` or `getByRole('heading', { name: /Block .+\?/ })` rather than an exact match. The same applies to the block/unblock toast: `t('advertiser.userBlocked', { nickname })` = `"{nickname} blocked."` — use `getByText('blocked.', { exact: false })`.

### `adId` deep link fires only after ads list loads

The `useEffect` that opens the order sidebar for `adIdParam` depends on `adverts.length > 0`. If the ads haven't loaded yet when the param is processed, the sidebar won't open. The `useAdvertiserAds` hook uses infinite scroll with TanStack Query.

**Impact on generated code:** After navigating with `?adId=`, add a generous timeout on the sidebar assertion (≥10000ms) to account for the async ads load. Do not assert the sidebar immediately after navigation.

### Online/offline presence is real-time (WebSocket)

The advertiser's online dot is updated via `users_online` WebSocket channel. The dot colour (`bg-buy` = green for online, `bg-gray-400` for offline) reflects live state. Do not assert the exact online/offline state — it depends on whether the test advertiser's account is active at test run time.

**Impact on generated code:** Assert that the status dot *element* exists, not its colour. If colour must be asserted, use `toHaveClass` with `{ exact: false }` and note it may flake based on advertiser activity.

### Risk warning modal may intercept ad clicks (Flow 7)

`handleOrderClick` calls `evaluateRisk(ad)` before opening the sidebar. If risk criteria are met for the selected ad, a `RiskWarningModal` opens instead. For most standard test accounts this will not trigger, but if it does, the test must click "Continue" in the risk warning to proceed to the sidebar.

**Impact on generated code:** Add a conditional check — if a risk warning dialog appears, click the continue button first, then assert the sidebar. Or pre-select an ad known to have no risk flags.

### `return_to` and `tab` params control Back button navigation

`handleBack()` checks `returnTo === "profile"` and `tabParam` to decide where to route. If these params are absent, the back button routes to `/` (desktop) or `router.back()` (mobile). Tests that navigate from another page and expect Back to return there must include `?return_to=profile&tab=...` in the URL.

**Impact on generated code:** For the profile page itself, do not assert Back navigation unless explicitly testing the return-to-profile flow. The default back target is `/` (or browser history on mobile).

