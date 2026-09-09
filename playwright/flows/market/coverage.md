# Market Journey Coverage

**Analysis date:** 2026-06-25

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Market page loads with Buy/Sell tabs and ad list | ❌ | ❌ | Smoke test — read-only page load; safe for production |
| Flow 2 | Switch between Buy and Sell tabs | ❌ | ❌ | Read-only; safe for production |
| Flow 3 | Change currency via CurrencyFilter | ❌ | ❌ | Read-only filter interaction; Popover (desktop) vs Drawer (mobile) |
| Flow 4 | Filter ads by payment method | ❌ | ❌ | Read-only filter interaction; Popover (desktop) vs Drawer (mobile) |
| Flow 5 | Apply sort and "Ads from following" filter | ❌ | ❌ | Requires at least one followed advertiser with active ads |
| Flow 6 | Open order sidebar from market ad row | ❌ | ❌ | Read-only (sidebar open only, no order placed) |
| Flow 7 | Place a buy order from market | ❌ | ❌ | Mutating — creates a real order on staging; dedicated test account required |
| Flow 8 | Navigate to advertiser profile from market | ❌ | ❌ | Cross-module navigation |
| Flow 9 | Search advertiser by nickname | ❌ | ❌ | Mobile only — Sheet component; requires known TEST_ADVERTISER_NICKNAME |
| G1 | Maintenance mode disables interactions | ❌ | ❌ | Requires backend cooperation to simulate maintenance state |
| G2 | No balance warning when P2P wallet is empty | ❌ | ❌ | Requires zero-balance test account |
| G3 | KYC gate blocks order placement | ❌ | ❌ | Requires KYC-unverified test account |
| G4 | Deep link auto-selects tab and currency | ❌ | ❌ | URL param driven — use `page.goto()` directly |
| G5 | Risk warning modal intercepts high-risk advertiser | ❌ | ❌ | Requires staging advertiser meeting risk thresholds in risk-warning-rules.ts |

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | When the system maintenance flag is active, the market page shows an empty state and all Buy/Sell buttons are disabled | `market/verify-market-maintenance.spec.ts` |
| G2 | When the logged-in user has zero P2P wallet balance, a warning banner appears with a "Transfer funds" deep link to `/wallet?operation=TRANSFER` | `market/verify-market-no-balance-warning.spec.ts` |
| G3 | Clicking a Buy/Sell button on the market page when the user has not completed KYC shows a KYC onboarding alert dialog instead of opening the order sidebar | `market/verify-market-kyc-gate.spec.ts` |
| G4 | Navigating to `/?operation=sell`, `/?operation=buy`, `/?currency=XXX` or combined deep links pre-selects the correct tab and/or currency on page load | `market/verify-market-deep-link.spec.ts` |
| G5 | Clicking Buy/Sell on an ad from a high-risk advertiser (low completion rate or high block count) shows a risk warning modal before allowing the order sidebar to open | `market/verify-market-risk-warning.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap / Flow | Reason |
|---|---|---|---|
| P0 | `market/verify-market-page-loads.spec.ts` | Flow 1 | Core smoke test — Markets is the home page and primary entry point; must load and display ads before any interaction flow can run |
| P0 | `market/verify-market-tab-switch.spec.ts` | Flow 2 | Tab switching is the most common market interaction; regression here blocks buyers and sellers alike |
| P1 | `market/verify-market-order-sidebar.spec.ts` | Flow 6 | Order sidebar is the primary conversion action; must open correctly before order placement can be tested |
| P1 | `market/verify-market-deep-link.spec.ts` | G4 | Deep links are used from external referrals and wallet/notification entry points; easy to implement (URL params only, no account state needed) |
| P1 | `market/verify-market-currency-filter.spec.ts` | Flow 3 | Currency filter is used by most traders before viewing ads; Popover/Drawer split adds viewport-specific risk |
| P2 | `market/verify-market-place-buy-order.spec.ts` | Flow 7 | End-to-end order placement is the most critical business action but requires a dedicated test account and mutations |
| P2 | `market/verify-market-payment-method-filter.spec.ts` | Flow 4 | Payment method filter is heavily used; Popover/Drawer split adds regression risk |
| P2 | `market/verify-market-advertiser-profile-link.spec.ts` | Flow 8 | Cross-module navigation is a key user journey; lower risk than in-page interactions |
| P2 | `market/verify-market-no-balance-warning.spec.ts` | G2 | Balance warning affects sell-side traders; requires a dedicated zero-balance account but important UX gate |
| P2 | `market/verify-market-filter-sort.spec.ts` | Flow 5 | Following filter and sort are advanced features; important but lower priority than core ad interaction |
| P3 | `market/verify-market-advertiser-search.spec.ts` | Flow 9 | Mobile-only feature; important UX but narrower audience than desktop flows |
| P3 | `market/verify-market-kyc-gate.spec.ts` | G3 | Requires a dedicated non-KYC account; high setup cost, low regression risk |
| P3 | `market/verify-market-risk-warning.spec.ts` | G5 | Requires a specially configured staging advertiser account; non-trivial setup |
| P3 | `market/verify-market-maintenance.spec.ts` | G1 | Requires backend cooperation to trigger; lowest automation feasibility |
