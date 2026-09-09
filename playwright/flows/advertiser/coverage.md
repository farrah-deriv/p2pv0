# Advertiser Journey Coverage

**Analysis date:** 2026-06-25

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Advertiser profile page loads with stats and ads | ❌ | ❌ | Smoke test — read-only profile load |
| Flow 2 | Advertiser profile shows empty state when no active ads | ❌ | ❌ | Requires advertiser with no active ads |
| Flow 3 | Follow an advertiser | ❌ | ❌ | Mutates account state |
| Flow 4 | Unfollow an advertiser via the Following dropdown | ❌ | ❌ | Mutates account state; dropdown vs Drawer differs by viewport |
| Flow 5 | Block an advertiser | ❌ | ❌ | Mutates account state; dialog confirmation required |
| Flow 6 | Unblock a previously blocked advertiser | ❌ | ❌ | Mutates account state |
| Flow 7 | Open order sidebar from an advertiser's ad | ❌ | ❌ | Cross-references OrderSidebar component from Markets module |
| Flow 8 | Deep link with `?adId=` param auto-opens order sidebar | ❌ | ❌ | Requires known TEST_AD_ID on TEST_ADVERTISER_ID account |
| G1 | Own profile hides Follow and Block buttons | ❌ | ❌ | Requires same account as advertiser ID |
| G2 | Deep link with non-existent adId shows alert | ❌ | ❌ | Uses fake adId=9999999 |
| G3 | View advertiser stats detail modal | ❌ | ❌ | Desktop: Dialog; Mobile: Drawer — separate viewport assertions needed |

---

## Section 2 — Gaps

| Gap | Description | Proposed spec file |
|---|---|---|
| G1 | When the logged-in user views their own advertiser profile, the Follow and Block buttons are hidden | `advertiser/verify-advertiser-own-profile.spec.ts` |
| G2 | Navigating to a profile with an `?adId=` param pointing to a non-existent ad shows an "Ad not available" alert | `advertiser/verify-advertiser-deep-link-missing-ad.spec.ts` |
| G3 | Clicking "View more" in the stats section opens a modal/drawer with detailed advertiser statistics | `advertiser/verify-advertiser-stats-modal.spec.ts` |

> Step-by-step test cases for each gap: [`flow.md — Gap Flows`](./flow.md#gap-flows)

---

## Section 3 — Priority List

| Priority | Spec file | Gap / Flow | Reason |
|---|---|---|---|
| P0 | `advertiser/verify-advertiser-profile-loads.spec.ts` | Flow 1 | Core smoke test — profile page must load and display key elements before any interaction flows can run |
| P1 | `advertiser/verify-advertiser-block.spec.ts` | Flow 5 | Block is a safety-critical action; regression in block flow could expose users to unwanted interactions |
| P1 | `advertiser/verify-advertiser-unblock.spec.ts` | Flow 6 | Symmetric with Block; ensures blocked state is reversible |
| P1 | `advertiser/verify-advertiser-order-sidebar.spec.ts` | Flow 7 | Placing an order from the advertiser profile is the primary commercial action; entry point distinct from Markets |
| P2 | `advertiser/verify-advertiser-follow.spec.ts` | Flow 3 | Follow is a frequently used social feature; important but not safety-critical |
| P2 | `advertiser/verify-advertiser-unfollow.spec.ts` | Flow 4 | Symmetric with Follow; tests dropdown/Drawer interaction pattern |
| P2 | `advertiser/verify-advertiser-deep-link-adid.spec.ts` | Flow 8 | Deep link is used from share flows and external referrals; requires known TEST_AD_ID |
| P2 | `advertiser/verify-advertiser-stats-modal.spec.ts` | G3 | Stats modal exposes detailed trading information; low regression risk but good UX coverage |
| P3 | `advertiser/verify-advertiser-no-ads.spec.ts` | Flow 2 | Empty state UX — low regression risk; requires a dedicated no-ads advertiser account |
| P3 | `advertiser/verify-advertiser-own-profile.spec.ts` | G1 | Guards against Follow/Block accidentally rendering on own profile; low regression risk |
| P3 | `advertiser/verify-advertiser-deep-link-missing-ad.spec.ts` | G2 | Edge case: alert for missing adId; important error path but rarely hit in real usage |

