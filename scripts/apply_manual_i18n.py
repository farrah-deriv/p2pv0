#!/usr/bin/env python3
"""Apply MANUAL translations from i18n_manual_translations.py to locale JSON files."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"
MANUAL_MODULE = REPO_ROOT / "scripts" / "i18n_manual_translations.py"

LOCALES = [
    "ar", "bn", "de", "es", "fr", "it", "ko", "mn", "pl", "pt", "ru", "si", "sw", "ta", "vi", "zh", "zh_TW",
]


def load_manual() -> dict[str, dict[str, str]]:
    spec = importlib.util.spec_from_file_location("i18n_manual_translations", MANUAL_MODULE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MANUAL_MODULE}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.MANUAL


def set_nested(root: dict, path: str, value: str) -> None:
    parts = path.split(".")
    node = root
    for part in parts[:-1]:
        if part not in node or not isinstance(node[part], dict):
            node[part] = {}
        node = node[part]
    node[parts[-1]] = value


def apply_locale(locale: str, translations: dict[str, str]) -> int:
    path = WEB_L10N / f"{locale}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    applied = 0
    for dotted_key, value in translations.items():
        set_nested(data, dotted_key, value)
        applied += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return applied


def main() -> int:
    if not MANUAL_MODULE.is_file():
        print(f"Missing {MANUAL_MODULE}", file=sys.stderr)
        return 1

    manual = load_manual()
    for locale in LOCALES:
        if locale not in manual:
            print(f"Missing locale {locale} in MANUAL", file=sys.stderr)
            return 1
        count = apply_locale(locale, manual[locale])
        print(f"{locale}: applied {count} keys")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
