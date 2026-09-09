# 📋 Advertiser Journey Spec — What to Test

> **Purpose:** Describes the Advertiser profile page flows on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** Advertiser profile (`/advertiser/{id}`)
> **URL:** `https://staging-dp2p.deriv.com/advertiser/{advertiserId}`
> **Authentication:** Required — all tests start from a logged-in state
> **Staging only:** Yes — follow/block/unblock actions mutate account state

---

## Section 1 — Shared Navigation Steps

> Referenced by Flows 1–8. Assumes the user is already logged in and a known `ADVERTISER_ID` is available.

**Prerequisites:** Valid staging account (`TEST_EMAIL`, `TEST_PASSWORD`), a known advertiser ID in `TEST_ADVERTISER_ID`

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Login via Ory Kratos | Redirected to `/` (P2P Markets) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to advertiser profile | Navigate to `/advertiser/{id}` | Advertiser profile page loads; advertiser name heading is visible | `TEST_ADVERTISER_ID` |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-advertiser-profile-loads.spec.ts

**Display name:** Advertiser profile page loads with stats and ads

**Prerequisites:** `TEST_ADVERTISER_ID` account has at least one active ad

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads without errors | — |
| 2 | Verify advertiser name | Observe the profile header | Advertiser nickname/name heading is visible | — |
| 3 | Verify online status indicator | Observe the avatar area | Online/offline status dot is visible on the avatar | — |
| 4 | Verify stats section | Observe the stats row | Buy completion rate (30d) and Sell completion rate (30d) stat labels are visible | — |
| 5 | Verify "View more" button | Observe the stats section | "View more" button is visible | — |
| 6 | Verify ads section heading | Observe below the stats | "Online ads" heading is visible | — |
| 7 | Verify ads table headers (desktop) | Observe the table header row | "Rates", "Order limits", "Time limit", "Payment methods" column headers are visible | — |
| 8 | Verify ad rows | Observe the ads table | At least one ad row is visible with rate, limits, and a Buy/Sell action button | — |

---

### Flow 2 — verify-advertiser-no-ads.spec.ts

**Display name:** Advertiser profile shows empty state when advertiser has no active ads

**Prerequisites:** `TEST_ADVERTISER_ID` account has no active ads

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads | — |
| 2 | Verify empty state | Observe the ads section | "No ads yet" text is visible | — |
| 3 | Verify empty description | Observe the empty state | "This advertiser do not have any active ads." text is visible | — |

---

### Flow 3 — verify-advertiser-follow.spec.ts

**Display name:** Follow an advertiser from their profile

**Prerequisites:** Logged-in user is NOT currently following the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads | — |
| 2 | Locate Follow button | Observe the profile header | "Follow" button is visible (not "Following") | — |
| 3 | Click Follow | Click the "Follow" button | Toast notification "Successfully followed" is shown; button changes to "Following" | — |

---

### Flow 4 — verify-advertiser-unfollow.spec.ts

**Display name:** Unfollow an advertiser via the Following dropdown

**Prerequisites:** Logged-in user IS currently following the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads | — |
| 2 | Locate Following button | Observe the profile header | "Following" button (with chevron) is visible | — |
| 3 | Open Following dropdown | Click the "Following" button | Dropdown (desktop) or bottom Drawer (mobile) opens; "Unfollow" option is visible | — |
| 4 | Click Unfollow | Click "Unfollow" | Toast notification "Successfully unfollowed" is shown; button reverts to "Follow" | — |

---

### Flow 5 — verify-advertiser-block.spec.ts

**Display name:** Block an advertiser and see the blocked state

**Prerequisites:** Logged-in user is NOT currently blocking the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads | — |
| 2 | Locate Block button | Observe the profile header | "Block" button is visible | — |
| 3 | Click Block | Click the "Block" button | Alert dialog opens with title "Block {nickname}?" and confirm button "Block" | — |
| 4 | Confirm block | Click the "Block" confirm button in the dialog | Dialog closes; toast "{nickname} blocked." is shown; page transitions to blocked state: "You've blocked this user" heading is visible; ads section is hidden | — |

---

### Flow 6 — verify-advertiser-unblock.spec.ts

**Display name:** Unblock a previously blocked advertiser

**Prerequisites:** Logged-in user IS currently blocking the advertiser

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads | — |
| 2 | Verify blocked state | Observe the profile | "You've blocked this user" heading is visible; ads section is not shown | — |
| 3 | Locate Unblock button | Observe the profile header | "Unblock" button is visible | — |
| 4 | Click Unblock | Click the "Unblock" button | Toast "{nickname} unblocked." is shown; page transitions back to normal profile view; ads section is visible | — |

---

### Flow 7 — verify-advertiser-order-sidebar.spec.ts

**Display name:** Open order sidebar from an ad on the advertiser profile

**Prerequisites:** `TEST_ADVERTISER_ID` has at least one active ad; logged-in user is not the same as the advertiser and is not blocked; user is not temp-banned

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login and navigate | Follow Shared Navigation Steps | Profile page loads; ad rows are visible | — |
| 2 | Click the Buy/Sell button on an ad | Click "Sell {currency}" or "Buy {currency}" button on an ad row | Order sidebar opens (or risk warning modal shown if risk criteria met) | — |
| 3 | Verify sidebar opened | Observe the sidebar | Order sidebar is visible with the selected ad's details | — |

---

### Flow 8 — verify-advertiser-deep-link-adid.spec.ts

**Display name:** Deep link with `?adId=` param auto-opens the order sidebar

**Prerequisites:** `TEST_ADVERTISER_ID` has a known ad with ID `TEST_AD_ID`; logged-in user is not blocked

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Login via Ory Kratos | Redirected to `/` | — |
| 2 | Navigate with deep link | Navigate to `/advertiser/{id}?adId={adId}` | Advertiser profile loads | `TEST_ADVERTISER_ID`, `TEST_AD_ID` |
| 3 | Verify sidebar auto-opens | Observe the page after ads load | Order sidebar opens automatically for the specified ad without any user interaction | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Own profile hides Follow and Block buttons

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | View own advertiser profile | Login; navigate to `/advertiser/{own_advertiser_id}` (where `own_advertiser_id` matches the logged-in user's advertiser ID) | "Follow" and "Block" buttons are NOT visible — the action button area is hidden when `userId == profile.id` |

### G2 — Deep link with non-existent adId shows alert

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Deep link to removed ad | Navigate to `/advertiser/{id}?adId=9999999` (an ID that does not exist in the advertiser's ad list) | Alert dialog shown with title "Ad not available" and description "This ad is no longer available. Choose another ad."; confirm button "Got it" closes the dialog |

### G3 — View advertiser stats detail modal

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Open stats modal from profile (desktop) | Navigate to advertiser profile; click "View more" in the stats section | Dialog opens with title "Advertiser info"; stats rows include "Buy completion rate (30d)", "Sell completion rate (30d)", "Total trades (30d)", "Total all time trades"; "Close" button closes the dialog |
| 2 | Open stats drawer from profile (mobile) | Same as above on mobile viewport | Bottom Drawer opens with title "Advertiser info" and the same stats rows; "Close" button closes the drawer |

