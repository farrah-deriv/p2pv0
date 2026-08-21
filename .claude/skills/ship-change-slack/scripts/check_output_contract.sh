#!/usr/bin/env bash
# check_output_contract.sh — enforce "exactly one of announcement.txt or handback.txt".
#
# Usage: check_output_contract.sh <announcement-file> <handback-file>
#
# A 0-byte file counts as absent — a run that touched the file but wrote nothing to it is
# not a real announcement or hand-back, and treating it as present would let a run report
# an empty success silently.
#
# Exit 0: exactly one is present and non-empty. Prints "OUTCOME: shipped" or
#         "OUTCOME: handback".
# Exit 1: contract violation — both present, or neither present. direct-fix.yml's
#         `if: always()` finalize step repairs that into a hand-back rather than
#         letting a run end with no signal at all, which would leave the reporter
#         waiting forever — the worst available outcome.

set -euo pipefail

ANNOUNCEMENT="${1:?usage: check_output_contract.sh <announcement-file> <handback-file>}"
HANDBACK="${2:?usage: check_output_contract.sh <announcement-file> <handback-file>}"

HAS_ANNOUNCEMENT=false
HAS_HANDBACK=false

[ -s "$ANNOUNCEMENT" ] && HAS_ANNOUNCEMENT=true
[ -s "$HANDBACK" ] && HAS_HANDBACK=true

if [ "$HAS_ANNOUNCEMENT" = true ] && [ "$HAS_HANDBACK" = true ]; then
  echo "ERROR: contract violation — both announcement and handback are present"
  exit 1
fi

if [ "$HAS_ANNOUNCEMENT" = false ] && [ "$HAS_HANDBACK" = false ]; then
  echo "ERROR: contract violation — neither announcement nor handback is present"
  exit 1
fi

if [ "$HAS_ANNOUNCEMENT" = true ]; then
  echo "OUTCOME: shipped"
else
  echo "OUTCOME: handback"
fi
exit 0
