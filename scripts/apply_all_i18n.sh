#!/usr/bin/env bash
# Apply all i18n translation scripts in the correct order.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 scripts/apply_manual_i18n.py
python3 scripts/fill_untranslated_web_keys.py
python3 scripts/apply_new_email_login_translations.py
python3 scripts/apply_i18n_spot_fixes.py
echo "All i18n scripts applied."
