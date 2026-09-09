# Orders Journey Coverage

**Analysis date:** 2026-06-26

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Orders list page loads — tabs visible, empty state shown | ❌ | ❌ | Smoke / production-safe |
| Flow 2 | Orders list with active orders — rows, badges, time remaining, navigation | ❌ | ❌ | Requires staging account with active order |
| Flow 3 | Past orders date filter — filter control visible and interactive | ❌ | N/A | Desktop only — filter layout differs on mobile |
| Flow 4 | Rate a past order — rate button opens rating sidebar | ❌ | ❌ | Requires reviewable past order |
| Flow 5 | Order detail page loads — status badge, payment accordion, chat panel | ❌ | ❌ | Requires known ORDER_ID |
| Flow 6 | Buyer actions — I've paid + upload proof + cancel order flow | ❌ | ❌ | Requires buyer-side pending_payment order |
| Flow 7 | Seller actions — I've received payment + OTP + rate transaction | ❌ | ❌ | Requires seller-side pending_release order |
| G1 | Complaint form — timed-out order complaint submission | ❌ | ❌ | Requires timed_out order |
| G2 | Temp ban alert visible on orders page | ❌ | ❌ | Requires temp-banned account |
| G3 | Check previous orders section (v1 signup accounts only) | ❌ | ❌ | Requires v1 legacy account |
| G4 | OTP error and resend flow on payment received | ❌ | ❌ | Requires pending_release seller order + wrong OTP |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | Seller/buyer can open the complaint form on a timed-out order, select a reason, confirm, and submit | `orders/verify-order-complaint.spec.ts` |
| G2 | Orders page shows the temporary ban alert banner when the user's account is temporarily banned | `orders/verify-orders-temp-ban-alert.spec.ts` |
| G3 | Orders page shows the "Check previous orders" button for v1 signup accounts and the previous orders section loads with an iframe | `orders/verify-orders-previous-orders.spec.ts` |
| G4 | Entering an incorrect OTP in the payment received sidebar shows an error message, and the resend code button appears after the timer expires | `orders/verify-order-otp-error.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap/Flow | Reason |
|---|---|---|---|
| P0 | `orders/verify-orders-list-loads.spec.ts` | Flow 1 | Smoke test — verifies the orders route renders for any logged-in user; gates release |
| P0 | `orders/verify-order-detail-loads.spec.ts` | Flow 5 | Order detail is the core post-trade screen; must load correctly before any other order action |
| P1 | `orders/verify-orders-list-with-orders.spec.ts` | Flow 2 | Core orders list with real data — verifies row rendering, status badges, and navigation |
| P1 | `orders/verify-order-detail-buyer-actions.spec.ts` | Flow 6 | Primary buyer action — paying an order is the most common critical path |
| P1 | `orders/verify-order-detail-seller-actions.spec.ts` | Flow 7 | Primary seller action — releasing funds closes the trade cycle |
| P2 | `orders/verify-orders-rate-past-order.spec.ts` | Flow 4 | Rating flow is part of post-trade quality; important but not order-blocking |
| P2 | `orders/verify-order-complaint.spec.ts` | G1 | Complaint is a dispute resolution path; important for user trust |
| P2 | `orders/verify-order-otp-error.spec.ts` | G4 | OTP error handling affects seller confidence; should not silently fail |
| P3 | `orders/verify-orders-past-date-filter.spec.ts` | Flow 3 | Date filter is a utility for history browsing — low risk |
| P3 | `orders/verify-orders-previous-orders.spec.ts` | G3 | Only for v1 legacy accounts; limited audience |
| P3 | `orders/verify-orders-temp-ban-alert.spec.ts` | G2 | Edge case — requires a banned account state; low frequency |
