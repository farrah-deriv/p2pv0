#!/usr/bin/env bash
# duplicate_guard.sh — decide whether a Slack thread has already been picked up.
#
# Usage: duplicate_guard.sh <pr-hits-file> <issue-hits-file> [resumed-issue-number]
#
# Input files hold exact slack-thread anchor matches, one number per line.
#
# An *open PR* is the live PR for this thread. One hit means CONTINUE on that
# PR in place — leftover issues for the same thread are expected (the PR's
# Closes #N). Two or more open PRs is a real collision and still blocks.
# Closed PRs never appear here — the workflow lists `--state open` only.
#
# A leftover *issue* with no open PR is a duplicate: a second run would file
# another issue for the same thread.
#
# Exit 0, no output: no duplicate, proceed (fresh thread).
# Exit 0, prints "CONTINUE: pr=<N>": one open PR already owns this thread.
# Exit 1, prints "DUPLICATE: pr=<...> issue=<...>": already picked up in a
#         way we cannot continue (leftover issue and no PR, or multiple open PRs).

set -euo pipefail

PR_HITS_FILE="${1:?usage: duplicate_guard.sh <pr-hits-file> <issue-hits-file> [resumed-issue-number]}"
ISSUE_HITS_FILE="${2:?usage: duplicate_guard.sh <pr-hits-file> <issue-hits-file> [resumed-issue-number]}"
RESUMED_ISSUE="${3:-}"

# Collapse newlines to spaces and trim. Do not use xargs — it fails in
# restricted environments (`sysconf(_SC_ARG_MAX)`) and on empty input.
trim_hits() {
  tr -s '[:space:]' ' ' < "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

PR_HITS=$(trim_hits "$PR_HITS_FILE")
if [ -n "$RESUMED_ISSUE" ]; then
  ISSUE_HITS=$(grep -vxF "$RESUMED_ISSUE" "$ISSUE_HITS_FILE" 2>/dev/null | tr -s '[:space:]' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true)
else
  ISSUE_HITS=$(trim_hits "$ISSUE_HITS_FILE")
fi

# Word-split the PR list. Empty → 0; "3151" → 1; "3126 3148" → 2.
# shellcheck disable=SC2086
set -- $PR_HITS
PR_COUNT=$#

if [ "$PR_COUNT" -gt 1 ]; then
  echo "DUPLICATE: pr=[$PR_HITS] issue=[$ISSUE_HITS]"
  exit 1
fi

if [ "$PR_COUNT" -eq 1 ]; then
  echo "CONTINUE: pr=$1"
  exit 0
fi

if [ -n "$ISSUE_HITS" ]; then
  echo "DUPLICATE: pr=[] issue=[$ISSUE_HITS]"
  exit 1
fi

exit 0
