# 🗺️ Ads Journey Catalog — Technical Reference

> Source of truth: `playwright/pages/AdsPage.ts`
> Created: 2026-06-25 | Last updated: 2026-07-03

---

## Section 1 — Journey Index

| Journey ID | Spec File | Tags |
|---|---|---|
| Flow 1 | `ads/verify-ads-list-loads.spec.ts` | `@desktop @mobile @ads @smoke @staging` |
| Flow 2 | `ads/verify-ads-empty-state.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 3 | `ads/verify-create-buy-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 4 | `ads/verify-create-sell-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 5 | `ads/verify-edit-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 6 | `ads/verify-deactivate-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 7 | `ads/verify-activate-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 8 | `ads/verify-delete-ad.spec.ts` | `@desktop @mobile @ads @staging` |
| Flow 9 | `ads/verify-hide-my-ads.spec.ts` | `@desktop @mobile @ads @staging` |
| G1 | `ads/verify-create-ad-kyc-blocked.spec.ts` | `@desktop @mobile @ads @staging` |
| G2 | `ads/verify-create-ad-limit-reached.spec.ts` | `@desktop @mobile @ads @staging` |
| G3 | `ads/verify-ad-visibility-warning.spec.ts` | `@desktop @mobile @ads @staging` |
| G4 | `ads/verify-edit-ad-payment-method-locked.spec.ts` | `@desktop @mobile @ads @staging` |

> Spec file paths are relative to `playwright/tests/` — do not include the `playwright/tests/` prefix.

---

## Section 2 — Flow Details

### Shared setup — env var credentials

```typescript
let TEST_EMAIL: string = undefined!;
let TEST_PASSWORD: string = undefined!;

test.beforeAll(() => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("TEST_EMAIL and TEST_PASSWORD must be set in playwright/.env.staging");
  }
  TEST_EMAIL = email;
  TEST_PASSWORD = password;
});
```

### Shared navigation helper

```typescript
await loginPage.login(); // Ory Kratos 2-step: /login → /enter-password → /
await adsPage.gotoAdsPage(); // navigates to /ads
await adsPage.verifyAdsPageLoaded(); // asserts "All ads" heading visible
```

---

### Flow 1 — My Ads page loads and displays existing ads

**Account setup:** Env var credentials (shared setup above). Account must have at least one existing ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();
await adsPage.verifyAdsPageLoaded();
// Verify page elements
await expect(page.getByTestId("ads-btn-create"), "Create ad button should be visible").toBeVisible();
// Hide toggle:
await expect(page.getByTestId("ads-switch-hide-ads"), "Hide my ads toggle should be visible").toBeVisible();
await expect(page.getByText("Hide my ads"), "Hide my ads label should be visible").toBeVisible();
// Ad table container:
await expect(page.getByTestId("ads-table-container"), "Ads table should be visible").toBeVisible();
// At least one ad row (dynamic testid):
await expect(page.locator("[data-testid^='ads-row-']").first(), "At least one ad row should be visible").toBeVisible();
// Status badges:
await expect(
  page.locator("[data-testid^='ads-badge-status-']").first(),
  "Status badge should be visible"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Create ad button | `page.getByTestId('ads-btn-create')` | `data-testid="ads-btn-create"` in `app/ads/page.tsx` | ✅ |
| Hide ads switch | `page.getByTestId('ads-switch-hide-ads')` | `data-testid="ads-switch-hide-ads"` in `app/ads/page.tsx` | ✅ |
| Hide ads info button | `page.getByTestId('ads-btn-hide-ads-info')` | `data-testid="ads-btn-hide-ads-info"` in `app/ads/page.tsx` | ✅ |
| Temp ban alert | `page.getByTestId('ads-alert-temp-ban')` | `data-testid="ads-alert-temp-ban"` in `app/ads/page.tsx` | ✅ |
| Ads table container | `page.getByTestId('ads-table-container')` | `data-testid="ads-table-container"` in `app/ads/page.tsx` | ✅ |
| Load more sentinel | `page.getByTestId('ads-sentinel-load-more')` | `data-testid="ads-sentinel-load-more"` in `app/ads/page.tsx` | ✅ |
| Create success modal | `page.getByTestId('ads-modal-create-success')` | `data-testid="ads-modal-create-success"` in `app/ads/page.tsx` | ✅ |
| Ad row (per ad) | `page.getByTestId(\`ads-row-${adId}\`)` | `data-testid=\`ads-row-${ad.id}\`` in `my-ads-table.tsx` | ✅ |
| Ad status badge (per ad) | `page.getByTestId(\`ads-badge-status-${adId}\`)` | `data-testid=\`ads-badge-status-${ad.id}\`` in `my-ads-table.tsx` | ✅ |
| Edit button (per ad) | `page.getByTestId(\`ads-btn-edit-${adId}\`)` | `data-testid=\`ads-btn-edit-${ad.id}\`` in `ad-actions-menu.tsx` | ✅ |
| Delete button (per ad) | `page.getByTestId(\`ads-btn-delete-${adId}\`)` | `data-testid=\`ads-btn-delete-${ad.id}\`` in `ad-actions-menu.tsx` | ✅ |
| `adsPage.buyAdsTab` | `getByTestId('ads-tab-buy')` | POM testid — NOT in source | ⚠️ Not confirmed |
| `adsPage.sellAdsTab` | `getByTestId('ads-tab-sell')` | POM testid — NOT in source | ⚠️ Not confirmed |
| Hide toggle label | `getByText('Hide my ads')` | i18n: `t('myAds.hideMyAds')` | ✅ text-based |
| Status badge text | `getByText('Active')` / `getByText('Inactive')` | i18n: `t('myAds.active')` / `t('myAds.inactive')` | ✅ text-based |

---

### Flow 2 — My Ads page shows empty state when no ads exist

**Account setup:** Env var credentials; account with no ads.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();
await expect(page.getByTestId("ads-empty-state"), "Empty state should be visible when no ads exist").toBeVisible();
await expect(
  page.getByText("You have no ads"),
  "Empty state title should be visible"
).toBeVisible();
await expect(page.getByRole("button", { name: "Create ad" }), "Create ad button should be visible in empty state").toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Empty state container | `page.getByTestId('ads-empty-state')` | `data-testid="ads-empty-state"` in `my-ads-table.tsx` | ✅ |
| Empty state title | `getByText('You have no ads')` | i18n: `t('myAds.noAdsTitle')` | ✅ text-based |

---

### Flow 3 — Create a Buy ad (3-step wizard, fixed rate)

**Account setup:** Env var credentials; KYC verified, P2P enabled, has compatible payment method.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();
await adsPage.clickCreateAd(); // navigates to /ads/create

// Step 0 — "Set ad and rate type"
await expect(page.getByText("Set ad and rate type"), "Step 0 title should be visible").toBeVisible();
// Buy is default — verify selected or click Buy radio
await page.getByPlaceholder("Total buy amount").fill("1000");
await page.getByPlaceholder("Minimum order").fill("10");
await page.getByPlaceholder("Maximum order").fill("500");
await page.getByTestId("ad-form-btn-next-step1").click();

// Step 1 — "Set payment details"
await expect(page.getByText("Set payment details"), "Step 1 title should be visible").toBeVisible();
// Select first available payment method
await page.getByRole("checkbox").first().check();
await page.getByTestId("ad-form-btn-next-step2").click();

// Step 2 — "Set ad conditions"
await expect(page.getByText("Set ad conditions"), "Step 2 title should be visible").toBeVisible();
await page.getByTestId("ad-form-btn-submit").click();

// Success screen
await expect(page.getByRole("heading", { name: "Ad created" }), "Success heading should be visible").toBeVisible();
await expect(page.getByTestId("ad-form-btn-done"), "Go to My ads button should be visible").toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Step 0 title | `getByText('Set ad and rate type')` | i18n: `t('adForm.setTypeAndPrice')` | ✅ |
| Step 1 title | `getByText('Set payment details')` | i18n: `t('adForm.setPaymentDetails')` | ✅ |
| Step 2 title | `getByText('Set ad conditions')` | i18n: `t('adForm.setAdConditions')` | ✅ |
| Total buy amount | `getByPlaceholder('Total buy amount')` | i18n: `t('adForm.buyQuantity')` | ✅ |
| Minimum order | `getByPlaceholder('Minimum order')` | i18n: `t('adForm.minimumOrder')` | ✅ |
| Maximum order | `getByPlaceholder('Maximum order')` | i18n: `t('adForm.maximumOrder')` | ✅ |
| Next button (step 0→1) | `page.getByTestId('ad-form-btn-next-step1')` | `data-testid="ad-form-btn-next-step1"` in `multi-step-ad-form.tsx` | ✅ |
| Next button (step 1→2) | `page.getByTestId('ad-form-btn-next-step2')` | `data-testid="ad-form-btn-next-step2"` in `multi-step-ad-form.tsx` | ✅ |
| Submit button (step 2) | `page.getByTestId('ad-form-btn-submit')` | `data-testid="ad-form-btn-submit"` in `multi-step-ad-form.tsx`; text = "Create ad" (create mode) / "Save changes" (edit mode) | ✅ |
| Success heading | `getByRole('heading', { name: 'Ad created' })` | i18n: `t('myAds.adCreated')` | ✅ |
| Go to My ads button | `page.getByTestId('ad-form-btn-done')` | `data-testid="ad-form-btn-done"` in `ad-success-screen.tsx` | ✅ |

---

### Flow 4 — Create a Sell ad (3-step wizard, fixed rate)

**Account setup:** Env var credentials; KYC verified, P2P enabled, funded P2P balance, has user payment method.

**Test pattern:**

```typescript
await loginPage.login();
// Navigate directly to sell create form via URL param:
await page.goto("/ads/create?operation=sell");

await expect(page.getByText("Set ad and rate type"), "Step 0 title should be visible").toBeVisible();
// Sell should be pre-selected due to ?operation=sell
await page.getByPlaceholder("Total sell amount").fill("500");
await page.getByPlaceholder("Minimum order").fill("10");
await page.getByPlaceholder("Maximum order").fill("200");
await page.getByRole("button", { name: "Next" }).click();

await expect(page.getByText("Set payment details"), "Step 1 title should be visible").toBeVisible();
// For Sell ads, user payment methods (with IDs) are shown — not payment method names
await page.getByRole("checkbox").first().check();
await page.getByRole("button", { name: "Next" }).click();

await expect(page.getByText("Set ad conditions"), "Step 2 title should be visible").toBeVisible();
await page.getByRole("button", { name: "Create ad" }).click();

await expect(page.getByRole("heading", { name: "Ad created" }), "Success heading should be visible").toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Total sell amount | `getByPlaceholder('Total sell amount')` | i18n: `t('adForm.sellQuantity')` | ✅ |
| *(Other locators same as Flow 3)* | — | — | — |

---

### Flow 5 — Edit an existing ad and save changes

**Account setup:** Env var credentials; account has at least one existing ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();

// Get the first ad ID from the DOM — ad rows use dynamic testids
const firstAdRow = page.locator("[data-testid^='ads-row-']").first();
const firstAdId = await firstAdRow.getAttribute("data-testid").then(id => id?.replace("ads-row-", ""));
// Click the edit button directly (no need to open the actions menu)
await page.getByTestId(`ads-btn-edit-${firstAdId}`).click();

// Should navigate to /ads/edit/{id}
await page.waitForURL(/\/ads\/edit\//);
await expect(page.getByRole("heading", { name: "Edit ad" }), "Edit ad heading should be visible").toBeVisible();

// Modify step 0 value
await page.getByPlaceholder("Minimum order").clear();
await page.getByPlaceholder("Minimum order").fill("15");
await page.getByRole("button", { name: "Next" }).click();

// Step 1 — no change needed
await page.getByRole("button", { name: "Next" }).click();

// Step 2 — Save changes
await page.getByRole("button", { name: "Save changes" }).click();

// Toast and redirect
// 🔍 Verify on staging — toast mechanism (shadcn Toaster component):
await expect(
  page.getByText("Ad details have been updated."),
  "Edit success toast should be visible"
).toBeVisible();
await page.waitForURL(/\/ads$/);
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Edit button (per ad) | `page.getByTestId(\`ads-btn-edit-${adId}\`)` | `data-testid=\`ads-btn-edit-${ad.id}\`` in `ad-actions-menu.tsx` | ✅ |
| Edit ad heading | `getByRole('heading', { name: 'Edit ad' })` | i18n: `t('adForm.editAd')` | ✅ |
| Save changes button | `getByRole('button', { name: 'Save changes' })` | i18n: `t('adForm.saveChanges')` | ✅ |
| Edit success toast | `getByText('Ad details have been updated.')` | i18n: `t('adForm.adUpdatedSuccess')` | ✅ |

---

### Flow 6 — Deactivate an active ad

**Account setup:** Env var credentials; account has at least one active ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();

// Find an active ad card and open actions
const activeAdCard = page.getByText("Active").first().locator("../..");
// Desktop — DropdownMenu; Mobile — Drawer
await activeAdCard.getByRole("button").last().click();
await page.getByText("Deactivate").click();

// 🔍 Verify toast mechanism on staging:
await expect(
  page.getByText("Ad has been deactivated."),
  "Deactivate toast should be visible"
).toBeVisible();
// Status badge should change:
await expect(page.getByText("Inactive").first(), "Ad status should change to Inactive").toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Deactivate option | `getByText('Deactivate')` | i18n: `t('myAds.deactivate')` | 🔍 Verify on staging |
| Deactivate toast | `getByText('Ad has been deactivated.')` | i18n: `t('myAds.adDeactivated')` | ✅ |
| Inactive badge | `getByText('Inactive')` | i18n: `t('myAds.inactive')` | ✅ |

---

### Flow 7 — Activate an inactive ad

**Account setup:** Env var credentials; account has at least one inactive ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();

const inactiveAdCard = page.getByText("Inactive").first().locator("../..");
await inactiveAdCard.getByRole("button").last().click();
await page.getByText("Activate").click();

await expect(
  page.getByText("Ad has been activated."),
  "Activate toast should be visible"
).toBeVisible();
await expect(page.getByText("Active").first(), "Ad status should change to Active").toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Activate option | `getByText('Activate')` | i18n: `t('myAds.activate')` | 🔍 Verify on staging |
| Activate toast | `getByText('Ad has been activated.')` | i18n: `t('myAds.adActivated')` | ✅ |

---

### Flow 8 — Delete an ad and confirm deletion

**Account setup:** Env var credentials; account has at least one existing ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();

const firstAdRow = page.locator("[data-testid^='ads-row-']").first();
const firstAdId = await firstAdRow.getAttribute("data-testid").then(id => id?.replace("ads-row-", ""));
await page.getByTestId(`ads-btn-delete-${firstAdId}`).click();

// Confirmation dialog
await expect(
  page.getByRole("heading", { name: "Delete ad?" }),
  "Delete confirmation dialog should be visible"
).toBeVisible();
await expect(
  page.getByText("You will not be able to restore it."),
  "Delete confirmation description should be visible"
).toBeVisible();

// Confirm deletion (button text 🔍 Verify on staging — likely "Delete" or "Yes, delete"):
await page.getByRole("button", { name: "Delete" }).last().click();

await expect(
  page.getByText("Ad has been deleted."),
  "Delete success toast should be visible"
).toBeVisible();
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Delete button (per ad) | `page.getByTestId(\`ads-btn-delete-${adId}\`)` | `data-testid=\`ads-btn-delete-${ad.id}\`` in `ad-actions-menu.tsx` | ✅ |
| Delete dialog title | `getByRole('heading', { name: 'Delete ad?' })` | i18n: `t('myAds.deleteAdTitle')` | ✅ |
| Delete dialog description | `getByText('You will not be able to restore it.')` | i18n: `t('myAds.deleteAdDescription')` | ✅ |
| Delete success toast | `getByText('Ad has been deleted.')` | i18n: `t('myAds.adDeleted')` | ✅ |

---

### Flow 9 — Toggle "Hide my ads" switch

**Account setup:** Env var credentials; account has at least one existing ad.

**Test pattern:**

```typescript
await loginPage.login();
await adsPage.gotoAdsPage();

const hideToggle = page.getByTestId("ads-switch-hide-ads");
await expect(page.getByText("Hide my ads"), "Hide my ads label should be visible").toBeVisible();
await expect(hideToggle, "Hide ads switch should be visible").toBeVisible();
await hideToggle.click();

// Verify toggled state (aria-checked attribute on Radix Switch):
await expect(hideToggle, "Toggle should reflect hidden state").toHaveAttribute("aria-checked", "true");

// Toggle back
await hideToggle.click();
await expect(hideToggle, "Toggle should reflect visible state").toHaveAttribute("aria-checked", "false");
```

**Locators used:**

| Locator name | Strategy | Value | Status |
|---|---|---|---|
| Hide ads switch | `page.getByTestId('ads-switch-hide-ads')` | `data-testid="ads-switch-hide-ads"` in `app/ads/page.tsx` | ✅ |
| Hide toggle label | `getByText('Hide my ads')` | i18n: `t('myAds.hideMyAds')` | ✅ |

---

### G1 — KYC not verified blocks ad creation

**Account setup:** Account that has not completed KYC verification.

**Test pattern:**

```typescript
await loginPage.login(); // non-KYC account
await adsPage.gotoAdsPage();
await adsPage.clickCreateAd();

// KYC onboarding popup / dialog should appear instead of the create form
// 🔍 Verify on staging — exact dialog title/content from KYC popup:
await expect(page.getByRole("dialog"), "KYC dialog should be visible").toBeVisible();
await expect(page.url(), "URL should not be /ads/create").not.toContain("/ads/create");
```

---

### G2 — Ad limit reached shows error

**Account setup:** Account that has reached the maximum number of allowed ads.

**Test pattern:**

```typescript
await loginPage.login(); // account at ad limit
await adsPage.gotoAdsPage();
await adsPage.clickCreateAd();
// Complete all 3 steps of the form then attempt to submit...
await page.getByRole("button", { name: "Create ad" }).click();

// 🔍 Verify on staging — error code AdvertLimitReached produces a dialog or toast:
await expect(
  page.getByText("Ad limit reached", { exact: false }),
  "Ad limit error should be visible"
).toBeVisible();
```

---

### G3 — Ad with visibility issues shows warning

**Account setup:** Account with an ad that has `visibility_status` restrictions set by the backend.

**Test pattern:**

```typescript
await loginPage.login(); // account with visibility-restricted ad
await adsPage.gotoAdsPage();

// Warning icon — no testid; check for the orange warning trigger on the ad card
// 🔍 Verify on staging — the exact locator for the visibility warning icon:
const warningIcon = page.getByRole("button", { name: /warning|visibility/i }).first();
await expect(warningIcon, "Visibility warning icon should be visible").toBeVisible();
await warningIcon.click();

await expect(page.getByRole("dialog"), "Visibility status dialog should open").toBeVisible();
```

---

### G4 — Cannot remove payment method with open order during edit

**Account setup:** Account with an ad that has at least one active/open order.

**Test pattern:**

```typescript
await loginPage.login();
await page.goto(`/ads/edit/${AD_ID_WITH_OPEN_ORDER}`);

// Proceed to step 1
await page.getByRole("button", { name: "Next" }).click();

// Attempt to remove selected payment method
// 🔍 Verify on staging — exact remove/deselect interaction on payment method chip:
await page.getByRole("button", { name: /remove|deselect/i }).first().click();

// Error message should appear
await expect(
  page.getByText(/can.t remove payment method|payment method.*open order/i),
  "Error message for locked payment method should be visible"
).toBeVisible();
```

---

## Section 3 — Tags Reference

| Tag | When to apply |
|---|---|
| `@ads` | All tests in the Ads module |
| `@smoke` | Flow 1 only — read-only page load, does not mutate account state |
| `@staging` | All ads tests — create/edit/delete require staging credentials and mutate state |
| `@desktop` | Desktop viewport (1280×720, `chromium` project) |
| `@mobile` | Mobile viewport (412×915, `chromium-mobile` project) |

---

## Section 4 — Feature-Specific Decisions

### Source testids are confirmed; some POM testid names differ

`data-testid` attributes have been added to the major ads elements. Most POM testids now match or have confirmed source equivalents. Exceptions:

| POM reference | Actual source testid | Notes |
|---|---|---|
| `ads-btn-create` | `ads-btn-create` ✅ | Matches |
| `ads-empty-state` | `ads-empty-state` ✅ | Matches (`my-ads-table.tsx`) |
| `my-ad-card` | `ads-row-${id}` | Different — use `[data-testid^='ads-row-']` |
| `ads-tab-buy` | NOT in source | Not added — use text fallback |
| `ads-tab-sell` | NOT in source | Not added — use text fallback |

New testids not in POM: `ads-switch-hide-ads`, `ads-btn-hide-ads-info`, `ads-alert-temp-ban`, `ads-table-container`, `ads-sentinel-load-more`, `ads-modal-create-success`, `ads-badge-status-${id}`, `ads-btn-edit-${id}`, `ads-btn-delete-${id}`.

**Impact on generated code:** Use `getByTestId('ads-btn-edit-${id}')` and `getByTestId('ads-btn-delete-${id}')` directly — no need to open an actions dropdown menu. Retrieve the ad ID from the `data-testid` attribute of the row locator.

### Ad form testids (create/edit wizard)

All steps of the create/edit wizard have confirmed testids in source:

| Testid | Description | Source location |
|---|---|---|
| `ad-form-radio-type-buy` / `ad-form-radio-type-sell` | Trade type selection (step 0) | `app/ads/components/` |
| `ad-form-radio-price-fixed` / `ad-form-radio-price-floating` | Price type (step 0) | `app/ads/components/` |
| `ad-form-select-account-currency` | Account currency select | `app/ads/components/` |
| `ad-form-select-payment-currency` | Payment currency select | `app/ads/components/` |
| `ad-form-input-rate` | Rate input | `app/ads/components/` |
| `ad-form-error-rate` | Rate error message | `app/ads/components/` |
| `ad-form-input-total-amount` | Total amount input | `app/ads/components/` |
| `ad-form-input-min-amount` / `ad-form-input-max-amount` | Min/max order inputs | `app/ads/components/` |
| `ad-form-error-amount` | Amount error message | `app/ads/components/` |
| `ad-form-checkbox-payment-${methodId}` | Payment method checkbox (step 1) | `app/ads/components/` |
| `ad-form-sheet-payment-methods` | Payment methods sheet (mobile) | `app/ads/components/` |
| `ad-form-btn-add-payment` | Add payment method button | `app/ads/components/` |
| `ad-form-radio-visibility-everyone` / `ad-form-radio-visibility-closed-group` | Visibility (step 2) | `app/ads/components/` |
| `ad-form-select-time-limit` | Time limit select (step 2) | `app/ads/components/` |
| `ad-form-list-countries` | Allowed countries list (step 2) | `app/ads/components/` |
| `ad-form-progress` | Stepper progress indicator | `app/ads/components/` |
| `ad-form-text-created-id` | Created ad ID on success screen | `app/ads/components/` |
| `ad-form-btn-share` | Share button on success screen | `app/ads/components/` |
| `ad-form-btn-done` | Done button on success screen | `app/ads/components/` |

---

### Actions menu differs between desktop and mobile

The 3-dot actions menu uses `DropdownMenu` on desktop and `Drawer` (bottom sheet) on mobile:
- **Desktop:** `DropdownMenu` — items reachable via `getByRole('menuitem', { name: '...' })`
- **Mobile:** `Drawer` — the `DrawerTitle` reads "Manage ads" (`t('myAds.manageAds')`); items are rendered as buttons inside the drawer, reachable via `getByRole('button', { name: '...' })`

**Impact on generated code:** Use the `isMobileViewport` fixture or write separate desktop/mobile assertions. On desktop use `menuitem` role; on mobile use `button` role after the drawer opens.

### Create ad form: Buy vs Sell payment method selection in Step 1

Step 1 (`PaymentDetailsForm`) differs by trade type:
- **Buy ads:** User selects from global available payment method names (e.g. "Bank Transfer", "PayNow")
- **Sell ads:** User selects from their own saved user payment methods (which have IDs, not just method names)

**Impact on generated code:** For Buy ads, match payment methods by display name. For Sell ads, the list shows user-specific entries — assert the count of selected methods rather than a specific name when the test account's payment methods are unknown.

### Edit success: toast + redirect (no success screen)

Create success renders `AdSuccessScreen` (a full-screen component). Edit success shows a toast notification (`t('adForm.adUpdatedSuccess')` = "Ad details have been updated.") then immediately calls `router.push("/ads")`. There is no full-screen success state for edit.

**Impact on generated code:** For edit flows, assert the toast text AND a `waitForURL(/\/ads$/)` after clicking "Save changes". Do not assert `AdSuccessScreen` content for edit flows.

### Cancel during create shows confirmation dialog

Clicking the Cancel/Back button during create mode triggers an alert dialog: `t('adForm.cancelAdCreation')` = "Cancel ad creation?". In edit mode, `handleClose()` redirects to `/ads` immediately without a confirmation dialog.

**Impact on generated code:** If testing cancel behaviour, use `getByRole('alertdialog')` for create mode. For edit mode, assert immediate redirect to `/ads`.

### `showVisibility` (visibility selector) is behind two gates

The ad visibility selector on step 2 is only shown when `IS_CLOSED_GROUP_ENABLED` feature flag is `true` AND the user has `isDiamond` or `isDowngradedPrivate` tier. On most staging accounts this will not appear.

**Impact on generated code:** Do not assert or interact with the visibility selector unless the test account is confirmed to be diamond tier. Skip any step 2 assertions about visibility toggle.

### `?success=create` deep link after redirect

After a successful ad creation, the app redirects from `/ads/create` back to `/ads` with query params: `?success=create&type=buy&id=123&showStatusModal=true`. These trigger a `StatusBottomSheet` (mobile) or `showAlert` dialog (desktop) showing a post-create status modal. This is a distinct flow from the `AdSuccessScreen` and fires after the user navigates away from the success screen via "Go to My ads".

**Impact on generated code:** If testing the post-create status modal (a separate gap flow), navigate directly to `/ads?success=create&type=buy&id={ID}&showStatusModal=true` rather than re-running the full create flow.

### Exchange rate input relies on WebSocket

Step 0 (`AdDetailsForm`) calls `joinExchangeRatesChannel` to fetch a live exchange rate. If floating rate mode is enabled (`float_rate_enabled`) and the WebSocket rate goes stale, the form forces fixed-rate mode. On staging, always use fixed rate to avoid WebSocket-dependent flakiness.

**Impact on generated code:** In test setup, select the fixed-rate option explicitly if a rate type selector is visible. Do not assert the live rate value — assert only that the rate field is present and accepts input.

