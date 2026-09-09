# 📋 Ads Journey Spec — What to Test

> **Purpose:** Describes the My Ads flows on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** My Ads list (`/ads`), Create Ad wizard (`/ads/create`), Edit Ad wizard (`/ads/edit/{id}`)
> **URL:** `https://staging-dp2p.deriv.com/ads`
> **Authentication:** Required — all tests start from a logged-in state
> **Staging only:** Yes — flows that create/edit/delete ads mutate account state

---

## Section 1 — Shared Navigation Steps

> Referenced by Flows 1–9. The shared sequence assumes the user is already logged in.

**Prerequisites:** Valid staging account (`TEST_EMAIL`, `TEST_PASSWORD`), P2P enabled

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Login via Ory Kratos | Redirected to `/` (P2P Markets) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to My Ads | Navigate to `/ads` | Page heading "All ads" is visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-ads-list-loads.spec.ts

**Display name:** My Ads page loads and displays existing ads

**Prerequisites:** Account has at least one existing ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Verify page elements | Observe the page | "Create ad" button is visible; "Hide my ads" toggle is visible | — |
| 3 | Verify ad list | Observe the ad list | At least one ad card is visible; each card shows Active or Inactive status badge | — |
| 4 | Verify Buy/Sell tabs | Observe tab controls | "Buy" and "Sell" filter tabs are visible | — |

---

### Flow 2 — verify-ads-empty-state.spec.ts

**Display name:** My Ads page shows empty state when no ads exist

**Prerequisites:** Account has no existing ads (freshly created account or all ads deleted)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Verify empty state | Observe the page | "You have no ads" text is visible | — |
| 3 | Verify create CTA | Observe the empty state | "Create ad" button is visible | — |

---

### Flow 3 — verify-create-buy-ad.spec.ts

**Display name:** Create a Buy ad (3-step wizard, fixed rate)

**Prerequisites:** KYC verified, P2P enabled, has a compatible payment method

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Open create form | Click "Create ad" | Navigate to `/ads/create`; wizard heading "Create ad" is visible; step title "Set ad and rate type" is visible | — |
| 3 | Step 0: set trade type | Buy type is pre-selected (or select Buy) | "Buy" trade type is selected | — |
| 4 | Step 0: fill amounts | Enter total buy amount, minimum order, maximum order | Fields accept numeric input | e.g. `1000`, `10`, `500` |
| 5 | Step 0: proceed | Click "Next" | Step 1 is shown; step title "Set payment details" is visible | — |
| 6 | Step 1: select payment method | Select at least one payment method from the list | Selected method appears in the selected list (up to 3 allowed) | — |
| 7 | Step 1: proceed | Click "Next" | Step 2 is shown; step title "Set ad conditions" is visible | — |
| 8 | Step 2: review | Observe step 2 | Order time limit selector is visible; "Create ad" button is visible | — |
| 9 | Step 2: submit | Click "Create ad" | Full-screen success screen is shown; heading "Ad created" is visible | — |
| 10 | Verify success screen | Observe success screen | "Share ad" button and "Go to My ads" button are visible | — |

---

### Flow 4 — verify-create-sell-ad.spec.ts

**Display name:** Create a Sell ad (3-step wizard, fixed rate)

**Prerequisites:** KYC verified, P2P enabled, funded P2P balance, has a user payment method

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Open create form | Click "Create ad" | Navigate to `/ads/create`; wizard heading "Create ad" is visible | — |
| 3 | Select Sell type | Select "Sell" trade type (or navigate to `/ads/create?operation=sell`) | "Sell" trade type is selected | — |
| 4 | Step 0: fill amounts | Enter total sell amount, minimum order, maximum order | Fields accept numeric input; "Total sell amount" placeholder visible | e.g. `500`, `10`, `200` |
| 5 | Step 0: proceed | Click "Next" | Step 1 is shown; "Set payment details" title is visible | — |
| 6 | Step 1: select payment method | Select at least one user payment method | Selected method visible; up to 3 allowed | — |
| 7 | Step 1: proceed | Click "Next" | Step 2 is shown; "Set ad conditions" title is visible | — |
| 8 | Step 2: submit | Click "Create ad" | Full-screen success screen is shown; heading "Ad created" is visible | — |

---

### Flow 5 — verify-edit-ad.spec.ts

**Display name:** Edit an existing ad and save changes

**Prerequisites:** Account has at least one existing ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Open actions menu | Click the 3-dot/actions button on an ad card | Actions menu or drawer opens | — |
| 3 | Select Edit | Click "Edit" | Navigate to `/ads/edit/{id}`; wizard heading "Edit ad" is visible; existing ad data is prefilled | — |
| 4 | Modify a value | Change one value (e.g. minimum order amount) | Field accepts the new value | any valid change |
| 5 | Proceed through steps | Click "Next" on steps 0 and 1 | Progresses to step 2 | — |
| 6 | Save changes | Click "Save changes" on step 2 | Toast notification "Ad details have been updated." is visible; redirected to `/ads` | — |

---

### Flow 6 — verify-deactivate-ad.spec.ts

**Display name:** Deactivate an active ad from the actions menu

**Prerequisites:** Account has at least one active ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Find an active ad | Observe the ads list | An ad with "Active" status badge is visible | — |
| 3 | Open actions menu | Click the 3-dot/actions button on the active ad | Actions menu or drawer opens; "Deactivate" option is visible | — |
| 4 | Click Deactivate | Click "Deactivate" | Toast notification "Ad has been deactivated." is visible; ad status badge changes to "Inactive" | — |

---

### Flow 7 — verify-activate-ad.spec.ts

**Display name:** Activate an inactive ad from the actions menu

**Prerequisites:** Account has at least one inactive ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Find an inactive ad | Observe the ads list | An ad with "Inactive" status badge is visible | — |
| 3 | Open actions menu | Click the 3-dot/actions button on the inactive ad | Actions menu or drawer opens; "Activate" option is visible | — |
| 4 | Click Activate | Click "Activate" | Toast notification "Ad has been activated." is visible; ad status badge changes to "Active" | — |

---

### Flow 8 — verify-delete-ad.spec.ts

**Display name:** Delete an ad and confirm deletion

**Prerequisites:** Account has at least one existing ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Open actions menu | Click the 3-dot/actions button on an ad | Actions menu or drawer opens | — |
| 3 | Click Delete | Click "Delete" | Confirmation dialog appears; dialog title "Delete ad?" is visible; confirmation description "You will not be able to restore it." is visible | — |
| 4 | Confirm deletion | Click the confirm/delete button in the dialog | Dialog closes; toast notification "Ad has been deleted." is visible; ad is removed from the list | — |

---

### Flow 9 — verify-hide-my-ads.spec.ts

**Display name:** Toggle "Hide my ads" switch to hide/show all ads

**Prerequisites:** Account has at least one existing ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | "All ads" heading is visible | — |
| 2 | Locate the toggle | Observe the page header area | "Hide my ads" switch/toggle is visible | — |
| 3 | Enable hide | Toggle the switch to hidden state | Switch reflects the hidden state (visual change); ads are hidden from the market | — |
| 4 | Disable hide | Toggle the switch back | Switch reflects the visible state; ads are visible again | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — KYC not verified blocks ad creation

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Non-KYC user clicks Create ad | Login as a user without KYC; navigate to `/ads`; click "Create ad" | A KYC verification popup or onboarding dialog is shown instead of the create form |

### G2 — Ad limit reached shows error

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Submit form when ad limit reached | Login as user at ad limit; complete all 3 steps of the create wizard; click "Create ad" | Error dialog or inline error with "Ad limit reached" message is shown; form is not submitted successfully |

### G3 — Ad with visibility issues shows warning

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Ad has visibility status issues | Login as a user whose ad has `visibility_status` restrictions; navigate to `/ads` | Warning icon is visible on the affected ad card |
| 2 | Open visibility dialog | Click the warning icon on the ad card | Visibility status dialog opens with details about why the ad is restricted |

### G4 — Cannot remove payment method with open order during edit

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Remove payment method on active-order ad | Login as user with an ad that has an open order; navigate to `/ads/edit/{id}`; proceed to step 1; attempt to remove the selected payment method | Error message shown indicating the payment method cannot be removed while an order is open |

