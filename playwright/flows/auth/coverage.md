# Auth Journey Coverage

**Analysis date:** 2026-06-26

---

## Section 1 — Coverage at a Glance

| # | Journey | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Flow 1 | Happy-path login → home-app dashboard → P2P Markets via SSO | ✅ | ✅ | Includes login page element checks; full end-to-end path |
| Flow 2 | Unauthenticated user is redirected to login | ✅ | ✅ | Redirect target varies by user type |

---

## Section 2 — Gaps

> No open gaps — all flows are implemented.

---

## Section 3 — Priority List

| Priority | Spec file | Flow | Reason |
|---|---|---|---|
| P0 | `auth/verify-login-via-email-password.spec.ts` | Flow 1 | Login is the entry point to every other test — must pass before any other suite runs |
| P1 | `auth/verify-unauthenticated-redirect.spec.ts` | Flow 2 | Guards against a regression where unauthenticated users can access protected routes |
