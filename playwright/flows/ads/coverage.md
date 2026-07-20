# Ads Journey Coverage

**Analysis date:** 2026-07-03

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | My Ads page loads and displays existing ads | ✅ | ✅ | Smoke test — read-only page load |
| Flow 2 | My Ads page shows empty state when no ads exist | ❌ | ❌ | Requires account with no ads |
| Flow 3 | Create a Buy ad (3-step wizard, fixed rate) | ✅ | ✅ | Mutates account state |
| Flow 4 | Create a Sell ad (3-step wizard, fixed rate) | ❌ | ❌ | Requires funded P2P balance |
| Flow 5 | Edit an existing ad and save changes | ❌ | ❌ | Mutates account state |
| Flow 6 | Deactivate an active ad | ❌ | ❌ | Mutates account state |
| Flow 7 | Activate an inactive ad | ❌ | ❌ | Mutates account state |
| Flow 8 | Delete an ad and confirm deletion | ❌ | ❌ | Destructive — use a dedicated delete-only test account |
| Flow 9 | Toggle "Hide my ads" switch | ❌ | ❌ | Mutates account state |
| G1 | KYC not verified blocks ad creation | ❌ | ❌ | Requires non-KYC test account |
| G2 | Ad limit reached shows error | ❌ | ❌ | Requires account at ad limit |
| G3 | Ad with visibility issues shows warning icon | ❌ | ❌ | Requires backend-set visibility_status |
| G4 | Cannot remove payment method with open order during edit | ❌ | ❌ | Requires ad with open order |

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | Ad creation is blocked when the user has not completed KYC verification | `ads/verify-create-ad-kyc-blocked.spec.ts` |
| G2 | Submitting the create-ad form when the account has reached its ad limit shows an error | `ads/verify-create-ad-limit-reached.spec.ts` |
| G3 | An ad with backend-set `visibility_status` restrictions shows a warning icon that opens a visibility dialog | `ads/verify-ad-visibility-warning.spec.ts` |
| G4 | Attempting to remove a payment method from an ad that has an open order shows an inline error | `ads/verify-edit-ad-payment-method-locked.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap / Flow | Reason |
|---|---|---|---|
| P0 | `ads/verify-ads-list-loads.spec.ts` | Flow 1 | Core smoke test — My Ads is a primary navigation destination; must load correctly before any ad action flows can run |
| P0 | `ads/verify-create-buy-ad.spec.ts` | Flow 3 | Create ad is the primary ads action; end-to-end smoke test of the 3-step wizard |
| P1 | `ads/verify-create-sell-ad.spec.ts` | Flow 4 | Sell ad creation uses different payment method selection (user methods vs available methods) — distinct flow from Flow 3 |
| P1 | `ads/verify-edit-ad.spec.ts` | Flow 5 | Edit is the second most common ad action; distinct terminal state (toast + redirect vs success screen) |
| P1 | `ads/verify-delete-ad.spec.ts` | Flow 8 | Delete has a confirmation dialog with destructive outcome — regression risk if dialog or mutation breaks |
| P2 | `ads/verify-deactivate-ad.spec.ts` | Flow 6 | Status toggle is a common action but lower risk than create/delete |
| P2 | `ads/verify-activate-ad.spec.ts` | Flow 7 | Symmetric with Flow 6 — can share setup if ad state is prepared deterministically |
| P2 | `ads/verify-hide-my-ads.spec.ts` | Flow 9 | Hide toggle affects all ads at once; important but lower risk than per-ad actions |
| P2 | `ads/verify-ads-empty-state.spec.ts` | Flow 2 | Empty state UX — important to verify but lower priority than mutation flows |
| P3 | `ads/verify-create-ad-kyc-blocked.spec.ts` | G1 | Requires a dedicated non-KYC test account — high setup cost, low regression risk |
| P3 | `ads/verify-create-ad-limit-reached.spec.ts` | G2 | Requires an account at its ad limit — high setup cost |
| P3 | `ads/verify-ad-visibility-warning.spec.ts` | G3 | Requires backend-set visibility_status — not triggerable from the UI alone |
| P3 | `ads/verify-edit-ad-payment-method-locked.spec.ts` | G4 | Requires an ad with an active open order — complex state to set up |

