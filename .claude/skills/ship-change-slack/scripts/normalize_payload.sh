#!/usr/bin/env bash
# normalize_payload.sh — validate and normalize the direct-fix trigger payload.
#
# Usage: normalize_payload.sh <raw-json-file>
#
# Both workflow_dispatch inputs and repository_dispatch client_payload collapse to
# the same flat shape: bug_text, reporter_slack_id, slack_thread_ts, scope_hint,
# and resume_issue_number. The last three fields are optional.
#
# On success: prints the normalized JSON object to stdout, exits 0.
# On failure: prints a named ERROR to stderr, exits 1.
# No minimum length is enforced on bug_text — a terse report is valid input.

set -euo pipefail

RAW_FILE="${1:?usage: normalize_payload.sh <raw-json-file>}"

if [ ! -s "$RAW_FILE" ] || ! jq empty "$RAW_FILE" 2>/dev/null; then
  echo "ERROR: missing required field: bug_text (payload empty or not valid JSON)" >&2
  exit 1
fi

BUG_TEXT=$(jq -r '.bug_text // ""' "$RAW_FILE")
REPORTER_SLACK_ID=$(jq -r '.reporter_slack_id // ""' "$RAW_FILE")
SLACK_THREAD_TS=$(jq -r '.slack_thread_ts // ""' "$RAW_FILE")
SCOPE_HINT=$(jq -r '.scope_hint // ""' "$RAW_FILE")

if [ -z "$BUG_TEXT" ]; then
  echo "ERROR: missing required field: bug_text" >&2
  exit 1
fi

if [ -z "$REPORTER_SLACK_ID" ]; then
  echo "ERROR: missing required field: reporter_slack_id" >&2
  exit 1
fi

# Accept both the string form (workflow_dispatch inputs are always strings) and
# the number form (repository_dispatch client_payload preserves JSON types).
RESUME_TYPE=$(jq -r 'if has("resume_issue_number") and .resume_issue_number != null then (.resume_issue_number | type) else "missing" end' "$RAW_FILE")
case "$RESUME_TYPE" in
  missing)
    RESUME_ISSUE_NUMBER=""
    ;;
  string)
    RESUME_ISSUE_NUMBER=$(jq -r '.resume_issue_number' "$RAW_FILE")
    if [ -n "$RESUME_ISSUE_NUMBER" ]; then
      if ! printf '%s' "$RESUME_ISSUE_NUMBER" | grep -Eq '^[0-9]+$'; then
        echo "ERROR: invalid optional field: resume_issue_number (expected a positive integer)" >&2
        exit 1
      fi
      RESUME_ISSUE_NUMBER=$(printf '%s' "$RESUME_ISSUE_NUMBER" | sed -E 's/^0+//')
      if [ -z "$RESUME_ISSUE_NUMBER" ]; then
        echo "ERROR: invalid optional field: resume_issue_number (expected a positive integer)" >&2
        exit 1
      fi
    fi
    ;;
  number)
    if ! jq -e '.resume_issue_number > 0 and (.resume_issue_number | floor) == .resume_issue_number' "$RAW_FILE" >/dev/null; then
      echo "ERROR: invalid optional field: resume_issue_number (expected a positive integer)" >&2
      exit 1
    fi
    RESUME_ISSUE_NUMBER=$(jq -r '.resume_issue_number | tostring' "$RAW_FILE")
    ;;
  *)
    echo "ERROR: invalid optional field: resume_issue_number (expected a positive integer)" >&2
    exit 1
    ;;
esac

jq -n -c \
  --arg bug_text "$BUG_TEXT" \
  --arg reporter_slack_id "$REPORTER_SLACK_ID" \
  --arg slack_thread_ts "$SLACK_THREAD_TS" \
  --arg scope_hint "$SCOPE_HINT" \
  --arg resume_issue_number "$RESUME_ISSUE_NUMBER" \
  '{bug_text: $bug_text, reporter_slack_id: $reporter_slack_id, slack_thread_ts: $slack_thread_ts, scope_hint: $scope_hint, resume_issue_number: $resume_issue_number}'
