# Catalog Template — Standard Structure for AI-Driven Test Writing

> **Purpose:** Defines the canonical 4-section structure every `catalog.md` must follow.
> The AI loads `catalog.md` when converting `flow.md` steps into a Playwright spec. It must answer three questions: which method to call and what to pass it, which tags and file name to use, and what non-obvious rules apply.
>
> **Rule:** Every section that IS present must have real content. If a section is not applicable for a simple feature, omit it entirely.

---

## Mandatory Header

```markdown
# 🗺️ {Feature} Journey Catalog — Technical Reference

> Source of truth: `playwright/pages/{Name}Page.ts`
> Created: YYYY-MM-DD | Last updated: YYYY-MM-DD
```

---

## Section 1 — Journey Index *(required)*

One row per flow. Gives the AI the spec file path and tags without it having to guess either.

```markdown
| Journey ID | Spec File | Tags |
|---|---|---|
| Flow 1 | `market/verify-market-loads.spec.ts` | `@desktop @mobile @market @smoke` |
| G1     | `market/verify-no-ads-state.spec.ts` | `@desktop @market` |
```

> Spec file paths are relative to `playwright/tests/` — do not include the `playwright/tests/` prefix.

**Rules:**
- Include gap flows (G1, G2…) so the AI knows what files already exist before creating new ones
- Tags must be the exact strings used in `test.describe({ tag: [...] })` — no invented tags
- Feature area tags: `@market`, `@auth`, `@ads`, `@advertiser`, `@orders`, `@profile`, `@wallet`
- Execution tags: `@smoke`, `@staging`, `@production`, `@desktop`, `@mobile`

---

## Section 2 — Flow Details *(required)*

The `beforeAll` setup and method chain for each flow. Specific enough that the AI produces working code on the first attempt.

```markdown
### Flow 1 — {Description}

**Account setup (Pattern B — env var):**
```typescript
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (!email || !password) throw new Error("TEST_EMAIL and TEST_PASSWORD must be set in playwright/.env.staging");
```

**Test pattern:**
```typescript
await loginPage.login(email, password);
await featurePage.navigateTo();
await featurePage.doSomething('param');
await expect(featurePage.successHeading, 'Success heading should be visible').toBeVisible();
```
```

**Rules:**
- Always show the `beforeAll` account creation or env var reference — this is the most common source of AI errors
- Show the method chain, not pseudocode
- If a flow shares a pattern with other flows, show the pattern once and list the per-flow parameters in a table (e.g. display names, amounts, env vars)
- Cross-reference `flow.md` for step-by-step verification tables — don't duplicate them here

---

## Section 3 — Tags Reference *(required)*

```markdown
| Tag | When to apply |
|---|---|
| `@market` | All tests in the Markets module |
| `@smoke` | Critical happy path only — fast, no account state change |
| `@staging` | Requires staging env (Mailisk, fresh accounts) |
| `@production` | Safe to run on production (read-only, no mutations) |
| `@desktop` | Desktop viewport only (1280×720) |
| `@mobile` | Mobile viewport (chromium-mobile, Pixel 7) |
```

---

## Section 4 — Feature-Specific Decisions *(required when non-obvious logic affects generated code)*

Records decisions that would cause naive AI-generated code to be wrong. Not boilerplate — only add entries where the rule is surprising or not derivable from the code.

```markdown
### {Decision name}

One or two sentences: what the rule is and why it exists.

**Impact on generated code:** what the AI must do differently because of this rule.
```

**Examples of what belongs here:**
- P2P balance gate — flows that require `userData?.balances?.amount > 0` (funded account)
- Buy vs Sell side differences that affect locators or assertions
- WebSocket subscription behaviour that affects when assertions should run
- Deep link entry points (e.g. `/wallet?operation=TRANSFER`) that are distinct from direct navigation
- Flows that require `test.describe.configure({ mode: 'serial' })` due to shared order state
- A locator that differs between desktop and mobile layout (use `isMobileViewport` fixture)

---

## What does NOT belong in catalog.md

| Content | Where it belongs |
|---|---|
| Step-by-step verification tables | `flow.md` |
| Coverage gaps and gap descriptions | `coverage.md` |
| Route/URL tree and data-testid map | `flow.md` (orientation for humans) |
| How to add a new variant / maintenance guide | `coverage.md` or a contributing doc |
| How to debug / triage map | Not needed — the POM reference and decisions sections already point the AI to the right place |
| Project-wide Playwright rules | `playwright/CLAUDE.md` |
| Shared utility docs | `playwright/flows/_conventions/utils-reference.md` |
