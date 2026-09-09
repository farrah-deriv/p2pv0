# Flow Template — Standard Structure for Journey Spec Files

> **Purpose:** Defines the canonical structure every `flow.md` must follow.
> Flow files tell an AI *what* to verify at every step. They are the source of truth for step tables and gap test cases.
>
> **Rule:** Implementation details (method names, account setup code, tags, file paths) belong in `catalog.md`. Coverage status and priorities belong in `coverage.md`. Only step-level verification lives here.

---

## Mandatory Header

```markdown
# 📋 {Feature} Journey Spec — What to Test

> **Purpose:** Describes the {Feature} on `staging-dp2p.deriv.com`. Defines *what* to verify at each step.
>
> **Feature location:** {Location in the P2P app}
> **URL:** `https://staging-dp2p.deriv.com/{path}`
> **Authentication:** Required — all tests start from a logged-in state (except auth module flows)
> **Staging only:** {include if tests use createAccountV2 / QA Script Runner}
```

---

## Section 1 — Shared Step Pattern *(optional — include only when 2+ flows share a common sequence)*

When multiple flows share the same step sequence (e.g. both Buy and Sell order flows share the same login + navigation steps), define the pattern once and reference it from each flow section.

```markdown
### {Pattern Name} Steps

> Referenced by Flows N–M. Substitute `[Placeholder]` with the value listed in each flow section.

**Prerequisites:** {Account setup, env vars, or shared state required}

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | ... | ... | ... | ... |
```

**Rules:**
- Keep placeholder names consistent (`[OrderType]`, `[Currency]`, `[AdType]`, etc.)
- If a flow deviates from the pattern at one step, note it in that flow section — do not fork the pattern table

---

## Section 2 — Per-Flow Sections *(required)*

One section per flow. Use a compact header that identifies the spec file, env vars, and test data at a glance.

```markdown
### Flow N — {spec-file-name}.spec.ts

**Display name:** `{UI label}` *(for flows that substitute a placeholder)*

| Variant | Side | Currency pair | Env var |
|---|---|---|---|
| N.1 | Buy | USD / MYR | `TEST_EMAIL` |
| N.2 | Sell | USD / MYR | `TEST_EMAIL` |

> Follows [{Pattern Name} Steps](#{anchor}) — substitute `{UI label}` for `[Placeholder]`.
```

For flows that do NOT share a pattern, include the full step table directly:

```markdown
### Flow N — {spec-file-name}.spec.ts

**Prerequisites:** {Account setup}

| # | Step | Action | Expected Result | Test Data |
|---|------|--------|-----------------|-----------|
| 1 | ... | ... | ... | ... |
```

**Rules:**
- Step table columns: `#`, `Step` (short label), `Action` (what the user does), `Expected Result` (what to assert), `Test Data` (values or env vars)
- Keep `Expected Result` cells assertable — list the exact text, URL, or state to verify
- For flows with Buy + Sell variants, use two sub-tables under `#### Buy` / `#### Sell`
- For flows with Desktop + Mobile variants where the steps differ, use `#### Desktop` / `#### Mobile`

---

## Section 3 — Gap Flows *(required when gaps exist)*

One subsection per gap from `coverage.md`. Each gap gets the same step table format as regular flows.

```markdown
## Gap Flows

> These are test cases for coverage gaps. The proposed spec file for each gap is in [`coverage.md`](./coverage.md).

### G{n} — {Gap description}

| # | Test case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | {Short label} | {What to do} | {What to assert} |
```

**Rules:**
- Gap IDs here must match the gap IDs in `coverage.md`
- Each row is one test case (one `test()` block in the eventual spec)
- Keep step descriptions terse — the AI will expand them into code using `catalog.md`

---

## What does NOT belong in flow.md

| Content | Where it belongs |
|---|---|
| POM method names, fixture names, import paths | `playwright/pages/` — read the POM directly |
| `beforeAll` account setup code snippets | `catalog.md` — Section 2 (Flow Details) |
| Test tags, spec file paths | `catalog.md` — Sections 1 and 3 |
| Feature description / "What is X?" prose | Drop — not actionable |
| Known quirks / edge cases about implementation | `catalog.md` — Section 4 (Feature-Specific Decisions) |
| Coverage status and priority list | `coverage.md` |
| Gap descriptions (one-sentence) | `coverage.md` — Section 2 (Gaps) |
