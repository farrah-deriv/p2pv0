# Wallet Journey Coverage

**Analysis date:** 2026-06-26

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Wallet page loads — total balance, transfer button, USD balance card | ❌ | ❌ | Smoke / production-safe; requires non-v1 account |
| Flow 2 | Click balance card → transaction list with rows | ❌ | ❌ | Requires account with at least one past transaction |
| Flow 3 | Click transaction row → transaction detail panel | ❌ | ❌ | Requires account with at least one past transaction |
| Flow 4 | Transfer happy path — enter amount, confirm, success screen | ❌ | ❌ | Requires funded P2P account (balance > 0) + two wallet types |
| Flow 5 | Transfer percentage shortcuts — 25/50/75/100% fill | ❌ | ❌ | Requires funded account |
| Flow 6 | Transfer failure — error screen with retry CTA | ❌ | ❌ | Requires an amount or condition that triggers API rejection |
| Flow 7 | Deep link `?operation=TRANSFER` — transfer opens automatically | ❌ | ❌ | Deep link bypasses hasBalance guard; URL cleaned by router.replace |
| Flow 8 | Buy button in currency view navigates to market | ❌ | ❌ | Requires clicking a balance card first to enter currency view |
| G1 | Temp ban alert visible on wallet page | ❌ | ❌ | Requires temporarily banned account |
| G2 | Disabled account shows access-removed screen | ❌ | ❌ | Requires account with `user.status === "disabled"` |
| G3 | Transfer KYC gate for unverified account | ❌ | ❌ | Requires non-phone-verified or expired KYC account |
| G4 | No assets empty state | ❌ | ❌ | Requires new account with no P2P wallet balance |
| G5 | Empty transactions state for currency with no history | ❌ | ❌ | Requires balance card but no transactions |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | Wallet page shows the temporary ban alert banner when the user's account is temporarily banned | `wallet/verify-wallet-temp-ban-alert.spec.ts` |
| G2 | Wallet page shows the access-removed screen when the account has `user.status === "disabled"` | `wallet/verify-wallet-access-removed.spec.ts` |
| G3 | Clicking Transfer when the account is not phone-verified or has expired KYC triggers the KYC onboarding alert instead of the transfer flow | `wallet/verify-wallet-transfer-kyc-gate.spec.ts` |
| G4 | Wallet page shows the "No assets yet" empty state for a new account with no P2P wallet balance | `wallet/verify-wallet-no-assets.spec.ts` |
| G5 | Transaction list shows "No transactions found" empty state when the selected currency has no transaction history | `wallet/verify-wallet-empty-transactions.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap/Flow | Reason |
|---|---|---|---|
| P0 | `wallet/verify-wallet-loads.spec.ts` | Flow 1 | Smoke test — verifies the wallet route renders for any logged-in user; gates release |
| P0 | `wallet/verify-wallet-transfer.spec.ts` | Flow 4 | Transfer is the primary wallet action; core P2P funding flow; must work before any sell order |
| P1 | `wallet/verify-wallet-transaction-list.spec.ts` | Flow 2 | Transaction list is the main post-trade view; important for user confidence |
| P1 | `wallet/verify-wallet-transaction-detail.spec.ts` | Flow 3 | Transaction detail is required for receipts and dispute tracking |
| P1 | `wallet/verify-wallet-deep-link-transfer.spec.ts` | Flow 7 | Deep link is triggered by the zero-balance banner on the market page; critical for new user onboarding |
| P2 | `wallet/verify-wallet-transfer-percentage.spec.ts` | Flow 5 | Percentage shortcuts are a key UX convenience for frequent traders |
| P2 | `wallet/verify-wallet-transfer-failure.spec.ts` | Flow 6 | Error handling is critical for user trust; must not silently fail |
| P2 | `wallet/verify-wallet-deposit-sidebar.spec.ts` | Flow 8 | Buy navigation from wallet is a key flow for funding P2P balance |
| P3 | `wallet/verify-wallet-temp-ban-alert.spec.ts` | G1 | Edge case — requires a banned account state; low frequency |
| P3 | `wallet/verify-wallet-access-removed.spec.ts` | G2 | Rare disabled account state; important for compliance but edge case |
| P3 | `wallet/verify-wallet-transfer-kyc-gate.spec.ts` | G3 | KYC gate applies to unverified accounts; specific test account required |
| P3 | `wallet/verify-wallet-no-assets.spec.ts` | G4 | Empty state for new accounts; low risk |
| P3 | `wallet/verify-wallet-empty-transactions.spec.ts` | G5 | Empty transactions state; low frequency edge case |
