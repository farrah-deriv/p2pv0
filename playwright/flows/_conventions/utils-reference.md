# Utils Reference — p2p-v0

> **Purpose:** Documents utilities available in `playwright/utils/`.
> Import everything from the barrel export — never import individual files directly.

---

## Import

```typescript
import { loginHelpers, DataFactory } from "../utils";
```

---

## Local Utils (`playwright/utils/`)

### `loginHelpers`

Standalone login helper for use outside of fixtures (e.g. in `beforeAll`).

```typescript
await loginHelpers.login(page, email?, password?);
// Returns: the email address used to log in
```

Falls back to `process.env.TEST_EMAIL` / `process.env.TEST_PASSWORD` if args omitted.

---

## Submodule Utils (`playwright/e2e-tests-core/utils/`)

Re-exported via the barrel — available via `import { ... } from "../utils"`.

### `DataFactory`

Generates test data. All methods are static.

```typescript
DataFactory.generateEmail()
// → "pw_agent_1234567890@webapps.mailisk.net"

DataFactory.generateEmail('mobileapps.mailisk.net')
// → "pw_agent_1234567890@mobileapps.mailisk.net"

DataFactory.generateEmailWithPrefix('ads_test')
// → "pw_agent_ads_test_1234567890@webapps.mailisk.net"
```

**Default email domain:** `@webapps.mailisk.net`

### `NavigationUtils`

Waits for the page to settle after navigations that trigger multiple network requests.

```typescript
await NavigationUtils.waitForNetworkIdle(page, {
    idleMs: 5000,       // ms with no requests before considering settled
    maxWaitMs: 20000,   // hard timeout
});
```

Use after actions that trigger background API calls (e.g. submitting a form, changing a filter).

### `MailiskUtils`

Reads OTP/verification emails from Mailisk inboxes.

```typescript
// Read latest email for an address
const email = await MailiskUtils.getLatestEmail(apiKey, emailAddress);

// Extract 6-digit OTP from email body
const otp = MailiskUtils.extractOtp(email.body);
// OTP regex: /\b(\d{6})\b/
```

Requires `MAILISK_API_KEY` env var.

### `qaScriptRunner` / `accountCreationRunner`

> **Staging only** — not available on production.

Used to create test accounts or trigger QA scripts via the Deriv QA Script Runner API. Not needed for p2p-v0 tests that use pre-existing accounts via env vars.

---

## Environment Variables

| Variable | Used by | Required for |
|---|---|---|
| `TEST_EMAIL` | `loginHelpers.login()`, `loginPage.login()` | All login flows |
| `TEST_PASSWORD` | `loginHelpers.login()`, `loginPage.login()` | All login flows |
| `MAILISK_API_KEY` | `MailiskUtils` | Email OTP flows |

Store in `playwright/.env.staging` (gitignored). See `playwright/.env.staging.example` for the template.
