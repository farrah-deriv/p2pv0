# 🗺️ Auth Journey Catalog — Technical Reference

> Source of truth: `playwright/pages/LoginPage.ts`
> Created: 2026-06-25 | Last updated: 2026-06-25

---

## Section 1 — Journey Index

| Journey ID | Spec File | Tags |
|---|---|---|
| Flow 1 | `auth/verify-login-via-email-password.spec.ts` | `@desktop @mobile @auth @smoke @staging` |
| Flow 2 | `auth/verify-login-page-elements.spec.ts` | `@desktop @mobile @auth @smoke @production @staging` |
| Flow 3 | `auth/verify-unauthenticated-redirect.spec.ts` | `@desktop @mobile @auth @staging` |
| Flow 4 | `auth/verify-login-invalid-email.spec.ts` | `@desktop @mobile @auth @staging` |
| Flow 5 | `auth/verify-login-invalid-credentials.spec.ts` | `@desktop @mobile @auth @staging` |

> Spec file paths are relative to `playwright/tests/` — do not include the `playwright/tests/` prefix.

---

## Section 2 — Flow Details

### Flow 1 — Happy-path login with valid credentials

**Account setup (Pattern C — env var credentials):**

```typescript
let TEST_EMAIL: string = undefined!;
let TEST_PASSWORD: string = undefined!;

test.beforeAll(() => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("TEST_EMAIL and TEST_PASSWORD must be set in playwright/.env.staging");
  }
  TEST_EMAIL = email;
  TEST_PASSWORD = password;
});
```

**Note:** `loginPage.login()` validates credentials internally — do NOT add a separate `beforeAll` guard for login credentials. Use the guard above only when you need to read `TEST_EMAIL` / `TEST_PASSWORD` in the test body itself (e.g. for assertions).

**Test pattern:**

```typescript
await loginPage.login(); // uses TEST_EMAIL + TEST_PASSWORD from env
// loginPage.login() internally:
//   1. gotoLoginPage() → navigates to /login
//   2. enterEmail(email) → uses getByTestId("login-input-identifier")
//   3. clickLogInButton() → uses getByTestId("login-btn-submit")
//   4. waits for /enter-password
//   5. fills getByTestId("login-input-password")
//   6. clickLogInButton() → waits for redirect to /
await expect(marketPage.heading, "Market page heading should be visible after login").toBeVisible();
```

**Locators used (from LoginPage POM):**

| Locator name | Strategy | Value |
|---|---|---|
| `welcomeBackHeading` | `getByRole('heading', { level: 1 })` | "Welcome back!" h1 — load-ready signal |
| `emailInput` | `getByTestId('login-input-identifier')` | Email input container |
| `emailNativeInput` | `emailInput.locator('input')` | Native `<input>` inside container |
| `emailInputLabel` | `emailInput.locator('label').first()` | Label that focuses the input |
| `passwordInput` | `getByTestId('login-input-password').locator('input')` | Password native input |
| `logInButton` | `getByTestId('login-btn-submit').getByRole('button').first()` | Submit button |
| `googleButton` | `getByTestId('social-btn-google')` | "Log in with Google" |
| `facebookButton` | `getByTestId('social-btn-facebook')` | "Log in with Facebook" |
| `appleButton` | `getByTestId('social-btn-apple')` | "Log in with Apple" |
| `signUpLink` | `getByTestId('login-link-signup')` | "Sign up" link |
| `languageSwitcher` | `getByTestId('auth-language-btn')` | Language switcher in auth header |
| `liveChatButton` | `getByTestId('auth-btn-live-chat')` | Live chat in auth header |
| `validationError` | `getByTestId('login-input-identifier').locator("[role='alert']").first()` | Inline error |

---

### Flow 2 — Login page renders all expected elements

**Account setup:** None — read-only page inspection.

**Test pattern:**

```typescript
await loginPage.gotoLoginPage();
await loginPage.verifyLoginPageElements();
// Additional element assertions:
await expect(loginPage.page.getByText("Email"), "Email label should be visible").toBeVisible();
await expect(loginPage.page.getByPlaceholder("name@email.com"), "Email placeholder should be visible").toBeVisible();
// 🔍 Verify on staging — sign-up link text resolved from en.json:
await expect(loginPage.page.getByText("Don't have an account yet?"), "Sign up prompt should be visible").toBeVisible();
await expect(loginPage.page.getByRole("link", { name: "Sign up" }), "Sign up link should be visible").toBeVisible();
```

**Resolved i18n strings used:**

| `t()` key | Resolved English value | Locator strategy |
|---|---|---|
| `t('login.welcomeBack')` | `"Welcome back!"` | `getByRole('heading', { level: 1 })` |
| `t('login.email')` | `"Email"` | `getByText('Email')` |
| `t('login.emailPlaceholder')` | `"name@email.com"` | `getByPlaceholder('name@email.com')` |
| `t('login.logIn')` | `"Log in"` | `getByTestId('login-btn-submit').getByRole('button')` |
| `t('login.noAccountYet')` | `"Don't have an account yet?"` | `getByText("Don't have an account yet?")` |
| `t('login.signUp')` | `"Sign up"` | `getByRole('link', { name: 'Sign up' })` |

---

### Flow 3 — Unauthenticated user is redirected to login

**Account setup:** None — uses a clean browser context with no session.

**Test pattern:**

```typescript
// Use a fresh context with no stored auth
const context = await browser.newContext({ storageState: undefined });
const page = await context.newPage();
await page.goto("/");
// Wait for redirect away from /
await page.waitForURL((url) => !url.pathname.startsWith("/") || url.href.includes("login"), { timeout: 15000 });
await expect(page.url(), "Unauthenticated user should not stay on /").not.toMatch(/^https:\/\/staging-dp2p\.deriv\.com\/$/);
await context.close();
```

**Note:** The redirect target may be an external URL (`staging-home.deriv.com/dashboard/login`) for new-format users, or `staging-app.deriv.com` for v1 users. Assert that the user is **not** on `/` — do not hardcode the target URL.

---

### Flow 4 — Invalid email format rejected on login

**Account setup:** None.

**Test pattern:**

```typescript
await loginPage.gotoLoginPage();
// Assert button disabled when email is empty
await expect(loginPage.logInButton, "Log in button should be disabled when email is empty").toBeDisabled();
// Note: the "Log in" button's disabled state is controlled by `!email.trim()` in the component
// 🔍 Verify on staging: some email-type inputs reject non-email formats via browser native validation
// before the React click handler fires
```

---

### Flow 5 — Invalid credentials show error state

**Account setup (Pattern C — env var, valid email but wrong password):**

```typescript
test.beforeAll(() => {
  const email = process.env.TEST_EMAIL;
  if (!email) throw new Error("TEST_EMAIL must be set in playwright/.env.staging");
  TEST_EMAIL = email;
});
```

**Test pattern:**

```typescript
await loginPage.gotoLoginPage();
await loginPage.enterEmail(TEST_EMAIL);
await loginPage.clickLogInButton();
await page.waitForURL(/\/enter-password/);
// Enter wrong password
await loginPage.passwordInput.fill("wrongpassword_invalid_1234");
await loginPage.clickLogInButton();
// 🔍 Verify on staging — exact error message text from Ory Kratos response
await expect(loginPage.page.getByRole("alert"), "Error message should be visible after wrong password").toBeVisible();
```

---

## Section 3 — Tags Reference

| Tag | When to apply |
|---|---|
| `@auth` | All tests in the Auth module |
| `@smoke` | Critical happy path only — fast, does not mutate account state |
| `@staging` | Requires `TEST_EMAIL` / `TEST_PASSWORD` from staging env |
| `@production` | Safe on production: Flow 2 (read-only page element check) is production-safe |
| `@desktop` | Desktop viewport (1280×720, `chromium` project) |
| `@mobile` | Mobile viewport (412×915, `chromium-mobile` project) |

---

## Section 4 — Feature-Specific Decisions

### `app/login/_page.tsx` is NOT the active login page

The file at `app/login/_page.tsx` is prefixed with `_` — Next.js App Router ignores files starting with `_`. There is no `app/login/page.tsx`. On staging, `/login` resolves to an Ory Kratos-backed login page served by the external identity service, not a Next.js route.

**Impact on generated code:** Do not attempt to locate i18n keys from `_page.tsx` (e.g. `t('login.enterSixDigitCode')`) in test assertions — those strings are from a disabled/draft component. Use only the locators defined in `LoginPage.ts` POM.

### Login entry point — `gotoLoginPage()` uses `LOGIN_URL` env var

`gotoLoginPage()` navigates directly to `LOGIN_URL` (`https://staging-home.deriv.com/dashboard/login`). After successful login, Ory Kratos redirects back to `BASE_URL` (`/`). There is no separate `PasswordPage` POM — `/enter-password` is also an Ory Kratos route handled within `LoginPage`.

**Required env var:** `LOGIN_URL` must be set in `playwright/.env.staging`. Falls back to `BASE_URL` (`/`) if unset.

**Impact on generated code:** Never call `page.goto('/login')` directly in tests — always use `loginPage.gotoLoginPage()`.

### `enterEmail()` uses `pressSequentially`, not `fill()`

The email input is a custom Radix UI `Input` component wrapped in a container. The POM's `enterEmail()` dispatches a `click` on the label first, then uses `pressSequentially` with a 75ms delay. This is required because the input relies on JS input events.

**Impact on generated code:** Never call `loginPage.emailNativeInput.fill(email)` directly in tests — always use `loginPage.enterEmail(email)` or the full `loginPage.login()` method.

### Unauthenticated redirect target

`getLoginUrl()` redirects unauthenticated users to
`https://staging-home.deriv.com/dashboard/login` on staging.

**Impact on generated code:** For the unauthenticated redirect test (Flow 3), assert the Home login route rather than a legacy app-domain URL.

### Log in button is disabled when email is empty

In `app/login/_page.tsx`, the button has `disabled={!email.trim() || isLoading}`. On the Ory Kratos-backed staging login, verify the button's disabled state in G1 directly — do not submit the form to check this.

**Impact on generated code:** Use `toBeDisabled()` on `loginPage.logInButton` before filling the email field.

### `@production` applies to Flow 2 only

Flow 2 (login page element check) is read-only — it navigates to `/login` and asserts elements without submitting credentials. It is safe on production. All other auth flows require staging credentials and should carry `@staging` only.

**Impact on generated code:** Flow 2's `test.describe` should include both `@production` and `@staging` tags. Flows 1, 3, G1, and G2 should carry `@staging` only.
