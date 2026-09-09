# 📋 Profile Journey Spec — What to Test

> **Purpose:** Describes the Profile module on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** User profile (`/profile`)
> **URL:** `https://staging-dp2p.deriv.com/profile`
> **Authentication:** Required — all tests start from a logged-in state

---

## Section 1 — Shared Step Pattern

### Profile Page Navigation Steps

> Referenced by Flows 1–9. Entry point for all profile flows.

**Prerequisites:** Logged-in account with P2P enabled (pre-existing `TEST_EMAIL` / `TEST_PASSWORD`)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` (Markets page) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to Profile | Click Profile in the navigation | URL becomes `/profile`; user info header is visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-profile-loads.spec.ts

**Prerequisites:** Any logged-in account with P2P enabled.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Verify user info header | Observe the top section | `profile-avatar` is visible; `profile-text-username` shows the account nickname | — |
| 4 | Verify rating | Observe rating area | `profile-text-rating` is visible (or "No ratings yet" if unrated) | — |
| 5 | Verify recommendation | Observe recommendation area | `profile-text-recommendation` is visible (or "No recommendations yet" if none) | — |
| 6 | Verify trade limits | Observe the trade limits section | Daily buy/sell limit progress bars are visible | — |
| 7 | Verify Stats tab visible (desktop) | Observe tab bar | `profile-tab-stats` tab is visible and selected by default | — |
| 8 | Verify Stats menu visible (mobile) | Observe menu list | `profile-menu-stats` item is visible in the profile menu | — |

---

### Flow 2 — verify-profile-stats-tab.spec.ts

**Prerequisites:** Account with at least some trade history (completion rate, order counts).

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Stats (desktop) | Click `profile-tab-stats` | Stats panel renders with "Last 30 days" / "Lifetime" sub-tabs | — |
| 3m | Open Stats (mobile) | Tap `profile-menu-stats` | Stats sidebar opens; `profile-btn-sidebar-back` visible | — |
| 4 | Verify Last 30 days | Observe default sub-tab | Metrics visible: "Sell completion", "Buy completion", "Total orders", "Avg. pay time", "Avg. release time", "Trade volume" | — |
| 5 | Switch to Lifetime | Click "Lifetime" sub-tab | "Trade partners" metric appears; "Trade volume" and other lifetime metrics shown | — |
| 6 | Navigate back (mobile) | Tap `profile-btn-sidebar-back` | Returns to profile menu; `profile-menu-stats` visible | — |

---

### Flow 3 — verify-profile-payment-methods-tab.spec.ts

**Prerequisites:** Account with KYC verified and at least one payment method added.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Payment methods (desktop) | Click `profile-tab-payment-methods` | Payment methods panel renders | — |
| 3m | Open Payment methods (mobile) | Tap `profile-menu-payment-methods` | Payment methods sidebar opens; `profile-btn-sidebar-back` visible | — |
| 4 | Verify payment method list | Observe content | At least one payment method card (`profile-card-payment-{id}`) is visible under "Bank transfer" or "E-Wallets" section | — |
| 5 | Verify add button present | Observe top of panel | `profile-btn-add-payment` button is visible | — |
| 6 | Navigate back (mobile) | Tap `profile-btn-sidebar-back` | Returns to profile menu | — |

---

### Flow 4 — verify-profile-add-payment-method.spec.ts

**Prerequisites:** Account with phone verified and non-expired KYC. Account has fewer than the maximum allowed payment methods.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Payment methods | Click `profile-tab-payment-methods` (desktop) or `profile-menu-payment-methods` (mobile) | Payment methods panel renders | — |
| 4 | Click Add payment method | Click `profile-btn-add-payment` | "Add payment method" panel opens; "Select a payment method" heading visible with a searchable list | — |
| 5 | Select a payment method | Click a method in the list (e.g. a bank) | Step 2 opens: "Add payment details" heading visible; form fields appear | — |
| 6 | Fill in the form | Enter valid details in each required field | Form fields populated | Test payment details |
| 7 | Submit the form | Click the submit button | Toast "Payment method added." appears; panel closes; new card appears in the list | — |

---

### Flow 5 — verify-profile-edit-payment-method.spec.ts

**Prerequisites:** Account with at least one existing payment method.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Payment methods | Click `profile-tab-payment-methods` (desktop) or `profile-menu-payment-methods` (mobile) | Payment method cards visible | — |
| 4 | Open edit dropdown | Click `profile-btn-edit-payment-{id}` on a payment method card | Dropdown menu appears with "Edit" and "Delete" options | `id` of an existing payment method |
| 5 | Click Edit | Click "Edit" in the dropdown | Edit payment method panel opens inline; form pre-filled with existing values | — |
| 6 | Modify a field | Change a text field value | Field shows updated value | — |
| 7 | Save changes | Click the save button | Toast "Payment method updated." appears; panel closes; card reflects updated value | — |

---

### Flow 6 — verify-profile-delete-payment-method.spec.ts

**Prerequisites:** Account with at least one existing payment method (not linked to an open order).

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Payment methods | Click `profile-tab-payment-methods` (desktop) or `profile-menu-payment-methods` (mobile) | Payment method cards visible | — |
| 4 | Open edit dropdown | Click `profile-btn-edit-payment-{id}` on a payment method card | Dropdown with "Edit" and "Delete" visible | `id` of an existing payment method |
| 5 | Click Delete | Click "Delete" in the dropdown | Confirmation dialog appears: "Delete payment method?" with description "Are you sure you want to delete this payment method?" | — |
| 6 | Cancel deletion | Click `profile-btn-cancel-delete-payment` | Dialog closes; payment method card still visible | — |
| 7 | Open dropdown again; click Delete | Repeat steps 4–5 | Confirmation dialog appears again | — |
| 8 | Confirm deletion | Click `profile-btn-confirm-delete-payment` | Dialog closes; toast "Payment method deleted." appears; card is removed from the list | — |

---

### Flow 7 — verify-profile-follows-tab.spec.ts

**Prerequisites:** Account following at least one advertiser; also has at least one follower.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Follows (desktop) | Click `profile-tab-follows` | Follows panel renders; "Follows" and "Followers" sub-tabs visible with counts | — |
| 3m | Open Follows (mobile) | Tap `profile-menu-follows` | Follows sidebar opens; `profile-btn-sidebar-back` visible | — |
| 4 | View Following list | Observe default view | List of followed advertisers shown | — |
| 5 | Switch to Followers | Click "Followers" sub-tab | Followers list renders (or empty state "No followers yet") | — |
| 6 | Unfollow an advertiser | Click "Unfollow" on a followed advertiser | Confirmation dialog appears: "Unfollow?" | — |
| 7 | Confirm unfollow | Confirm in dialog | Advertiser removed from list | — |
| 8 | Navigate to advertiser | Click an advertiser in the list | Navigates to `/advertiser/{id}?return_to=profile&tab=follows` | — |

---

### Flow 8 — verify-profile-blocked-tab.spec.ts

**Prerequisites:** Account with at least one blocked advertiser.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Blocked (desktop) | Click `profile-tab-blocked` | Blocked users panel renders | — |
| 3m | Open Blocked (mobile) | Tap `profile-menu-blocked` | Blocked sidebar opens; `profile-btn-sidebar-back` visible | — |
| 4 | Verify blocked list | Observe content | At least one blocked advertiser entry visible; "Unblock" button present | — |
| 5 | Search for a user | Type in the search field | List filters to matching advertisers | — |
| 6 | Unblock a user | Click "Unblock" on an entry | Confirmation dialog appears | — |
| 7 | Confirm unblock | Confirm in dialog | Entry removed from list | — |

---

### Flow 9 — verify-profile-counterparties-tab.spec.ts

**Prerequisites:** Account with at least one trade partner.

> Follows [Profile Page Navigation Steps](#profile-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Open Counterparties (desktop) | Click `profile-tab-counterparties` | Counterparties panel renders with trade partner list | — |
| 3m | Open Counterparties (mobile) | Tap `profile-menu-counterparties` | Counterparties sidebar opens; `profile-btn-sidebar-back` visible | — |
| 4 | Verify partner list | Observe content | At least one trade partner entry visible | — |
| 5 | Search for a partner | Type in the search field | List filters to matching results | — |
| 6 | Block a trade partner | Click "Block" on an entry | Confirmation dialog appears | — |
| 7 | Confirm block | Confirm in dialog | Entry state changes to "Unblock" button | — |

---

### Flow 10 — verify-profile-deep-link-tab.spec.ts

**Prerequisites:** Any logged-in account.

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate via deep link | Navigate directly to `/profile?tab=payment` | Profile page loads; Payment methods tab is selected and visible | — |
| 3 | Verify correct tab active | Observe tab state | Payment methods panel content is shown; not the default Stats panel | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Profile page: temp ban alert

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify temp ban banner | Log in with a temporarily banned account; navigate to `/profile` | `profile-alert-temp-ban` element is visible at the top of the page |

---

### G2 — Profile page: access removed / disabled account

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify access removed screen | Log in with a disabled account (`user.status === "disabled"`); navigate to `/profile` | `profile-msg-access-removed` element replaces the normal profile content |

---

### G3 — Add payment method: KYC gate

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Trigger KYC gate | Log in with an account that is NOT phone-verified or has expired KYC; navigate to `/profile` | Payment methods tab/menu item is accessible | — |
| 2 | Click Add payment method | Click `profile-btn-add-payment` | KYC alert (`profile-alert-kyc`) appears instead of the Add payment method panel | — |

---

### G4 — Profile feedback dialog (mobile)

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify feedback menu item | Log in with a mobile viewport; navigate to `/profile` with an account where `feedback_exist === false` | `profile-menu-feedback` item is visible in the profile menu | — |
| 2 | Open feedback dialog | Tap `profile-menu-feedback` | "Send feedback" dialog (`FeedbackDialog`) opens | — |

---

### G5 — Closed group tab (feature flag gated)

> **N/A — not automatable without flag control.** The `IS_CLOSED_GROUP_ENABLED` environment flag must be enabled for `profile-tab-closed-group` / `profile-menu-closed-group` to appear. This tab is excluded from standard automation until the flag is controllable in test environments.
