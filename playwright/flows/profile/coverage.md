# Profile Journey Coverage

**Analysis date:** 2026-06-26

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Profile page loads — user info, trade limits, stats tab visible | ❌ | ❌ | Smoke / production-safe |
| Flow 2 | Stats tab — Last 30 days / Lifetime metrics | ❌ | ❌ | Stats grid has no testids — role/text locators only |
| Flow 3 | Payment methods tab — list of payment methods | ❌ | ❌ | Requires staging account with at least one payment method |
| Flow 4 | Add payment method — select method, fill form, submit | ❌ | ❌ | Requires phone-verified + non-expired KYC account |
| Flow 5 | Edit payment method — open edit panel, save changes | ❌ | ❌ | Edit panel has no testids; use role-based locators |
| Flow 6 | Delete payment method — confirm dialog, delete | ❌ | ❌ | Requires payment method not linked to open order |
| Flow 7 | Follows tab — Following/Followers sub-tabs, unfollow, navigate | ❌ | ❌ | Requires account following at least one advertiser |
| Flow 8 | Blocked tab — blocked users list, unblock | ❌ | ❌ | Requires account with at least one blocked user |
| Flow 9 | Counterparties tab — trade partners, block/unblock | ❌ | ❌ | Requires account with at least one trade partner |
| Flow 10 | Deep link `?tab=payment` — direct navigation to payment tab | ❌ | N/A | Desktop only; URL param consumed and cleaned by router.replace() |
| G1 | Temp ban alert visible on profile page | ❌ | ❌ | Requires temp-banned account |
| G2 | Disabled account shows access-removed screen | ❌ | ❌ | Requires account with `user.status === "disabled"` |
| G3 | KYC gate on add payment method when unverified | ❌ | ❌ | Requires non-phone-verified or expired KYC account |
| G4 | Feedback dialog visible and opens (mobile, `!feedback_exist`) | N/A | ❌ | Mobile only; requires account where `feedback_exist === false` |
| G5 | Closed-group tab (feature flag gated) | N/A | N/A | `IS_CLOSED_GROUP_ENABLED` flag required; not automatable |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | Profile page shows the temporary ban alert banner when the user's account is temporarily banned | `profile/verify-profile-temp-ban-alert.spec.ts` |
| G2 | Profile page shows the access-removed message screen when the account has `user.status === "disabled"` | `profile/verify-profile-access-removed.spec.ts` |
| G3 | Clicking "Add payment method" for an account that is not phone-verified or has expired KYC shows the KYC alert instead of the add panel | `profile/verify-profile-kyc-gate.spec.ts` |
| G4 | On mobile, the "Send feedback" menu item is visible for accounts where `feedback_exist === false`, and tapping it opens the FeedbackDialog | `profile/verify-profile-feedback-dialog.spec.ts` |
| G5 | Closed-group tab is only shown when `IS_CLOSED_GROUP_ENABLED` flag is enabled; not automatable without flag control | N/A |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap/Flow | Reason |
|---|---|---|---|
| P0 | `profile/verify-profile-loads.spec.ts` | Flow 1 | Smoke test — verifies the profile route renders for any logged-in user; gates release |
| P1 | `profile/verify-profile-stats-tab.spec.ts` | Flow 2 | Stats are the primary content of the profile; core user-facing information |
| P1 | `profile/verify-profile-payment-methods-tab.spec.ts` | Flow 3 | Payment methods list is required for trading; critical to verify it renders correctly |
| P1 | `profile/verify-profile-add-payment-method.spec.ts` | Flow 4 | Adding a payment method is a prerequisite for receiving funds in sell orders |
| P2 | `profile/verify-profile-edit-payment-method.spec.ts` | Flow 5 | Edit flow is important for users updating banking details |
| P2 | `profile/verify-profile-delete-payment-method.spec.ts` | Flow 6 | Delete confirmation dialog is a safety gate; must work correctly |
| P2 | `profile/verify-profile-follows-tab.spec.ts` | Flow 7 | Following is a social feature tied to market filter; important for power users |
| P2 | `profile/verify-profile-blocked-tab.spec.ts` | Flow 8 | Blocking is a safety feature; unblock flow must function correctly |
| P2 | `profile/verify-profile-counterparties-tab.spec.ts` | Flow 9 | Counterparties tab enables block/unblock of trade partners; affects future trades |
| P3 | `profile/verify-profile-deep-link-tab.spec.ts` | Flow 10 | Deep link is a navigation convenience; lower risk |
| P3 | `profile/verify-profile-temp-ban-alert.spec.ts` | G1 | Edge case — requires a banned account state; low frequency |
| P3 | `profile/verify-profile-access-removed.spec.ts` | G2 | Rare account state — important to verify but edge case |
| P3 | `profile/verify-profile-kyc-gate.spec.ts` | G3 | KYC gate is important for compliance but specific to unverified accounts |
| P3 | `profile/verify-profile-feedback-dialog.spec.ts` | G4 | NPS feedback dialog is a one-time UX element; low risk |
