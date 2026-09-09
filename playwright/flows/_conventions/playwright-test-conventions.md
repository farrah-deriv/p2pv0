# 🛠️ Playwright Test Conventions — p2p-v0

> **Purpose:** Defines how tests are structured, named, and written in this project.
> Applies to all journey specs. Individual spec files follow these rules without repeating them.
>
> **Scope:** Any AI writing or maintaining tests in this repo must read and follow this document.

---

## Before Writing Any Test

1. **Check if files already exist** — if a spec or Page Object exists, read it first and apply only the delta
2. **Search `app/` and `components/` for locators** — see the locator strategy below; never guess selector strings
3. **Walk through the full user flow** at least once (via MCP or manually on staging) before writing assertions
4. **Load the relevant skill** — `flow-to-playwright` for implementing from flow docs, `playwright` for general test work

---

## Project Structure

```
playwright/
├── pages/          ← Page Object Models (one file per page)
├── tests/          ← Spec files organised by feature area
├── fixtures/       ← Shared fixtures (import test from here — never from @playwright/test)
├── utils/          ← Utility functions (barrel export via index.ts)
└── flows/          ← Journey documentation (flow.md, catalog.md, coverage.md per module)
```

---

## File Naming

### Spec files
```
playwright/tests/<module>/verify-<feature>-<scenario>.spec.ts
```
Examples:
- `playwright/tests/auth/verify-login-email.spec.ts`
- `playwright/tests/ads/verify-create-ad-buy.spec.ts`
- `playwright/tests/orders/verify-order-complete.spec.ts`

### Page Object files
```
playwright/pages/<Name>Page.ts
```

---

## Test Structure Pattern

```typescript
import { test, expect } from "../fixtures/fixtures";

test.describe("Feature Name", { tag: ["@market", "@smoke"] }, () => {

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.login();
    });

    test("VERIFY [what is being tested]", async ({ marketPage }) => {
        // 1. Navigate / set up state
        // 2. Perform the action
        // 3. Assert the outcome
    });

});
```

- **Tags go on `test.describe()` only** — never on individual `test()` calls
- **Test names start with `VERIFY`** (uppercase)
- **Always import `test` from `../fixtures/fixtures`** — never from `@playwright/test`

---

## Tag Reference

### Feature area tags (use at least one per describe block)

| Tag | Module |
|---|---|
| `@market` | P2P Markets home (`/`) |
| `@auth` | Login / auth flow |
| `@ads` | My Ads (`/ads`) |
| `@advertiser` | Advertiser profile (`/advertiser/[id]`) |
| `@orders` | Orders (`/orders`, `/orders/[id]`) |
| `@profile` | User profile (`/profile`) |
| `@wallet` | Wallet (`/wallet`) |

### Execution tags

| Tag | When to apply |
|---|---|
| `@smoke` | Critical happy path — fast, no account state change |
| `@staging` | Requires staging env (Mailisk, QA Script Runner, fresh accounts) |
| `@production` | Safe to run on production (read-only, no mutations) |
| `@desktop` | Desktop viewport only |
| `@mobile` | Mobile viewport (chromium-mobile project) |

---

## Page Object Model Rules

### Structure

```typescript
export class MarketPage {
    constructor(readonly page: Page) {}

    // ── LOCATORS ──────────────────────────────────────────────
    get heading() {
        return this.page.getByRole("heading", { name: "P2P Markets" });
    }

    // ── ACTIONS ───────────────────────────────────────────────
    async navigateTo(): Promise<void> {
        await this.page.goto("/");
    }

    // ── VERIFICATIONS ─────────────────────────────────────────
    async verifyPageLoaded(): Promise<void> {
        await expect(this.heading, "Market heading should be visible").toBeVisible();
    }
}
```

- Locators are **getter properties**, not methods
- Methods are grouped: **Locators → Actions → Verifications**
- Never put `page.getByTestId(...)` directly in a test body — always go through a Page Object

### Updating a Page Object

1. Read the entire file first
2. If the locator/method exists and is correct → use as-is
3. If outdated → update in-place
4. If missing → add in the correct section
5. **Never create a duplicate locator** — use `.or()` chains for fallbacks

---

## Locator Strategy (Priority Order)

> **p2p-v0 has very sparse `data-testid` coverage.** Most elements require i18n text or role-based locators.

| Priority | Strategy | When to use |
|---|---|---|
| 1st | `getByTestId('...')` | Only if `data-testid` found in `app/` or `components/` source |
| 2nd | `getByRole('...', { name: '...' })` | Buttons, headings, links — use English text from `en.json` |
| 3rd | `getByPlaceholder('...')` | Form inputs with a placeholder attribute |
| 4th | `getByLabel('...')` | Inputs with `aria-label` or associated `<label>` |
| 5th | `getByText('...')` | Standalone visible text with no semantic role |
| Last | CSS selector | Last resort only — add a comment explaining why |

### Resolving i18n text

Button and heading text is always a translation key in TSX (`{t('adForm.next')}`), never hardcoded. Resolve to English via `lib/i18n/translations/en.json` before writing the locator:

```typescript
// t('adForm.next') → "Next"  (from lib/i18n/translations/en.json)
page.getByRole("button", { name: "Next" })
```

### Parameterised strings

When `en.json` has `{param}` placeholders (e.g. `"No ads available for {currency}"`), use partial matching:

```typescript
// ✅ Matches regardless of runtime currency value
page.getByText("No ads available for", { exact: false })
```

---

## Auth Flow

p2p-v0 uses **Ory Kratos 2-step login**:

1. `/login` — enter email → submit
2. `/enter-password` — enter password → submit
3. Redirects to `/` (MarketPage)

Always use `loginPage.login()` — it handles both steps automatically.

---

## Assertions

**Every `expect()` call must include a descriptive message:**

```typescript
// ✅ Correct
await expect(button, "Create ad button should be visible").toBeVisible();

// ❌ Wrong — no message
await expect(button).toBeVisible();
```

**Use semantic assertion methods:**

| What to check | Method |
|---|---|
| Element visible | `toBeVisible()` |
| Element hidden | `not.toBeVisible()` |
| Enabled | `toBeEnabled()` |
| Disabled | `toBeDisabled()` |
| Exact text | `toHaveText('exact text')` |
| Contains text | `toContainText('partial')` |
| Input value | `toHaveValue('value')` |
| URL | `toHaveURL(/pattern/)` |

---

## Waiting for Page State

- **Never use `waitForTimeout()`** — it creates flaky tests
- Wait for a visible element: `await expect(element, "...").toBeVisible()`
- Wait for URL: `await page.waitForURL(/pattern/)`
- After navigation or state change, wait for the new page's key element before proceeding

---

## Credentials and Environment Variables

- **Never hardcode credentials** in test files or page objects
- Store in `playwright/.env.staging` (gitignored)
- Always fail fast if a required variable is missing:

```typescript
const email = process.env.TEST_EMAIL;
if (!email) throw new Error("TEST_EMAIL is not set in playwright/.env.staging");
```

- Default email domain for generated addresses: `@webapps.mailisk.net`

---

## Mobile vs Desktop

- Tests tagged `@desktop` run on standard desktop viewport (1280×720)
- Tests tagged `@mobile` run on chromium-mobile (Pixel 7 preset)
- When a page renders differently on mobile, use `isMobileViewport` fixture to branch in the Page Object:

```typescript
// In a Page Object
async clickBuySell(isMobile: boolean): Promise<void> {
    if (isMobile) {
        await this.page.getByRole("button", { name: "Buy / Sell" }).click();
    } else {
        await this.page.getByRole("tab", { name: "Buy" }).click();
    }
}
```
