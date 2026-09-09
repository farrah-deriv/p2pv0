#!/usr/bin/env python3
"""
Copy adForm RTL strings from mobile ARB into web locale JSON.

Maps mobile keys directly (English-string sync misses currentMarketPrice
because mobile uses placeholders).

Usage (from p2p-v0/):
  python3 scripts/sync_adform_new_keys_from_mobile.py
  python3 scripts/sync_adform_new_keys_from_mobile.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_L10N = REPO_ROOT.parent / "p2p" / "ai-deriv-p2p-app" / "lib" / "l10n"
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"

MOBILE_TO_ADFORM: dict[str, str] = {
    "rateTypeFixed": "fixed",
    "rateTypeFloating": "floating",
    "createAdRateFixed": "rateFixedTitle",
    "createAdYourRate": "yourRate",
    "createAdLowestRateInMarket": "lowestRateInMarket",
    "createAdHighestRateInMarket": "highestRateInMarket",
    "countriesSelectionSubtitle": "countrySelectionSubtitle",
}


def load_mobile_arb(path: Path) -> dict[str, str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        k: v
        for k, v in data.items()
        if not k.startswith("@") and k != "@@locale" and isinstance(v, str)
    }


def market_price_label(mobile_value: str) -> str:
    """Mobile: 'Current market price: {price} {currency}' → web label before value."""
    if "{price}" in mobile_value:
        return mobile_value.split("{price}", 1)[0].rstrip()
    return mobile_value.rstrip()


def sync_locale(locale: str, *, dry_run: bool) -> int:
    mob_path = MOBILE_L10N / f"app_{locale}.arb"
    web_path = WEB_L10N / f"{locale}.json"

    if not mob_path.is_file():
        print(f"skip {locale}: missing {mob_path.name}", file=sys.stderr)
        return 0
    if not web_path.is_file():
        print(f"skip {locale}: missing {web_path.name}", file=sys.stderr)
        return 0

    mob = load_mobile_arb(mob_path)
    web = json.loads(web_path.read_text(encoding="utf-8"))
    ad_form = web.setdefault("adForm", {})

    changes: list[str] = []
    for mob_key, web_key in MOBILE_TO_ADFORM.items():
        if mob_key not in mob:
            print(f"warn {locale}: missing mobile key {mob_key}", file=sys.stderr)
            continue
        if ad_form.get(web_key) != mob[mob_key]:
            ad_form[web_key] = mob[mob_key]
            changes.append(web_key)

    if "createAdCurrentMarketPrice" in mob:
        label = market_price_label(mob["createAdCurrentMarketPrice"])
        if ad_form.get("currentMarketPrice") != label:
            ad_form["currentMarketPrice"] = label
            changes.append("currentMarketPrice")

    if not changes:
        print(f"{locale}: up to date")
        return 0

    print(f"{locale}: updated {', '.join(changes)}")
    if dry_run:
        return 0

    web_path.write_text(json.dumps(web, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "locales",
        nargs="*",
        help="Locale codes (default: all app_*.arb except en)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.locales:
        locales = args.locales
    else:
        locales = sorted(
            p.name.replace("app_", "").replace(".arb", "")
            for p in MOBILE_L10N.glob("app_*.arb")
            if p.name != "app_en.arb"
        )

    code = 0
    for locale in locales:
        code |= sync_locale(locale, dry_run=args.dry_run)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
