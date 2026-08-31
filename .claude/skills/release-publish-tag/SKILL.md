---
name: release-publish-tag
description: "Run after QA signs off on regression: push the production tag, publish the draft GitHub Release, close the tracking issue, monitor the deploy, then create a post-release sanity checklist issue linked to the tracking issue."
---

# Release Publish Tag (P2P)

> **Prerequisites:** QA has signed off on all items in the regression tracking issue. You need the exact `NEW_TAG` (format `production_vYYYYMMDD_N`) and `TRACKING_ISSUE_NUM` from the `release-prepare-tag` skill.

---

## Step 1 — Set variables

```bash
NEW_TAG="production_v<DATE>_<N>"   # ← paste the exact tag name from release-prepare-tag Step 2
TRACKING_ISSUE_NUM=NNNN            # ← paste the issue number from release-prepare-tag Step 7
```

---

## Step 2 — Push the tag and publish the release

```bash
# Push the tag to remote — triggers build-and-deploy-prod.yml and deploys to Cloudflare Pages Production
if git tag -l "$NEW_TAG" | grep -q .; then
  echo "Note: tag $NEW_TAG already exists locally — skipping tag creation, pushing existing."
else
  git tag "$NEW_TAG"
fi
git push upstream "$NEW_TAG" || git push origin "$NEW_TAG"

# Publish the draft release
gh release edit "$NEW_TAG" --repo deriv-com/p2p-v0 --draft=false

echo "Tag pushed. Monitoring release workflow..."
COMMIT_SHA=$(git rev-list -n1 "$NEW_TAG")
for i in 1 2 3 4 5; do
  RUN_ID=$(gh run list --repo deriv-com/p2p-v0 --workflow=build-and-deploy-prod.yml --commit "$COMMIT_SHA" \
    --limit 1 --json databaseId -q '.[0].databaseId')
  [ -n "$RUN_ID" ] && break
  echo "Waiting for build-and-deploy-prod.yml run to appear ($i/5)..."
  sleep 15
done
if [ -z "$RUN_ID" ]; then
  echo "Warning: Could not find build-and-deploy-prod.yml run — monitor manually at https://github.com/deriv-com/p2p-v0/actions/workflows/build-and-deploy-prod.yml"
  echo "Verify deploy completed successfully before closing tracking issue #${TRACKING_ISSUE_NUM}."
elif gh run watch "$RUN_ID" --repo deriv-com/p2p-v0; then
  # Close the tracking issue on successful deploy
  if [ "$(gh issue view "$TRACKING_ISSUE_NUM" --repo deriv-com/p2p-v0 --json state -q '.state')" = "OPEN" ]; then
    gh issue close "$TRACKING_ISSUE_NUM" \
      --repo deriv-com/p2p-v0 \
      --comment "Regression passed. Tag \`${NEW_TAG}\` pushed and production deploy completed successfully."
  else
    echo "Tracking issue #$TRACKING_ISSUE_NUM already closed."
  fi
else
  echo "ERROR: Deploy workflow failed — tracking issue #${TRACKING_ISSUE_NUM} left open. Investigate before closing."
  exit 1
fi
```

After this:
- `build-and-deploy-prod.yml` builds and deploys to Cloudflare Pages production
- The GitHub Release is published with all cross-links intact
- The tracking issue is closed
- `/app-info.json` and Datadog RUM reflect `${NEW_TAG}`

---

## Step 3 — Create the post-release sanity issue

> **Run this only after `build-and-deploy-prod.yml` completes successfully and the production deploy is confirmed.**

```bash
# ── (Continues from Step 2 — NEW_TAG and TRACKING_ISSUE_NUM must still be set) ──
if [ -z "$TRACKING_ISSUE_NUM" ] || [ -z "$NEW_TAG" ]; then
  echo "Error: NEW_TAG and TRACKING_ISSUE_NUM must be set (from Step 1). Re-run Step 1 first."
else

# ── Load post-release checklist from template or default P2P checklist ─────
POST_TEMPLATE="$(git rev-parse --show-toplevel)/.github/ISSUE_TEMPLATE/post-release-checklist.md"
if [ -f "$POST_TEMPLATE" ]; then
  POST_CHECKLIST=$(awk '/^---$/{n++; if(n==2){found=1; next}} found' "$POST_TEMPLATE" | sed '/./,$!d')
else
  POST_CHECKLIST="## Post-Release Sanity Checklist (P2P)

> **Objective:** Ensure Deriv P2P is functioning as expected in the production environment after the release.

- [ ] Confirm release tag version on production:
  - [ ] Check \`/app-info.json\` returns correct version \`${NEW_TAG}\`
  - [ ] Verify release announcement sent in the release Slack channel
- [ ] Ensure No New Console Errors:
  - [ ] Navigate through Markets, My Ads, Orders, and Profile
  - [ ] Check browser console for errors or uncaught exceptions
- [ ] Core Flow Sanity Checks:
  - [ ] **Markets:** Verify ad list rendering, buy/sell toggles, filters, floating rates
  - [ ] **My Ads:** Verify active ads status, rate updates
  - [ ] **Orders:** Verify active orders list, order details page navigation
  - [ ] **Wallets & Transfers:** Verify balance display, transfer modal
  - [ ] **Payment Methods:** Verify payment methods list displays correctly
- [ ] Telemetry & Monitoring:
  - [ ] Check Datadog RUM for version tag \`${NEW_TAG}\` and error rates
- [ ] Post Release Concluded — confirm all checks above are completed and release is stable."
fi

POST_ISSUE_BODY="${POST_CHECKLIST}

---

**Release:** \`${NEW_TAG}\`
**Regression tracking issue:** #${TRACKING_ISSUE_NUM}"

# ── Create the post-release issue ─────────────────────────────────────────
POST_ISSUE_URL=$(gh issue create \
  --repo deriv-com/p2p-v0 \
  --title "[POST-RELEASE] P2P Production - ${NEW_TAG}" \
  --body "$POST_ISSUE_BODY")

if [ -z "$POST_ISSUE_URL" ]; then
  echo "Warning: Failed to create post-release issue — create it manually, then link as sub-issue."
else
  echo ""
  echo "Post-release issue created: $POST_ISSUE_URL"
  POST_ISSUE_NUM=$(echo "$POST_ISSUE_URL" | grep -oE '[0-9]+$')

  # ── Link as sub-issue to the regression tracking issue ──────────────────
  POST_ISSUE_DB_ID=$(gh api repos/deriv-com/p2p-v0/issues/"$POST_ISSUE_NUM" --jq '.id' 2>/tmp/gh_api_err)
  if [ -z "$POST_ISSUE_DB_ID" ]; then
    echo "Note: Could not resolve database id for #${POST_ISSUE_NUM} ($(cat /tmp/gh_api_err)) — link as sub-issue manually."
  else
    gh api repos/deriv-com/p2p-v0/issues/"$TRACKING_ISSUE_NUM"/sub_issues \
      --method POST \
      -F sub_issue_id="$POST_ISSUE_DB_ID" \
      && echo "Linked #${POST_ISSUE_NUM} as sub-issue of #${TRACKING_ISSUE_NUM}." \
      || echo "Note: Could not auto-link as sub-issue — add it manually via the GitHub UI."
  fi
fi
fi
```

---

## Quick-reference checklist

```
[ ] Set NEW_TAG and TRACKING_ISSUE_NUM
[ ] git tag NEW_TAG && git push upstream NEW_TAG   ← triggers build-and-deploy-prod.yml
[ ] gh release edit NEW_TAG --repo deriv-com/p2p-v0 --draft=false  ← publish
[ ] Monitor gh run watch (build-and-deploy-prod.yml) to completion
[ ] gh issue close TRACKING_ISSUE_NUM --repo deriv-com/p2p-v0
[ ] Smoke-test on production (/app-info.json, console errors, core flows)
[ ] Run Step 3 — create post-release sanity issue, link to tracker
```

---

## Common pitfalls

| Problem | Fix |
|---|---|
| `build-and-deploy-prod.yml` fired before regression passed | Tag was pushed too early. Let the deploy complete, then assess whether to roll back. |
| Draft release tag name conflicts with existing draft | Delete the old draft first: `gh release delete NEW_TAG --repo deriv-com/p2p-v0 --yes`. |
| Regression found after tag push | Fix forward (new PR → new tag) or re-tag a known-good commit. Never delete or force-push a production tag. |
| Sub-issue link fails | Use the GitHub UI: open the tracking issue → Sub-issues → Add sub-issue → paste the post-release issue number. |
| Tag format not triggering deploy | Ensure the tag starts with `production_v` so the tag pattern in `build-and-deploy-prod.yml` matches. |
