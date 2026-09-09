---
name: ship-change-slack
description: >
  CI-triggered "investigate, fix and ship" workflow for this repo. Intended to be invoked by
  the `direct-fix` GitHub workflow when iCore routes a bug from a Slack bug hunt. Can also be
  exercised manually by writing `/tmp/ctx.json` and running the skill. Use this whenever run
  context arrives as a file (`/tmp/ctx.json`) rather than as a pasted prompt — e.g. a terse
  report like "signup form doesn't show a validation error on blank email" with no root cause
  given. The bug report is a SYMPTOM, not a spec: investigating and localising the cause is
  part of this skill's job. It investigates, states a root-cause hypothesis, files the GitHub
  issue with that hypothesis BEFORE writing any code, implements, pushes, opens a PR, waits
  for real CI, and writes the Slack announcement to a file for iCore to relay — it never posts
  to Slack itself. Do NOT use for CLI work where a human is at a terminal.
---

# Ship Change (Slack-triggered, via iCore)

The input is a symptom rather than a spec, there is no human at a terminal to ask, and the
GitHub issue is filed early — right after investigation, before any code exists — so a
hand-back never loses the diagnosis.

Everything in the root `CLAUDE.md` applies unchanged: Radix UI via `components/ui/`,
`useTranslations` / `lib/i18n/translations/`, React Query, the branch/PR rules, and the
Ory auth patterns. This file documents only what is specific to a Slack-triggered CI run.

## Order of operations

```
§0  intake + guards
§1  investigate            → /tmp/investigation.txt
§2  create or reuse the GitHub issue
§3  branch + implement
§4  open the PR, wire Closes #N
§5  wait for real CI
§6  write announcement.txt or handback.txt
```

The issue is established at §2 so later hand-backs retain the diagnosis.

## §0. Read the context and guard

`/tmp/ctx.json` holds:

```json
{
  "bug_text": "signup form doesn't show a validation error on blank email",
  "reporter_slack_id": "U01ABC2DEF",
  "slack_thread_ts": "1730900000.123456",
  "scope_hint": "src/features/auth",
  "resume_issue_number": "",
  "resume_pr_number": ""
}
```

Only `bug_text` and `reporter_slack_id` are required. The workflow has already normalized the
payload and run the duplicate guard before this skill starts — do not re-run or second-guess
them. If `resume_pr_number` is set, an open PR already owns this thread: continue on it.
Lexi may also stamp `CONTINUE PR: <N>` as the first line of `bug_text` — treat that the
same as `resume_pr_number`. Do not invent that header yourself.

**Attribution.** `bug_text` begins with a `SLACK SOURCE` block whenever Lexi could resolve
the reporter and the thread:

```
SLACK SOURCE
Reported by: Jane Doe
Slack thread: https://deriv-group.slack.com/archives/C01ABC2DEF/p1730900000123456
```

Use those two values as the attribution: a name, and a link a reader can follow. Do **not**
write `slack_id=<id>` or a bare thread timestamp as the attribution — this repo can resolve
neither, which is exactly why Lexi resolves them upstream and sends the block. If the block
is absent, record the raw `reporter_slack_id` and move on: a missing name never blocks a run.

**Branch naming is always `claude/<topic>`.** Issues are always **unassigned** — never
`--assignee @me` (it resolves to the App/bot) and never guess a GitHub login.

## §1. Investigate — before any branch, before any code

This is where this skill earns its keep. Do not skip it because the bug seems obvious.

1. **Localise.** Find the code responsible. Use `scope_hint` if given, but verify it rather
   than trusting it. Consult the `CLAUDE.md` routing table for the area named in the report
   and read the matching skill doc — it often names the exact file and the known pitfalls.
2. **Read the history.** `git log -p` on the suspect files. Bug-hunt findings are often
   regressions, and the commit that introduced one is the fastest possible explanation.
3. **Form ONE hypothesis** and write it down explicitly: which file, which line or component,
   why it produces the reported symptom, and why the symptom appears under the reported
   conditions (only on mobile viewport, only for EU region, only when logged out) and not
   otherwise. An explanation that would predict the bug happening always, when it doesn't, is
   wrong.
4. **Write the hypothesis to `/tmp/investigation.txt`.** It goes into the GitHub issue (§2)
   and the PR description (§4). The reporter reading "it thinks the cause is X" is the
   cheapest correction mechanism available, and it only works if the hypothesis is stated
   separately from the fix rather than implied by it.

**Stop conditions — these are successes, not failures.** Write the reason to
`/tmp/handback.txt` and exit non-zero if:

- You cannot localise the cause with reasonable confidence. Guessing produces a clean,
  well-tested fix to the wrong problem, which is worse than no fix because it consumes review
  attention and looks trustworthy.
- The symptom has several plausible distinct causes and the report doesn't distinguish them.
  Name them; a one-line reply in the thread resolves it and the re-trigger is cheap.
- The fix would require a design decision (which of two layouts is correct, what the behaviour
  *should* be). That is not yours to make.
- The change would introduce a raw HTML control where a `components/ui/` Radix primitive
  exists, or hardcoded colors instead of Tailwind tokens. Root `CLAUDE.md` requires those
  conventions, and you have no way to ask for an exception — hand back and say so.
- The scope exceeds a bug fix (a feature, a refactor across subsystems, a schema change).

Handing back with a clear reason is the correct outcome maybe a fifth of the time. Treat it
that way rather than pushing through.

## §2. Create or reuse the GitHub issue — before any branch or code

Read `resume_issue_number` from `/tmp/ctx.json`.

- **Nonempty:** reuse that issue. Do not create or retitle a second one. Preserve its existing
  `slack-thread:` anchor and add the new investigation as a comment.
- **Empty:** create the issue now with `gh issue create`.

For a newly created issue:

- **Title:** derived from `bug_text`, human-readable, no conventional-commit prefix.
- **Body:** the hypothesis from `/tmp/investigation.txt`, the verbatim `bug_text`,
  `slack-thread: <ts>` on its own line (this stamp is what the duplicate guard matches on
  re-runs — keep it verbatim even though the Source section links the same thread), and a
  `## Source` section built from the `SLACK SOURCE` block (§0):

  ```
  ## Source
  - **Reported by:** <name>
  - **Slack thread:** <permalink>
  ```

  With no `SLACK SOURCE` block, name the raw `reporter_slack_id` there instead and omit the
  thread link rather than inventing one.
- **Label:** `bug`. Do not apply `icore-fix` — that label triggers the *other* pipeline
  (`issue-to-pr-trigger.yml`) and would start a second, competing run against the same issue.
- **Assignee:** none.

Capture the issue number. **If anything after this point hands back, the issue stays open**
with the investigation recorded — never delete or close it. A human can read the hypothesis
and take it from there.

## §3. Implement

If `resume_pr_number` is nonempty, this is a follow-up on work already in review:

```bash
gh pr checkout "$RESUME_PR_NUMBER"
git merge origin/main
```

Stay on that branch. Do not cut a new `claude/<topic>` and do not open a second PR.
Catch up to `origin/main` with a merge (never rebase, never force-push).

Otherwise: branch `claude/<topic>` cut from `origin/main`. Fix the cause you identified, not the symptom.

Every root-`CLAUDE.md` rule applies. The ones most often missed in an unattended run:

- **i18n.** Any new user-facing string needs a key in `lib/i18n/translations/en.json`
  **and the same key with a real translation in every other file in that directory**
  (ar, bn, de, es, fr, it, ko, mn, pl, pt, ru, si, sw, ta, vi, zh, zh_TW). Copying the
  English value into every locale is forbidden and will fail review. If a fix would
  require adding copy you cannot translate properly, that is a legitimate hand-back.
- **`components/ui/`** Radix wrappers only — no raw `<button>`, `<input>`, or custom
  modal where a primitive exists. Tailwind tokens from `tailwind.config.ts`, never hex.
- **API** through `services/api/` only. No direct `fetch`/`axios` from a component.
- **Never** hardcode user-facing strings; always `t("namespace.key")`.

**Add a regression test where the bug is testable.** Tests live in `__tests__/` mirroring
the source path (Jest + Testing Library). A test that fails before your change and
passes after is the only durable evidence the fix works. Where the behaviour genuinely
isn't unit-testable, say so in the PR rather than adding a test that would pass either way.

This runner does not execute Playwright (it needs `ENV_ENCRYPTION_KEY` and a live staging
backend). Do the static half: name any specs that would be affected, and list them in
the PR under `Playwright impact:`. **Never claim you ran them.**

Run `pnpm lint`, `npx tsc --noEmit`, and `pnpm test` locally before pushing. They are
fast and catch most of what CI would reject — but they are not the gate. CI is (§5).

## §4. Open the PR — or continue the existing one

Push the branch. Do not push to `main` — `.githooks/pre-push` blocks it, and bypassing a hook
without explicit approval is forbidden.

If `resume_pr_number` is nonempty, the PR already exists. Push the existing branch and
comment the new hypothesis on that PR. Do not `gh pr create`.

Otherwise open one PR against `main`. The PR body must carry:

- the hypothesis from `/tmp/investigation.txt` (so a reviewer can check the diagnosis, not
  just the diff)
- `slack-thread: <ts>` on its own line
- the same `## Source` section as the issue (§2), so a reviewer can see who reported it and
  open the thread without going back to Slack
- `Closes #<issue-number>` from §2
- a `Playwright impact:` line (see §3)

## §5. Wait for real CI

The run has a hard deadline in `/tmp/direct-fix-deadline-epoch`. Before every CI poll and
before starting another fix iteration, compare it against `date +%s`. When fewer than five
minutes remain, write an actionable hand-back and stop; never let polling consume the
finalization reserve.

Checks are not registered the instant a PR opens, so poll briefly for at least one check
before relying on:

```bash
gh pr checks <pr-url> --watch --fail-fast
```

**A PR is not green merely because `gh pr checks` initially reports no checks.**

This repo has no `ci-checks.yml`. Report only the checks `gh pr checks` actually lists —
never claim lint/typecheck/unit/lighthouse unless that job ran. Treat an accessibility or
Playwright failure as yours to fix when it is caused by your change.

**Flakes.** `main` is green, so any failure is either caused by your change or a flake.
Distinguish them properly rather than assuming:

1. Re-run the failed job once: `gh run rerun <run-id> --failed`.
2. If it passes on the re-run and the test is unrelated to your change, treat it as a flake —
   and **disclose it by name in the final result**. A tolerated failure that nobody is told
   about is indistinguishable from a missed regression.
3. If it fails both times, it is real. Fix it if your change caused it; hand back if it did
   not, saying which test and why you believe it is pre-existing.

Use at most **two CI-fix iterations**. If failures remain after the second, hand back with the
list rather than declaring the change shipped.

## §6. Write the result — do not post anything

You have no Slack access. iCore relays whatever you write. Exactly one of
`/tmp/announcement.txt` or `/tmp/handback.txt` must exist when this skill exits — verify with:

```bash
bash .claude/skills/ship-change-slack/scripts/check_output_contract.sh \
  /tmp/announcement.txt /tmp/handback.txt
```

**Announcement** (only when the PR is open, its required checks are genuinely green, and any
tolerated flake is disclosed). Plain text, ready to post verbatim — iCore will not edit it:

```
Fixed: <one-line description of the user-visible symptom>

Cause: <the root cause from §1, one or two lines>
Fix: <what changed, one or two lines>

PR: <url> (checks green, awaiting human review)
Issue: <url>
```

Never write an announcement for a PR whose checks have not actually passed. "Opened a PR" is
not "shipped" — a human still reviews and merges every PR; say so rather than implying the
change is live.

**Hand-back** on any other outcome, at any section. Say what happened, the issue number if one
was filed, and what a human should do next. A run that produces neither file leaves the
reporter waiting with no signal — the worst outcome available, and exactly what
`check_output_contract.sh` exists to catch.

## Rules

- One thread, one issue, one branch, one PR. A follow-up on the same thread continues that PR — it does not open a second one and does not require the first PR to be closed.
- Branch is always `claude/<topic>`; issues are always unassigned.
- Issue created or reused before code (§2), so later hand-backs retain an actionable diagnosis.
- Investigate before branching. State the hypothesis before fixing. Fix the cause, not the symptom.
- **Never claim a verification that was not performed** — not Playwright, not a check this repo
  doesn't run, not a green CI you didn't wait for.
- Never label the issue `icore-fix` — that starts a competing pipeline.
- No rebase, no force push, no `--no-verify`.
- Handing back with a clear reason beats shipping a guess. Always.
