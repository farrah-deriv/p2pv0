# Buy-Sell Journey Coverage

**Analysis date:** 2026-06-30

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Buy-side order sidebar — content verification and close | ✅ | ✅ | Read-only — opens sidebar and verifies elements, no order placed; safe for staging |
| Flow 2 | Sell-side order sidebar — content and payment method required guard | ✅ | ✅ | Read-only; requires at least one buy-type ad and a user payment method on staging |
| Flow 3 | Payment method selection panel — open, select, and confirm | ❌ | ❌ | Read-only interaction (no order placed); requires compatible payment method on test account |
| Flow 4 | Amount validation — order limit errors | ❌ | ❌ | Read-only; uses out-of-range amounts to trigger inline validation |
| G1 | Place sell-side order end-to-end | ❌ | ❌ | Mutating — creates a real order; dedicated test account required |
| G2 | Insufficient P2P balance prevents sell order | ❌ | ❌ | Requires a staging account with a known limited P2P balance |
| G3 | Rate change confirmation modal | ❌ | ❌ | Requires staging timing: a float-rate ad's rate must change while the sidebar is open |
| G4 | Ad updated confirmation modal | ❌ | ❌ | Requires staging cooperation: advertiser must update the ad while user's sidebar is open |
| G5 | Add payment method from order sidebar | ❌ | ❌ | Requires a test account with no payment methods compatible with a staging advertiser |
| G6 | Own-ad Buy/Sell button suppression | ❌ | ❌ | Requires a test account that has its own active ads visible on the market page |

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | Full sell-side order placement: switch to Sell tab → open sidebar → select payment method → enter amount → click "Place order" → navigates to `/orders/{id}` | `buy-sell/verify-buy-sell-place-sell-order.spec.ts` |
| G2 | When the user enters an amount exceeding their P2P wallet balance in a sell-side sidebar, an "Insufficient balance" error appears and "Place order" stays disabled | `buy-sell/verify-buy-sell-balance-validation.spec.ts` |
| G3 | When a float-rate ad's exchange rate changes while the order sidebar is open, a "Rate updated" modal intercepts submission with "Confirm and continue" and "Go back" options | `buy-sell/verify-buy-sell-rate-change.spec.ts` |
| G4 | When the advertiser updates an ad's details while the user has the order sidebar open, an "Ad updated" modal appears with a "Review changes" button that reloads the sidebar with new ad details | `buy-sell/verify-buy-sell-ad-updated.spec.ts` |
| G5 | When the user opens the payment method selection panel but has no payment methods compatible with the advertiser's accepted methods, an "Add payment method" link is shown; clicking it navigates to the payment method management screen | `buy-sell/verify-buy-sell-add-payment-method.spec.ts` |
| G6 | A logged-in user who has their own active ads on the market page does not see a "Buy {currency}" or "Sell {currency}" action button on their own ad rows | `buy-sell/verify-buy-sell-own-ad-no-button.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap / Flow | Reason |
|---|---|---|---|
| P0 | `buy-sell/verify-buy-sell-sidebar-buy-side.spec.ts` | Flow 1 | Core smoke test for the order sidebar — the sidebar must open and render correctly before any order-placement flow can be tested; buy-side is the most common user action |
| P0 | `buy-sell/verify-buy-sell-sidebar-sell-side.spec.ts` | Flow 2 | Sell-side sidebar has a distinct guard (payment method required) not present on buy-side; smoke test for sell-side order placement entry |
| P1 | `buy-sell/verify-buy-sell-amount-validation.spec.ts` | Flow 4 | Order limit validation is a hard block on order placement; easy to automate with out-of-range input values and no account setup required beyond basic login |
| P1 | `buy-sell/verify-buy-sell-payment-selection.spec.ts` | Flow 3 | Payment method selection is a mandatory step for sell-side orders; modal panel interaction has viewport-split risk (Dialog on desktop, Drawer on mobile) |
| P2 | `buy-sell/verify-buy-sell-place-sell-order.spec.ts` | G1 | End-to-end sell order is the primary sell-side business action; requires a dedicated staging account but is a critical regression test |
| P2 | `buy-sell/verify-buy-sell-balance-validation.spec.ts` | G2 | Insufficient balance is the most common user error on sell-side orders; requires a limited-balance account but high business impact |
| P2 | `buy-sell/verify-buy-sell-own-ad-no-button.spec.ts` | G6 | Prevents a UX regression where users try to trade with themselves; automatable given a test account with own ads, no timing requirements |
| P3 | `buy-sell/verify-buy-sell-rate-change.spec.ts` | G3 | Rate change confirmation is important for float-rate ads but requires non-deterministic staging timing; low automation feasibility |
| P3 | `buy-sell/verify-buy-sell-ad-updated.spec.ts` | G4 | Ad updated confirmation has the same timing difficulty as G3; hard to trigger deterministically without backend tooling |
| P3 | `buy-sell/verify-buy-sell-add-payment-method.spec.ts` | G5 | Requires a specially prepared test account with no compatible payment methods; edge case with high setup cost |
