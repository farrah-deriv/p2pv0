# Profile Journey Catalog

**Analysis date:** 2026-06-26

---

## Section 1 — Journey Index

| # | Journey | Spec file | Tags | Priority |
|---|---------|-----------|------|----------|
| Flow 1 | Profile page loads — user info, trade limits, stats tab | `profile/verify-profile-loads.spec.ts` | `@desktop @mobile @profile @smoke @production` | P0 |
| Flow 2 | Stats tab — Last 30 days / Lifetime metrics | `profile/verify-profile-stats-tab.spec.ts` | `@desktop @mobile @profile @staging` | P1 |
| Flow 3 | Payment methods tab — list of payment methods | `profile/verify-profile-payment-methods-tab.spec.ts` | `@desktop @mobile @profile @staging` | P1 |
| Flow 4 | Add payment method — select method, fill form, submit | `profile/verify-profile-add-payment-method.spec.ts` | `@desktop @mobile @profile @staging` | P1 |
| Flow 5 | Edit payment method — open edit panel, save changes | `profile/verify-profile-edit-payment-method.spec.ts` | `@desktop @mobile @profile @staging` | P2 |
| Flow 6 | Delete payment method — confirm dialog, delete | `profile/verify-profile-delete-payment-method.spec.ts` | `@desktop @mobile @profile @staging` | P2 |
| Flow 7 | Follows tab — Following/Followers sub-tabs, unfollow, navigate to advertiser | `profile/verify-profile-follows-tab.spec.ts` | `@desktop @mobile @profile @staging` | P2 |
| Flow 8 | Blocked tab — blocked users list, unblock | `profile/verify-profile-blocked-tab.spec.ts` | `@desktop @mobile @profile @staging` | P2 |
| Flow 9 | Counterparties tab — trade partners, block/unblock | `profile/verify-profile-counterparties-tab.spec.ts` | `@desktop @mobile @profile @staging` | P2 |
| Flow 10 | Deep link `?tab=payment` — direct navigation to payment tab | `profile/verify-profile-deep-link-tab.spec.ts` | `@desktop @profile @staging` | P3 |
| G1 | Temp ban alert visible on profile page | `profile/verify-profile-temp-ban-alert.spec.ts` | `@desktop @mobile @profile @staging` | P3 |
| G2 | Disabled account shows access-removed screen | `profile/verify-profile-access-removed.spec.ts` | `@desktop @mobile @profile @staging` | P3 |
| G3 | KYC gate on add payment method when unverified | `profile/verify-profile-kyc-gate.spec.ts` | `@desktop @mobile @profile @staging` | P3 |
| G4 | Feedback dialog visible and opens (mobile, `!feedback_exist`) | `profile/verify-profile-feedback-dialog.spec.ts` | `@mobile @profile @staging` | P3 |
| G5 | Closed-group tab (feature flag gated) | N/A | N/A | N/A |

---

## Section 2 — Flow Details

### Flow 1 — verify-profile-loads.spec.ts

```typescript
// profilePage.goto()
await profilePage.page.goto('/profile');

// Verify user info header
await expect(profilePage.page.getByTestId('profile-avatar')).toBeVisible();
await expect(profilePage.page.getByTestId('profile-text-username')).toBeVisible();
await expect(profilePage.page.getByTestId('profile-text-rating')).toBeVisible();
await expect(profilePage.page.getByTestId('profile-text-recommendation')).toBeVisible();

// Verify stats tab visible — desktop
await expect(profilePage.page.getByTestId('profile-tab-stats')).toBeVisible();

// Verify stats menu visible — mobile
await expect(profilePage.page.getByTestId('profile-menu-stats')).toBeVisible();
```

---

### Flow 2 — verify-profile-stats-tab.spec.ts

```typescript
// Desktop: click Stats tab
await profilePage.page.getByTestId('profile-tab-stats').click();
await expect(profilePage.page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
await expect(profilePage.page.getByRole('button', { name: 'Lifetime' })).toBeVisible();

// Verify metrics visible
await expect(profilePage.page.getByText('Sell completion')).toBeVisible();
await expect(profilePage.page.getByText('Buy completion')).toBeVisible();
await expect(profilePage.page.getByText('Total orders')).toBeVisible();
await expect(profilePage.page.getByText('Avg. pay time')).toBeVisible();
await expect(profilePage.page.getByText('Avg. release time')).toBeVisible();
await expect(profilePage.page.getByText('Trade volume')).toBeVisible();

// Switch to Lifetime
await profilePage.page.getByRole('button', { name: 'Lifetime' }).click();
await expect(profilePage.page.getByText('Trade partners')).toBeVisible();

// Mobile: open via menu
await profilePage.page.getByTestId('profile-menu-stats').click();
await expect(profilePage.page.getByTestId('profile-btn-sidebar-back')).toBeVisible();
await profilePage.page.getByTestId('profile-btn-sidebar-back').click();
```

---

### Flow 3 — verify-profile-payment-methods-tab.spec.ts

```typescript
// Desktop: click Payment methods tab
await profilePage.page.getByTestId('profile-tab-payment-methods').click();

// Verify at least one payment method card
await expect(profilePage.page.locator('[data-testid^="profile-card-payment-"]').first()).toBeVisible();

// Verify add button
await expect(profilePage.page.getByTestId('profile-btn-add-payment')).toBeVisible();

// Mobile: open via menu
await profilePage.page.getByTestId('profile-menu-payment-methods').click();
await expect(profilePage.page.getByTestId('profile-btn-sidebar-back')).toBeVisible();
await profilePage.page.getByTestId('profile-btn-sidebar-back').click();
```

---

### Flow 4 — verify-profile-add-payment-method.spec.ts

```typescript
// Open payment methods panel
await profilePage.page.getByTestId('profile-tab-payment-methods').click();

// Click Add payment method
await profilePage.page.getByTestId('profile-btn-add-payment').click();
await expect(profilePage.page.getByRole('heading', { name: 'Select a payment method' })).toBeVisible();

// Select a payment method from the list
await profilePage.page.getByRole('button', { name: /bank/i }).first().click();
await expect(profilePage.page.getByRole('heading', { name: 'Add payment details' })).toBeVisible();

// Fill required fields (example — exact fields depend on the method)
await profilePage.page.getByRole('textbox').first().fill(DataFactory.paymentMethodName());

// Submit
await profilePage.page.getByRole('button', { name: 'Add' }).click();
await expect(profilePage.page.getByText('Payment method added.')).toBeVisible();
```

---

### Flow 5 — verify-profile-edit-payment-method.spec.ts

```typescript
// Open payment methods panel
await profilePage.page.getByTestId('profile-tab-payment-methods').click();

// Open edit dropdown for first payment method
await profilePage.page.locator('[data-testid^="profile-btn-edit-payment-"]').first().click();
await expect(profilePage.page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();

// Click Edit
await profilePage.page.getByRole('menuitem', { name: 'Edit' }).click();

// Modify a field and save
await profilePage.page.getByRole('textbox').first().clear();
await profilePage.page.getByRole('textbox').first().fill(DataFactory.paymentMethodName());
await profilePage.page.getByRole('button', { name: 'Save changes' }).click();
await expect(profilePage.page.getByText('Payment method updated.')).toBeVisible();
```

---

### Flow 6 — verify-profile-delete-payment-method.spec.ts

```typescript
// Open payment methods panel
await profilePage.page.getByTestId('profile-tab-payment-methods').click();

// Open edit dropdown
await profilePage.page.locator('[data-testid^="profile-btn-edit-payment-"]').first().click();

// Click Delete — confirm dialog appears
await profilePage.page.getByRole('menuitem', { name: 'Delete' }).click();
await expect(profilePage.page.getByRole('heading', { name: 'Delete payment method?' })).toBeVisible();
await expect(profilePage.page.getByText('Are you sure you want to delete this payment method?')).toBeVisible();

// Cancel — method still present
await profilePage.page.getByTestId('profile-btn-cancel-delete-payment').click();
await expect(profilePage.page.locator('[data-testid^="profile-card-payment-"]').first()).toBeVisible();

// Open again and confirm delete
await profilePage.page.locator('[data-testid^="profile-btn-edit-payment-"]').first().click();
await profilePage.page.getByRole('menuitem', { name: 'Delete' }).click();
await profilePage.page.getByTestId('profile-btn-confirm-delete-payment').click();
await expect(profilePage.page.getByText('Payment method deleted.')).toBeVisible();
```

---

### Flow 7 — verify-profile-follows-tab.spec.ts

```typescript
// Desktop: click Follows tab
await profilePage.page.getByTestId('profile-tab-follows').click();

// Verify sub-tabs
await expect(profilePage.page.getByRole('button', { name: /Follows \(/ })).toBeVisible();
await expect(profilePage.page.getByRole('button', { name: /Followers \(/ })).toBeVisible();

// Switch to Followers
await profilePage.page.getByRole('button', { name: /Followers \(/ }).click();

// Navigate to advertiser
await profilePage.page.getByRole('button', { name: /Follows \(/ }).click();
await profilePage.page.getByRole('link').first().click();
// URL should contain /advertiser/{id}?return_to=profile&tab=follows

// Unfollow flow
await profilePage.page.getByRole('button', { name: 'Unfollow' }).first().click();
await expect(profilePage.page.getByRole('dialog')).toBeVisible();
await profilePage.page.getByRole('button', { name: 'Unfollow' }).last().click();

// Mobile: open via menu
await profilePage.page.getByTestId('profile-menu-follows').click();
await expect(profilePage.page.getByTestId('profile-btn-sidebar-back')).toBeVisible();
await profilePage.page.getByTestId('profile-btn-sidebar-back').click();
```

---

### Flow 8 — verify-profile-blocked-tab.spec.ts

```typescript
// Desktop: click Blocked tab
await profilePage.page.getByTestId('profile-tab-blocked').click();

// Verify blocked user entry
await expect(profilePage.page.getByRole('button', { name: 'Unblock' }).first()).toBeVisible();

// Search
await profilePage.page.getByRole('searchbox').fill('test');

// Unblock
await profilePage.page.getByRole('button', { name: 'Unblock' }).first().click();
await expect(profilePage.page.getByRole('dialog')).toBeVisible();
await profilePage.page.getByRole('button', { name: 'Unblock' }).last().click();

// Mobile: open via menu
await profilePage.page.getByTestId('profile-menu-blocked').click();
await expect(profilePage.page.getByTestId('profile-btn-sidebar-back')).toBeVisible();
await profilePage.page.getByTestId('profile-btn-sidebar-back').click();
```

---

### Flow 9 — verify-profile-counterparties-tab.spec.ts

```typescript
// Desktop: click Counterparties tab
await profilePage.page.getByTestId('profile-tab-counterparties').click();

// Verify trade partner list
await expect(profilePage.page.getByRole('button', { name: 'Block' }).first()).toBeVisible();

// Block a trade partner
await profilePage.page.getByRole('button', { name: 'Block' }).first().click();
await expect(profilePage.page.getByRole('dialog')).toBeVisible();
await profilePage.page.getByRole('button', { name: 'Block' }).last().click();
// Entry now shows Unblock button
await expect(profilePage.page.getByRole('button', { name: 'Unblock' }).first()).toBeVisible();

// Mobile: open via menu
await profilePage.page.getByTestId('profile-menu-counterparties').click();
await expect(profilePage.page.getByTestId('profile-btn-sidebar-back')).toBeVisible();
await profilePage.page.getByTestId('profile-btn-sidebar-back').click();
```

---

### Flow 10 — verify-profile-deep-link-tab.spec.ts

```typescript
// Navigate via deep link
await profilePage.page.goto('/profile?tab=payment');

// Payment methods panel should be active
await expect(profilePage.page.getByTestId('profile-btn-add-payment')).toBeVisible();
// Stats tab should NOT be the active content
await expect(profilePage.page.getByText('Sell completion')).not.toBeVisible();
```

---

### G1 — verify-profile-temp-ban-alert.spec.ts

```typescript
// Login with temp-banned account
await profilePage.page.goto('/profile');
await expect(profilePage.page.getByTestId('profile-alert-temp-ban')).toBeVisible();
```

---

### G2 — verify-profile-access-removed.spec.ts

```typescript
// Login with disabled account
await profilePage.page.goto('/profile');
await expect(profilePage.page.getByTestId('profile-msg-access-removed')).toBeVisible();
```

---

### G3 — verify-profile-kyc-gate.spec.ts

```typescript
// Login with non-phone-verified or expired KYC account
await profilePage.page.goto('/profile');
await profilePage.page.getByTestId('profile-tab-payment-methods').click();
await profilePage.page.getByTestId('profile-btn-add-payment').click();
await expect(profilePage.page.getByTestId('profile-alert-kyc')).toBeVisible();
```

---

### G4 — verify-profile-feedback-dialog.spec.ts

```typescript
// Mobile viewport; account where feedback_exist === false
await profilePage.page.goto('/profile');
await expect(profilePage.page.getByTestId('profile-menu-feedback')).toBeVisible();
await profilePage.page.getByTestId('profile-menu-feedback').click();
// FeedbackDialog opens
await expect(profilePage.page.getByRole('dialog')).toBeVisible();
await expect(profilePage.page.getByRole('heading', { name: 'Send feedback' })).toBeVisible();
```

---

## Section 3 — Testid Inventory

### Static testids (always present)

| Testid | Element | Notes |
|--------|---------|-------|
| `profile-avatar` | User avatar image | Always visible |
| `profile-text-username` | Nickname text | Always visible |
| `profile-badge-verified` | Verified badge | Only when phone + KYC verified |
| `profile-badge-trade-band` | Trade band badge | Only when `tradeBand` set |
| `profile-text-recommendation` | Recommendation text | May show "No recommendations yet" |
| `profile-text-rating` | Rating display | May show "No ratings yet" |
| `profile-msg-access-removed` | Access removed screen | Only when `user.status === "disabled"` |
| `profile-alert-kyc` | KYC gate alert | Only when phone/KYC conditions not met |
| `profile-alert-temp-ban` | Temp ban banner | Only when `tempBanUntil` is set |
| `profile-btn-add-payment` | Add payment method button | Desktop + mobile |
| `profile-btn-sidebar-back` | Back button in mobile sidebars | Shared across all mobile sidebars |
| `profile-btn-retry-payment` | Retry on payment methods error | Only on error state |
| `profile-btn-confirm-delete-payment` | Confirm delete dialog button | Inside delete confirm dialog |
| `profile-btn-cancel-delete-payment` | Cancel delete dialog button | Inside delete confirm dialog |

### Desktop tab testids

| Testid | Tab label |
|--------|-----------|
| `profile-tab-stats` | Stats |
| `profile-tab-payment-methods` | Payment methods |
| `profile-tab-follows` | Follows |
| `profile-tab-blocked` | Blocked |
| `profile-tab-counterparties` | Counterparties |
| `profile-tab-closed-group` | Closed group (feature-flagged) |

### Mobile menu testids

| Testid | Menu item label |
|--------|----------------|
| `profile-menu-stats` | Stats |
| `profile-menu-payment-methods` | Payment methods |
| `profile-menu-follows` | Follows |
| `profile-menu-blocked` | Blocked |
| `profile-menu-counterparties` | Counterparties |
| `profile-menu-closed-group` | Closed group (feature-flagged) |
| `profile-menu-help` | P2P help centre |
| `profile-menu-feedback` | Send feedback (only when `!feedback_exist`) |

### Dynamic testids

| Pattern | Selector to use | Notes |
|---------|----------------|-------|
| `profile-card-payment-{id}` | `[data-testid^="profile-card-payment-"]` | One per payment method |
| `profile-btn-edit-payment-{id}` | `[data-testid^="profile-btn-edit-payment-"]` | Dropdown trigger for edit/delete |
| `profile-btn-delete-payment-{id}` | `[data-testid^="profile-btn-delete-payment-"]` | Inside the dropdown |

---

## Section 4 — Feature-Specific Decisions

### 4.1 — Stale testids in existing POM

`playwright/pages/ProfilePage.ts` uses **incorrect testids** that do not match the source:

| POM testid (stale) | Actual testid (source) |
|---|---|
| `profile-display-name` | `profile-text-username` |
| `profile-btn-edit-nickname` | *(no such testid in source)* |
| `profile-payment-methods` | `profile-tab-payment-methods` (desktop) / `profile-menu-payment-methods` (mobile) |
| `profile-btn-add-payment-method` | `profile-btn-add-payment` |
| `profile-stat-completion-rate` | *(no testid — use `getByText('Sell completion')`)* |
| `profile-stat-total-orders` | *(no testid — use `getByText('Total orders')`)* |

**The POM must be updated before any flows are implemented.** Do not use the existing POM locator methods until they are corrected.

### 4.2 — Desktop vs Mobile: StatsTabs renders different UI

`StatsTabs` in `app/profile/components/stats-tabs.tsx` renders two completely different UI structures:

- **Desktop (`!isMobile`)**: Tab bar with `profile-tab-*` testids + inline panel content
- **Mobile (`isMobile`)**: Vertical menu list with `profile-menu-*` testids; each item opens a sidebar with `profile-btn-sidebar-back` to return

All flows that test tab content must have separate desktop and mobile branches. Use `isMobileViewport` fixture to fork the test path. **Steps marked `3m` in `flow.md` are the mobile-only path**.

### 4.3 — Add payment method: KYC gate

`handleShowAddPaymentMethod` (in `stats-tabs.tsx`) checks:
```
phone_verified && !isPoiExpired && !isPoaExpired
```
If any condition fails, it triggers the KYC alert (`profile-alert-kyc`) instead of opening the Add payment panel. Tests for Flow 4 require a fully KYC-verified account. G3 requires the opposite.

### 4.4 — Dynamic testids on payment method cards

Payment method cards use `{id}` suffix: `profile-card-payment-{id}`, `profile-btn-edit-payment-{id}`, `profile-btn-delete-payment-{id}`. Use prefix selectors:
```typescript
page.locator('[data-testid^="profile-card-payment-"]')
page.locator('[data-testid^="profile-btn-edit-payment-"]')
```

### 4.5 — Add/Edit payment method panels have no testids

`AddPaymentMethodPanel` and `EditPaymentMethodPanel` components contain no `data-testid` attributes. Locators must use:
- `getByRole('heading', { name: 'Select a payment method' })` — step 1 heading
- `getByRole('heading', { name: 'Add payment details' })` — step 2 heading
- `getByRole('textbox')` — form fields (order depends on selected method)
- `getByRole('button', { name: 'Add' })` / `getByRole('button', { name: 'Save changes' })` — submit

Flag all add/edit panel locators with `🔍 Verify on staging`.

### 4.6 — Follows/Blocked/Counterparties tabs have no testids

`follows-tab.tsx`, `blocked-tab.tsx`, and `counterparties-tab.tsx` contain no `data-testid` attributes. All locators use role-based selectors (buttons, searchboxes, dialogs). Mark with `🔍 Verify on staging` during implementation.

### 4.7 — Stats grid has no testids

`stats-grid.tsx` `StatCard` components carry no testids. Use `getByText()` with the resolved English label strings (e.g. `getByText('Sell completion')`) for assertions in Flow 2.

### 4.8 — IS_CLOSED_GROUP_ENABLED feature flag

`profile-tab-closed-group` and `profile-menu-closed-group` are only rendered when the `IS_CLOSED_GROUP_ENABLED` env flag is truthy. G5 is marked N/A — do not write a spec for it unless the flag can be enabled in the test environment.

### 4.9 — Serial mode requirement

Flows 4, 5, and 6 mutate payment method state (add → edit → delete). In the same test suite file, use:
```typescript
test.describe.configure({ mode: 'serial' });
```
This ensures add runs before edit, which runs before delete, preventing inter-test state conflicts.

### 4.10 — Deep link `?tab=` param

`app/profile/page.tsx` reads `?tab=` from URL search params to set the initial active tab. After consuming the param, the component calls `router.replace()` to clean the URL. Deep link flows (Flow 10) navigate directly to `/profile?tab=payment` and verify the correct panel renders.
