# 📋 Auth Journey Spec — What to Test

> **Purpose:** Describes the Login flow on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** `LOGIN_URL` (`staging-home.deriv.com/dashboard/login`) → `/enter-password` → `staging-home.deriv.com/dashboard/home` → P2P button → `staging-dp2p.deriv.com/`
> **Authentication:** Not required — these are the flows that establish authentication
> **Note:** Login is driven by Ory Kratos. The `LoginPage` POM navigates to `LOGIN_URL` directly. After password submission, Ory Kratos redirects to the home-app dashboard (`/dashboard/home`), not to p2p.

---

## Section 1 — Shared Login Steps

> Referenced by Flow 1. Substitute `[email]` and `[password]` with the values listed in each flow section.

**Prerequisites:** Valid staging account credentials in `playwright/.env.staging` (`TEST_EMAIL`, `TEST_PASSWORD`)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Navigate to login | Navigate to `/login` | Page loads; heading visible; email input visible | — |
| 2 | Enter email | Type email address into the email field | Email appears in the input | `[email]` |
| 3 | Submit email | Click the "Log in" button | Button is enabled when email is non-empty; page transitions to `/enter-password` | — |
| 4 | Enter password | Type password into the password field | Password field is visible and accepts input | `[password]` |
| 5 | Submit password | Click the "Log in" button | App redirects to `/dashboard/home` (home-app dashboard); page loads successfully | — |

---

## Section 2 — Per-Flow Sections

### Flow 1 — verify-login-via-email-password.spec.ts

**Display name:** Happy-path login with valid credentials, SSO into P2P Markets

**Prerequisites:** Pre-existing test account in `TEST_EMAIL` / `TEST_PASSWORD` env vars

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Navigate to login | Navigate to `LOGIN_URL` | Login page heading is visible | — |
| 2 | Verify login page elements | Observe page | All 9 login page elements visible (heading, email input, Log in button, social buttons, Sign up link, language switcher, live chat button) | — |
| 3 | Enter email | Type email into the email field | Email value appears in the field | `TEST_EMAIL` |
| 4 | Submit email | Click "Log in" button | Transitions to `/enter-password`; all 9 password page elements visible | — |
| 5 | Enter password | Type password into the password field | Password is accepted | `TEST_PASSWORD` |
| 6 | Submit login | Press Enter on the password field | Redirects to `/dashboard/home`; home-app dashboard loads | — |
| 7 | Verify dashboard | Observe the dashboard | "My trading accounts" heading, Real/Demo tabs, and nav links are visible | — |
| 8 | Click P2P | Click the P2P button in "Explore Deriv" | Browser navigates to `staging-dp2p.deriv.com/` via SSO | — |
| 9 | Verify P2P Markets | Observe the P2P Markets page | Buy and Sell tabs are visible; user is logged in automatically | — |

---

### Flow 2 — verify-unauthenticated-redirect.spec.ts

**Display name:** Unauthenticated user is redirected to login

**Prerequisites:** No active session (fresh browser context, no stored cookies)

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | Navigate to protected route | Navigate to `/` (P2P Markets) without a session | App redirects away from `/` | — |
| 2 | Verify redirect target | Observe URL after redirect | URL is no longer `/`; user lands on a login page (either `/login` or external Deriv login) | — |

---

