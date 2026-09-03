#!/usr/bin/env python3
"""Spot-fix remaining untranslated i18n keys."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"

HERO_LOGO_ALT: dict[str, str] = {
    "ar": "شعار Deriv P2P",
    "bn": "Deriv P2P লোগো",
    "de": "Deriv P2P-Logo",
    "es": "Logotipo de Deriv P2P",
    "fr": "Logo Deriv P2P",
    "it": "Logo Deriv P2P",
    "ko": "Deriv P2P 로고",
    "mn": "Deriv P2P лого",
    "pl": "Logo Deriv P2P",
    "pt": "Logotipo Deriv P2P",
    "ru": "Логотип Deriv P2P",
    "si": "Deriv P2P ලාංඡනය",
    "sw": "Nembo ya Deriv P2P",
    "ta": "Deriv P2P лого",
    "vi": "Logo Deriv P2P",
    "zh": "Deriv P2P 标志",
    "zh_TW": "Deriv P2P 標誌",
}

SPOT: dict[str, dict[str, str]] = {
    "si": {
        "adForm.fixedRateOutOfRange": "වත්මන් වෙළඳපොළ අනුපාතයට ආසන්න අනුපාතයක් ඇතුළත් කරන්න.",
        "adForm.reviewAd": "දැන්වීම සමාලෝචනය කරන්න",
        "adForm.reviewAdSubtitle": "ඉදිරියට යාමට පෙර මෙම විස්තර තහවුරු කරන්න.",
        "adForm.reviewAdChanged": "වෙනස් කළ",
        "adForm.reviewAdType": "දැන්වීම් වර්ගය",
        "common.thumbsDown": "අත指 පහළ",
        "learnPage.termEscrowTitle": "එස්ක්‍රෝ",
    },
    "ta": {
        "common.thumbsDown": "கைப்பொறி கீழ்",
        "learnPage.termEscrowTitle": "எஸ்க்ரோ",
    },
    "sw": {
        "learnPage.termEscrowTitle": "Escrow ya fedha",
        "common.plus": "Kuongeza",
    },
    "es": {
        "profile.daysHours": "{days} d {hours} h",
        "profile.daysOnly": "{days} d",
        "profile.hoursOnly": "{hours} h",
        "market.min": "mín",
    },
    "pt": {
        "profile.daysHours": "{days} d {hours} h",
        "profile.daysOnly": "{days} d",
        "profile.hoursOnly": "{hours} h",
        "market.min": "mín",
    },
    "pl": {
        "profile.daysOnly": "{days} d",
        "market.min": "min.",
    },
    "it": {
        "profile.hoursOnly": "{hours} h",
        "market.min": "min.",
    },
    "fr": {
        "market.min": "min.",
    },
    "de": {
        "wallet.transferRouteWalletOnly": "Geldbörse → Geldbörse",
    },
    "vi": {
        "login.email": "E-mail",
        "login.loginWithEmail": "E-mail",
    },
}


def set_nested(root: dict, path: str, value: str) -> None:
    parts = path.split(".")
    node = root
    for part in parts[:-1]:
        if part not in node or not isinstance(node[part], dict):
            node[part] = {}
        node = node[part]
    node[parts[-1]] = value


def main() -> int:
    for locale, alt in HERO_LOGO_ALT.items():
        SPOT.setdefault(locale, {})["kyc.heroLogoAlt"] = alt

    for locale, fixes in SPOT.items():
        path = WEB_L10N / f"{locale}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for key, value in fixes.items():
            set_nested(data, key, value)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{locale}: {len(fixes)} spot fixes")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
