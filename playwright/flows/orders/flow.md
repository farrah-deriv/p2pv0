# 📋 Orders Journey Spec — What to Test

> **Purpose:** Describes the Orders module on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** Orders list (`/orders`) and Order detail (`/orders/[id]`)
> **URL:** `https://staging-dp2p.deriv.com/orders`
> **Authentication:** Required — all tests start from a logged-in state

---

## Section 1 — Shared Step Pattern

### Orders Page Navigation Steps

> Referenced by Flows 1–4. Entry point for all orders list flows.

**Prerequisites:** Logged-in account with P2P enabled (pre-existing `TEST_EMAIL` / `TEST_PASSWORD`)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` (Markets page) | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to Orders | Click Orders in the navigation | URL becomes `/orders`; "Active" tab is visible; "Past" tab is visible | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-orders-list-loads.spec.ts

**Prerequisites:** Account with at least one active order OR empty state is acceptable.

> Follows [Orders Page Navigation Steps](#orders-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Verify Active tab | Observe default tab state | "Active" tab is selected; orders list or empty state is shown | — |
| 4 | Verify empty state (if no orders) | Observe empty state | `orders-empty-state` element visible; text "No active orders yet" shown | — |
| 5 | Switch to Past tab | Click "Past" tab | "Past" tab becomes active; past orders list or "No past orders" empty state renders | — |
| 6 | Verify Past empty state (if no past orders) | Observe empty state | Text "No past orders" shown | — |

---

### Flow 2 — verify-orders-list-with-orders.spec.ts

**Prerequisites:** Account with at least one active order.

> Follows [Orders Page Navigation Steps](#orders-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Verify order rows | Observe the orders list | At least one order row with testid `orders-row-{id}` is visible | — |
| 4 | Verify status badge | Observe status badge on a row | Status badge with testid `orders-badge-status-{id}` is visible | — |
| 5 | Verify time remaining | Observe an active (pending_payment or pending_release) order | Time remaining countdown with testid `orders-text-time-remaining-{id}` is shown | — |
| 6 | Click chat icon | Click the chat icon on an order row | On desktop: navigates to `/orders/{id}`; on mobile: chat panel opens | — |
| 7 | Navigate to order detail | Click the order row | URL becomes `/orders/{id}`; order detail page loads | — |

---

### Flow 3 — verify-orders-past-date-filter.spec.ts

**Prerequisites:** Account with at least one past order.

> Follows [Orders Page Navigation Steps](#orders-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Switch to Past tab | Click "Past" tab | Past orders list renders with at least one row | — |
| 4 | Verify date filter visible | Observe the date filter control | `orders-select-date-filter` container is visible | — |
| 5 | Apply date filter | Select a date range from the date filter | Order list refreshes; filtered results shown (may be empty if no orders in range) | — |

---

### Flow 4 — verify-orders-rate-past-order.spec.ts

**Prerequisites:** Account with a past order that is reviewable (`is_reviewable > 0`, not disputed).

> Follows [Orders Page Navigation Steps](#orders-page-navigation-steps)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 3 | Switch to Past tab | Click "Past" tab | Past orders list renders | — |
| 4 | Click Rate button | Click "Rate" button (`orders-btn-rate-{id}`) on a reviewable order | Rating sidebar opens | — |
| 5 | Verify rating sidebar | Observe the rating sidebar | "Would you recommend this seller/buyer?" prompt is visible | — |

---

### Flow 5 — verify-order-detail-loads.spec.ts

**Prerequisites:** Account with at least one active order. Must know the order ID.

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to order detail | Navigate to `/orders/{id}` via orders list click | URL becomes `/orders/{id}`; status badge `order-details-badge-status` is visible | `ORDER_ID` from env |
| 3 | Verify order info section | Observe the order info card | Amount, counterparty label, and "View order details" button are visible | — |
| 4 | Verify payment details | Observe payment method section | Accordion `order-details-accordion-payment` is visible with payment method name | — |
| 5 | Verify time remaining | Observe countdown (if order is pending) | `order-details-text-time-remaining` shows MM:SS format | — |
| 6 | Verify chat panel (desktop) | Observe right column | Chat container is visible on desktop layout | — |
| 7 | Click "View order details" | Click `order-details-btn-view-details` | Modal/sidebar with order details opens; "Order details" title visible | — |

---

### Flow 6 — verify-order-detail-buyer-actions.spec.ts

**Prerequisites:** Account is the **buyer** on a `pending_payment` order.

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to order detail | Navigate to `/orders/{id}` | Status badge shows "Pending payment" (buyer-side label) | `ORDER_ID` |
| 3 | Verify buyer action buttons | Observe action area | "Cancel order" (`order-details-btn-cancel`) and "I've paid" (`order-details-btn-paid`) buttons visible | — |
| 4 | Click "I've paid" | Click `order-details-btn-paid` | Payment confirmation sidebar `order-details-sheet-confirm-payment` opens | — |
| 5 | Upload proof of payment | Select a valid image/PDF file in the sidebar | File name appears; "Submit" button becomes enabled | Test file (JPEG < 5 MB) |
| 6 | Submit payment proof | Click `order-details-btn-confirm-payment` | Sidebar closes; order status updates; toast "Proof of transfer submitted" appears | — |
| 7 | Click "Cancel order" | Navigate back; click `order-details-btn-cancel` | Cancellation dialog appears with title "Cancelling your order?" | — |
| 8 | Confirm cancel | Click `order-details-btn-confirm-cancel` in the dialog | Order is cancelled; status badge updates to "Cancelled" | — |
| 9 | Keep order (negative) | Click `order-details-btn-keep-order` in the dialog | Dialog closes; order remains at "Pending payment" | — |

---

### Flow 7 — verify-order-detail-seller-actions.spec.ts

**Prerequisites:** Account is the **seller** on a `pending_release` order (buyer has paid).

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Login | Log in via `loginPage.login()` | Redirected to `/` | `TEST_EMAIL`, `TEST_PASSWORD` |
| 2 | Navigate to order detail | Navigate to `/orders/{id}` | Status badge shows "Pending release" label; `order-details-btn-received` visible | `ORDER_ID` |
| 3 | Click "I've received payment" | Click `order-details-btn-received` | If `orderVerificationEnabled=true`: OTP sidebar `order-details-sheet-confirm-received` opens; if false: order completes directly | — |
| 4 | Enter OTP (if verification enabled) | Enter 6-digit OTP into `order-details-input-otp` | OTP auto-submits on 6th digit; order status updates to "Completed" | OTP from email |
| 5 | Verify completed state | Observe order after completion | Status badge shows "Completed"; "Rate transaction" button visible if reviewable | — |
| 6 | Click "Rate transaction" | Click `order-details-btn-rate` | Rating sidebar opens; "Would you recommend this seller/buyer?" shown | — |

---

## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G1 — Order detail: submit complaint on timed-out order

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Buyer opens complaint form | Navigate to a `timed_out` order; click "Complain" (`order-details-btn-complaint`) | Complaint form container `complaint-form-container` opens |
| 2 | Select a reason | Click a reason tile (`complaint-btn-reason-{id}`) | Selected tile is highlighted |
| 3 | Check confirm checkbox | Check `complaint-checkbox-confirm` | Checkbox becomes checked; "Submit" button becomes enabled |
| 4 | Submit complaint | Click `complaint-btn-submit` | Complaint form closes; order state may update |

### G2 — Orders list: temp ban alert visible

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify temp ban banner | Log in with a temporarily banned account; navigate to `/orders` | `orders-alert-temp-ban` element is visible on the page |

### G3 — Orders list: check previous orders (v1 signup)

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Verify button visibility | Log in with a v1 signup account; navigate to `/orders` | "Check previous orders" button (`orders-btn-check-previous`) is visible |
| 2 | Open previous orders | Click `orders-btn-check-previous` | `orders-section-previous` panel renders; "Previous orders" heading visible; iframe is present |
| 3 | Navigate back | Click the back arrow in the previous orders panel | Returns to the main orders list; `orders-tab-active` is visible |

### G4 — Order detail: OTP verification error on payment received

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Open OTP sidebar | Navigate to a `pending_release` order (seller side); click `order-details-btn-received` | `order-details-sheet-confirm-received` opens |
| 2 | Enter invalid OTP | Enter wrong 6-digit code in `order-details-input-otp` | Error message appears at `order-details-error-otp` (e.g. "Incorrect code, X attempts left") |
| 3 | Resend code | Wait for timer; click "Resend code" | New OTP is sent; timer resets to ~59 seconds |
