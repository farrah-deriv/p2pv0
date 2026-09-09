#!/usr/bin/env python3
"""
Sync a web locale JSON from mobile ARB translations.

Match rule: for each leaf key in web en.json, if the English string equals a
mobile app_en.arb string, copy the mobile locale string when allowed by mode.

Modes:
  mobile-first (ar): overwrite web translation whenever mobile has a match.
  web-first (default, e.g. bn): keep existing web translations; mobile only
    fills missing keys and keys still identical to English (untranslated).

Usage (from p2p-v0/):
  python3 scripts/sync_locale_from_mobile.py ar --mode mobile-first
  python3 scripts/sync_locale_from_mobile.py bn
  python3 scripts/sync_locale_from_mobile.py bn --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_L10N_CANDIDATES = (
    REPO_ROOT.parent / "p2p" / "ai-deriv-p2p-app-languages" / "lib" / "l10n",
    REPO_ROOT.parent / "p2p" / "ai-deriv-p2p-app" / "lib" / "l10n",
)
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"


def resolve_mobile_l10n() -> Path | None:
    for path in MOBILE_L10N_CANDIDATES:
        if (path / "app_en.arb").is_file():
            return path
    return None

MOBILE_FIRST_LOCALES = frozenset({"ar"})


def validate_mobile_l10n() -> int:
    if resolve_mobile_l10n() is None:
        print("Error: Mobile l10n directory not found.", file=sys.stderr)
        print(
            "Ensure ai-deriv-p2p-app-languages or ai-deriv-p2p-app is cloned as a sibling to p2p-v0.",
            file=sys.stderr,
        )
        return 1
    return 0


def flatten(obj: object, prefix: str = "") -> dict[str, object]:
    out: dict[str, object] = {}
    if isinstance(obj, dict):
        for key, val in obj.items():
            out.update(flatten(val, f"{prefix}.{key}" if prefix else key))
    else:
        out[prefix] = obj
    return out


def unflatten(flat: dict[str, object]) -> dict:
    root: dict = {}
    for key, val in sorted(flat.items()):
        parts = key.split(".")
        node = root
        for part in parts[:-1]:
            if part not in node or not isinstance(node[part], dict):
                node[part] = {}
            node = node[part]
        node[parts[-1]] = val
    return root


def load_mobile_arb(path: Path) -> dict[str, str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        k: v
        for k, v in data.items()
        if not k.startswith("@") and k != "@@locale" and isinstance(v, str)
    }


def resolve_mode(locale: str, mode: str | None) -> str:
    if mode is not None:
        return mode
    return "mobile-first" if locale in MOBILE_FIRST_LOCALES else "web-first"


def sync_locale(locale: str, *, mode: str, dry_run: bool) -> int:
    mobile_l10n = resolve_mobile_l10n()
    if mobile_l10n is None:
        return 1
    mob_en_path = mobile_l10n / "app_en.arb"
    mob_loc_path = mobile_l10n / f"app_{locale}.arb"
    web_en_path = WEB_L10N / "en.json"
    web_loc_path = WEB_L10N / f"{locale}.json"

    for path in (mob_en_path, mob_loc_path, web_en_path):
        if not path.is_file():
            print(f"Missing file: {path}", file=sys.stderr)
            return 1

    mob_en = load_mobile_arb(mob_en_path)
    mob_loc = load_mobile_arb(mob_loc_path)
    web_en = flatten(json.loads(web_en_path.read_text(encoding="utf-8")))
    web_loc = (
        flatten(json.loads(web_loc_path.read_text(encoding="utf-8")))
        if web_loc_path.is_file()
        else {}
    )

    en_to_mob: dict[str, str] = {}
    for key, en in mob_en.items():
        if key in mob_loc:
            en_to_mob[en] = mob_loc[key]

    stats: dict[str, int] = {
        "added": 0,
        "added_en_fallback": 0,
        "updated": 0,
        "updated_untranslated": 0,
        "same": 0,
        "kept_web": 0,
        "unchanged_no_mobile": 0,
    }
    new_loc = dict(web_loc)

    for wk, en in web_en.items():
        if not isinstance(en, str):
            continue
        mob_val = en_to_mob.get(en)
        current = new_loc.get(wk)

        if mode == "mobile-first":
            if mob_val is None:
                stats["unchanged_no_mobile"] += 1
                if wk not in new_loc:
                    new_loc[wk] = en
                    stats["added_en_fallback"] += 1
                continue
            if wk not in new_loc:
                new_loc[wk] = mob_val
                stats["added"] += 1
            elif new_loc[wk] == mob_val:
                stats["same"] += 1
            else:
                new_loc[wk] = mob_val
                stats["updated"] += 1
            continue

        # web-first
        if wk not in new_loc:
            if mob_val is not None:
                new_loc[wk] = mob_val
                stats["added"] += 1
            else:
                new_loc[wk] = en
                stats["added_en_fallback"] += 1
            continue

        if mob_val is None:
            stats["unchanged_no_mobile"] += 1
            stats["kept_web"] += 1
            continue

        if current == "" or current == en:
            if current == mob_val:
                stats["same"] += 1
            else:
                new_loc[wk] = mob_val
                stats["updated_untranslated"] += 1
        elif current == mob_val:
            stats["same"] += 1
        else:
            stats["kept_web"] += 1

    for wk in web_en:
        if wk not in new_loc and isinstance(web_en[wk], str):
            en = web_en[wk]
            new_loc[wk] = en_to_mob.get(en, en)

    missing = sorted(set(web_en) - set(new_loc))
    print(f"locale={locale} mode={mode} stats={stats} missing_after={len(missing)}")

    if dry_run:
        print("(dry-run, not writing)")
        return 0

    nested = unflatten(new_loc)
    web_loc_path.write_text(
        json.dumps(nested, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {web_loc_path}")
    return 0


def main() -> int:
    if validate_mobile_l10n() != 0:
        return 1

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("locale", help="Web/mobile locale code (e.g. ar, bn)")
    parser.add_argument(
        "--mode",
        choices=("mobile-first", "web-first"),
        default=None,
        help="Sync strategy (default: mobile-first for ar, web-first otherwise)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    mode = resolve_mode(args.locale, args.mode)
    return sync_locale(args.locale, mode=mode, dry_run=args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
