---
name: release-prepare-tag
description: "Create a GitHub Issue + draft GitHub Release for the next P2P production deploy: auto-detect merged PRs and fixed issues since the last production tag, create a tracking issue that cross-links all of them, then create a draft release referencing the issue. Hand off to release-publish-tag once regression passes."
---

# Release Prepare Tag (P2P)

Before each P2P production deploy:
1. Create a **GitHub tracking issue** listing every PR and fixed issue on staging — GitHub cross-references are created automatically by mentioning `#NUMBER` in the body.
2. Create a **draft GitHub Release** referencing that tracking issue as the regression manifest.

When regression passes, push the tag to trigger `build-and-deploy-prod.yml` and close the tracking issue.

---

## Step 0 — Prerequisites

```bash
# Confirm GitHub CLI is authenticated
gh auth status

# Fetch the latest tags from remote
git fetch --tags upstream || git fetch --tags
```

---

## Step 1 — Identify the latest production tag

```bash
git tag -l "production_v*" | sort -V | tail -5
LAST_TAG=$(git tag -l "production_v*" --sort=creatordate | tail -1)

if [ -z "$LAST_TAG" ]; then
  echo "Error: No production_v* tag found. Run 'git fetch --tags upstream' (or 'git fetch --tags') and retry."
  exit 1
fi

echo "Currently live tag: $LAST_TAG"
```

Every `main` commit **after** this tag is on staging and needs to be regression-tested.

> **Tag format:** `production_v20260824_0` — `production_v` followed by 8-digit date, then integer suffix.

---

## Step 2 — Compute the next production tag

```bash
TODAY=$(date +%Y%m%d)
LAST_N=$(git tag -l "production_v${TODAY}_*" | sed "s/production_v${TODAY}_//" | grep -E '^[0-9]+$' | sort -n | tail -1)
NEXT_N=$(( ${LAST_N:-"-1"} + 1 ))
NEW_TAG="production_v${TODAY}_${NEXT_N}"
echo "Next production tag: $NEW_TAG"
```

The tag is not pushed yet — it is used only as the release label until regression passes.

---

## Step 3 — List all PRs merged since the last production tag

```bash
# Full ISO-8601 timestamp avoids missing PRs merged on the same calendar day as the last tag
LAST_TAG_TS=$(git log -1 --format=%cI "$LAST_TAG" | sed 's/+[0-9:]*/Z/' | sed 's/ /T/')
echo "PRs merged to main after $LAST_TAG_TS:"

gh pr list \
  --repo deriv-com/p2p-v0 \
  --base main \
  --state merged \
  --json number,title,url,author,mergedAt \
  --search "merged:>${LAST_TAG_TS}" \
  --limit 500 \
  | jq -r 'sort_by(.number) | .[] | "  PR #\(.number) — \(.title)  (@\(.author.login))"'
```

Review the list before continuing. Cross-check with `git log --oneline ${LAST_TAG}..HEAD` (or `..upstream/main`) if you want to verify commit-level coverage.

---

## Step 4 — Extract fixed issues from PR bodies

Scan the body of each merged PR for `Closes #X`, `Fixes #X`, `Resolves #X` (and `Closes: #X` colon variants):

```bash
LAST_TAG_TS=$(git log -1 --format=%cI "$LAST_TAG" | sed 's/+[0-9:]*/Z/' | sed 's/ /T/')

FIXED_ISSUE_NUMS=$(gh pr list \
  --repo deriv-com/p2p-v0 \
  --base main \
  --state merged \
  --json number,body \
  --search "merged:>${LAST_TAG_TS}" \
  --limit 500 \
  | jq -r '.[].body // ""' \
  | grep -iE '(closes|fixes|resolves|close|fix|resolve)[[:space:]:_]*(#[0-9]+|https://github\.com/[^/]+/[^/]+/issues/[0-9]+)' \
  | grep -oE '#[0-9]+|/issues/[0-9]+' \
  | grep -oE '[0-9]+' \
  | grep -E '^[0-9]+$' \
  | sort -un)

echo "Fixed issue numbers found:"
echo "$FIXED_ISSUE_NUMS" | while read -r n; do echo "  #$n"; done
```

If the list looks complete, proceed. Add any missing issue numbers manually in Step 5.

---

## Step 5 — Collect any additional GitHub issue links (optional)

If issues should be included that were not referenced by a `Closes/Fixes` line in a PR body, note their numbers here:

```bash
# Add extra issue numbers (space or newline separated), e.g.:
EXTRA_ISSUE_NUMS=""
```

Leave empty (`EXTRA_ISSUE_NUMS=""`) if nothing extra is needed.

---

## Step 6 — Freeze new merges to `main`

> **Important:** Once the tracking issue and draft release are created (Steps 7–8), new PRs merged to `main` will land on staging but will be **absent from the regression manifest**. Coordinate with the team to hold off merging to `main` until regression passes and the production tag is pushed. Any PRs that land during the regression window must either be included by re-running the skill or deferred to the next release.

---

## Step 7 — Create the GitHub tracking issue

This issue cross-links every PR and fixed issue. GitHub automatically creates back-references on each mentioned item when you use `#NUMBER` in the body.

```bash
# ── Variables ─────────────────────────────────────────────────────────────
LAST_TAG=$(git tag -l "production_v*" --sort=creatordate | tail -1)
if [ -z "$LAST_TAG" ]; then
  echo "Error: No production_v* tag found. Run 'git fetch --tags upstream' and retry."
  exit 1
fi
TODAY=$(date +%Y%m%d)
LAST_N=$(git tag -l "production_v${TODAY}_*" | sed "s/production_v${TODAY}_//" | grep -E '^[0-9]+$' | sort -n | tail -1)
NEXT_N=$(( ${LAST_N:-"-1"} + 1 ))
NEW_TAG="production_v${TODAY}_${NEXT_N}"
LAST_TAG_TS=$(git log -1 --format=%cI "$LAST_TAG" | sed 's/+[0-9:]*/Z/' | sed 's/ /T/')

# ── PR list (markdown with #NUMBER cross-links) ───────────────────────────
PR_LINES=$(gh pr list \
  --repo deriv-com/p2p-v0 \
  --base main \
  --state merged \
  --json number,title,url,author,mergedAt \
  --search "merged:>${LAST_TAG_TS}" \
  --limit 500 \
  | jq -r 'sort_by(.number) | .[] | "- #\(.number) — \(.title)  (@\(.author.login))"')

# ── Fixed issues from PR bodies ───────────────────────────────────────────
FIXED_ISSUE_NUMS=$(gh pr list \
  --repo deriv-com/p2p-v0 \
  --base main \
  --state merged \
  --json number,body \
  --search "merged:>${LAST_TAG_TS}" \
  --limit 500 \
  | jq -r '.[].body // ""' \
  | grep -iE '(closes|fixes|resolves|close|fix|resolve)[[:space:]:_]*(#[0-9]+|https://github\.com/[^/]+/[^/]+/issues/[0-9]+)' \
  | grep -oE '#[0-9]+|/issues/[0-9]+' \
  | grep -oE '[0-9]+' \
  | grep -E '^[0-9]+$' \
  | sort -un)

# ── (Optional) extra issue numbers added manually ─────────────────────────
EXTRA_ISSUE_NUMS=""   # e.g. "1234 1235"

ALL_ISSUE_NUMS=$(echo "$FIXED_ISSUE_NUMS $EXTRA_ISSUE_NUMS" | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -un)
ISSUE_LINES=$(echo "$ALL_ISSUE_NUMS" | while read -r n; do [ -n "$n" ] && echo "- #$n"; done)

# ── Load QA checklist from template or default P2P checklist ──────────────
TEMPLATE="$(git rev-parse --show-toplevel)/.github/ISSUE_TEMPLATE/regression-checklist.md"
if [ -f "$TEMPLATE" ]; then
  CHECKLIST=$(awk '/^---$/{n++; if(n==2){found=1; next}} found' "$TEMPLATE" | sed '/./,$!d')
else
  CHECKLIST="## P2P Regression Checklist

- [ ] Trigger Playwright Test Automation
  - [ ] Go to Playwright workflow on GitHub Actions and run against \`staging\`
  - [ ] Verify test results pass without infrastructure/timeout errors
- [ ] Markets / Buy & Sell
  - [ ] Verify Buy/Sell ad listings load correctly
  - [ ] Test filters (currency, payment method, sort)
- [ ] Order Lifecycle
  - [ ] Buy order flow (create -> pay -> complete)
  - [ ] Sell order flow (create -> confirm payment -> complete)
  - [ ] Cancel order flow
  - [ ] Dispute order flow & proof upload
- [ ] My Ads
  - [ ] Create ad wizard (all steps)
  - [ ] Edit / activate / deactivate ad
- [ ] Profile & Settings
  - [ ] Payment methods (add, edit, delete)
  - [ ] Business hours & advertiser settings
- [ ] Wallets & Transfers
  - [ ] Transfer between wallets
  - [ ] Balance update after transaction"
fi

# ── Assemble issue body ───────────────────────────────────────────────────
ISSUE_BODY="${CHECKLIST}

---

## Regression manifest for \`${NEW_TAG}\`

> **Status:** 🔲 Regression in progress — do not push the production tag until QA signs off.

### Pull requests included in this release

Changes merged to \`main\` since \`${LAST_TAG}\` (live on staging):

${PR_LINES}

### Fixed issues

$([ -n "$ISSUE_LINES" ] && echo "$ISSUE_LINES" || echo "_No issues with Closes/Fixes references found in the PR bodies above._")

---

Once regression passes:
1. Push the tag: \`git tag ${NEW_TAG} && git push upstream ${NEW_TAG}\` (or origin)
2. Publish the draft GitHub Release.
3. Close this issue."

# ── Create the issue ──────────────────────────────────────────────────────
TRACKING_ISSUE_URL=$(gh issue create \
  --repo deriv-com/p2p-v0 \
  --title "[TAG] P2P Production - ${NEW_TAG}" \
  --body "$ISSUE_BODY")

echo ""
echo "Tracking issue created: $TRACKING_ISSUE_URL"
TRACKING_ISSUE_NUM=$(echo "$TRACKING_ISSUE_URL" | grep -oE '[0-9]+$')

# ── (Optional) Add issue to project board ────────────────────────────────
# PROJECT_ID="<PROJECT_ID>"
# if [ -n "$PROJECT_ID" ]; then
#   gh project item-add "$PROJECT_ID" --owner deriv-com --url "$TRACKING_ISSUE_URL"
# fi
```

GitHub will add a mention notification to every PR and issue referenced by `#NUMBER` in the body, creating a visible cross-reference audit trail.

---

## Step 8 — Create the draft GitHub Release

Reference the tracking issue in the release notes so the Release and the Issue are linked:

```bash
# ── (Continues from Step 7 — variables must still be set) ─────────────────
RELEASE_BODY="## [TAG] P2P Production - \`${NEW_TAG}\`

**Regression tracking issue:** #${TRACKING_ISSUE_NUM}

### Changes on staging since \`${LAST_TAG}\`

${PR_LINES}

### Fixed issues

$([ -n "$ISSUE_LINES" ] && echo "$ISSUE_LINES" || echo "_None detected automatically._")

---

**Regression status:** 🔲 In progress — see #${TRACKING_ISSUE_NUM}

Once regression passes, push the tag to trigger the production deploy:
\`\`\`bash
git tag ${NEW_TAG} && git push upstream ${NEW_TAG}
\`\`\`"

gh release create "$NEW_TAG" \
  --repo deriv-com/p2p-v0 \
  --draft \
  --title "[TAG] P2P Production - $NEW_TAG" \
  --notes "$RELEASE_BODY" \
  --target main

echo ""
echo "Draft release created: $NEW_TAG"
gh release view "$NEW_TAG" --repo deriv-com/p2p-v0 --json url -q '.url'
```

The tag is **not** pushed to the git remote yet — `build-and-deploy-prod.yml` will not fire. The release exists only as a draft placeholder.

---

## Step 9 — Share with QA

Share both URLs with the QA team:
- **Tracking issue** (from Step 7): use for commenting per-item regression status
- **Draft release** (from Step 8): read-only overview of all changes

---

## Step 10 — Hand off to QA

Once Steps 7–9 are done, QA drives regression. When all items in the tracking issue are signed off:
1. Push the production tag: `git tag <NEW_TAG> && git push upstream <NEW_TAG>`
2. Publish the draft release: `gh release edit <NEW_TAG> --repo deriv-com/p2p-v0 --draft=false`
3. Monitor the Cloudflare Pages production deployment in `build-and-deploy-prod.yml`
4. Close the tracking issue once the deploy succeeds.

---

## Quick-reference checklist

```
[ ] git fetch --tags upstream
[ ] Identify LAST_TAG (latest production_vYYYYMMDD_N)
[ ] Compute NEW_TAG (next suffix for today)
[ ] Review PR list: gh pr list --repo deriv-com/p2p-v0 --base main --state merged --search "merged:>LAST_TAG_TS"
[ ] Extract fixed issue numbers from PR bodies (Closes/Fixes #X)
[ ] Add any extra issue numbers manually (EXTRA_ISSUE_NUMS)
[ ] Coordinate with team: freeze new merges to main during regression window
[ ] gh issue create --repo deriv-com/p2p-v0 "[TAG] P2P Production - NEW_TAG" — note TRACKING_ISSUE_NUM
[ ] gh release create NEW_TAG --repo deriv-com/p2p-v0 --draft --title "..." --notes "..." --target main
[ ] Share tracking issue URL + draft release URL with QA team
[ ] QA signs off → push tag, publish release, close issue
```

---

## Common pitfalls

| Problem | Fix |
|---|---|
| `build-and-deploy-prod.yml` fired before regression passed | Tag was pushed to remote too early. You cannot un-fire the workflow — let the deploy complete, then assess whether to roll back. |
| Fixed issues list is empty | PR bodies may not use standard `Closes/Fixes` wording. Check PR bodies manually: `gh pr view NUMBER --repo deriv-com/p2p-v0 --json body -q '.body'`. Add missing numbers via `EXTRA_ISSUE_NUMS`. |
| `gh issue create` fails with "label not found" | Remove `--label` from the command (labels are optional). Add them via the GitHub UI after creation. |
| PR list is empty | The `merged:>DATE` filter date may be wrong. Cross-check: `git log --oneline ${LAST_TAG}..HEAD`. |
| Draft release tag name conflicts with existing draft | Delete the old draft first: `gh release delete NEW_TAG --repo deriv-com/p2p-v0 --yes`. |
| `jq` not installed | `brew install jq` or `apt install jq`. |
| Tag format incorrect | Ensure the tag follows the `production_vYYYYMMDD_N` format (with `v`) so `build-and-deploy-prod.yml` triggers upon pushing. |
