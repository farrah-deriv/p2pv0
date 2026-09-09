#!/usr/bin/env python3
"""
Apply wallet/profile strings that have no mobile EN match for sync_locale_from_mobile.

- profile.closedGroupEmptyTitle: from mobile p2pFollowingEmptyTitle
- profile.closedGroupEmptyDescription, wallet.estTotalAssetsTooltip: curated per locale
- wallet.transferRoute*: built from wallet.p2pWallet label word order

Usage (from p2p-v0/):
  python3 scripts/apply_wallet_profile_i18n.py
  python3 scripts/apply_wallet_profile_i18n.py --dry-run
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

LOCALES = [
    "es",
    "it",
    "pt",
    "fr",
    "ru",
    "vi",
    "de",
    "bn",
    "pl",
    "ko",
    "sw",
    "ar",
    "mn",
    "si",
    "ta",
    "zh",
    "zh_TW",
]

# profile.closedGroupEmptyDescription
CLOSED_GROUP_EMPTY_DESC: dict[str, str] = {
    "es": "Solo puedes añadir a tu grupo cerrado a los usuarios a los que sigues. Ve al perfil de un usuario y pulsa Seguir para verlo aquí.",
    "it": "Puoi aggiungere al tuo gruppo chiuso solo gli utenti che segui. Vai al profilo di un utente e tocca Segui per vederlo qui.",
    "pt": "Você só pode adicionar ao seu grupo fechado usuários que você segue. Acesse o perfil de um usuário e toque em Seguir para vê-lo aqui.",
    "fr": "Vous ne pouvez ajouter à votre groupe fermé que les utilisateurs que vous suivez. Rendez-vous sur le profil d'un utilisateur et appuyez sur Suivre pour le voir ici.",
    "ru": "В закрытую группу можно добавлять только пользователей, на которых вы подписаны. Перейдите в профиль пользователя и нажмите «Подписаться», чтобы увидеть его здесь.",
    "vi": "Bạn chỉ có thể thêm những người dùng mà bạn theo dõi vào nhóm đóng của mình. Vào hồ sơ người dùng và nhấn Theo dõi để thấy họ ở đây.",
    "de": "Sie können Ihrer geschlossenen Gruppe nur Benutzer hinzufügen, denen Sie folgen. Gehen Sie zum Profil eines Benutzers und tippen Sie auf Folgen, um ihn hier zu sehen.",
    "bn": "আপনি শুধুমাত্র আপনার অনুসরণ করা ব্যবহারকারীদের আপনার বন্ধ গ্রুপে যোগ করতে পারেন। এখানে দেখতে কোনো ব্যবহারকারীর প্রোফাইলে গিয়ে অনুসরণ ট্যাপ করুন।",
    "pl": "Do zamkniętej grupy możesz dodać tylko użytkowników, których obserwujesz. Przejdź do profilu użytkownika i naciśnij Obserwuj, aby zobaczyć go tutaj.",
    "ko": "팔로우한 사용자만 비공개 그룹에 추가할 수 있습니다. 사용자 프로필로 이동해 팔로우를 누르면 여기에 표시됩니다.",
    "sw": "Unaweza kuongeza kwenye kikundi chako kilichofungwa watumiaji unaowafuata tu. Nenda kwenye wasifu wa mtumiaji na gusa Fuata ili uwaone hapa.",
    "ar": "يمكنك إضافة المستخدمين الذين تتابعهم فقط إلى مجموعتك المغلقة. انتقل إلى ملف المستخدم واضغط متابعة لرؤيته هنا.",
    "mn": "Та зөвхөн дагаж буй хэрэглэгчдийг хаалттай бүлэгтээ нэмж болно. Энд харахын тулд хэрэглэгчийн профайл руу орж Дагах дээр дарна уу.",
    "si": "ඔබට අනුගමනය කරන පරිශීලකයින් පමණක් ඔබේ වසන් කණ්ඩායමට එක් කළ හැක. මෙහි දැකගැනීමට පරිශීලක පැතිකඩට ගොස් අනුගමනය තට්ටු කරන්න.",
    "ta": "நீங்கள் பின்தொடரும் பயனர்களை மட்டுமே உங்கள் மூடிய குழுவில் சேர்க்க முடியும். இங்கே பார்க்க, பயனர் சுயவிவரத்திற்குச் சென்று பின்தொடர் என்பதைத் தட்டவும்.",
    "zh": "您只能将已关注的用户添加到封闭群组。请前往用户资料并点击关注，即可在此处看到对方。",
    "zh_TW": "您只能將已關注的使用者新增至封閉群組。請前往使用者個人檔案並點選關注，即可在此處看到對方。",
}

# wallet.estTotalAssetsTooltip
EST_TOTAL_ASSETS_TOOLTIP: dict[str, str] = {
    "es": "Este es su saldo combinado estimado en todas las billeteras P2P, mostrado en USD.",
    "it": "Questo è il saldo combinato stimato su tutti i portafogli P2P, mostrato in USD.",
    "pt": "Este é o seu saldo combinado estimado em todas as carteiras P2P, exibido em USD.",
    "fr": "Il s'agit de votre solde combiné estimé sur tous les portefeuilles P2P, affiché en USD.",
    "ru": "Это ваша ориентировочная совокупная сумма по всем P2P-кошелькам, отображаемая в USD.",
    "vi": "Đây là số dư ước tính tổng hợp trên tất cả ví P2P của bạn, hiển thị bằng USD.",
    "de": "Dies ist Ihr geschätztes Gesamtguthaben über alle P2P-Wallets, angezeigt in USD.",
    "bn": "এটি সমস্ত P2P ওয়ালেট জুড়ে আপনার আনুমানিক সম্মিলিত ব্যালেন্স, USD-তে দেখানো হয়েছে।",
    "pl": "To jest szacowane łączne saldo we wszystkich portfelach P2P, wyświetlane w USD.",
    "ko": "모든 P2P 지갑에 걸친 예상 합산 잔액이며 USD로 표시됩니다.",
    "sw": "Hii ni salio lako la makadirio lililounganishwa katika pochi zote za P2P, linaonyeshwa kwa USD.",
    "ar": "هذا هو رصيدك التقديري المجمع عبر جميع محافظ P2P، معروضًا بالدولار الأمريكي.",
    "mn": "Энэ бол бүх P2P түрийвчүүдийн нийт тооцоолсон үлдэгдэл бөгөөд USD-ээр харуулна.",
    "si": "මෙය සියලු P2P පසුම්බි වලින් ඔබේ ඇස්තමේන්තුගත සංයුක්ත ශේෂය වන අතර USD වලින් පෙන්වයි.",
    "ta": "இது அனைத்து P2P பணப்பைகளிலும் உங்கள் மதிப்பிடப்பட்ட ஒருங்கிணைந்த இருப்பு, USD-இல் காட்டப்படுகிறது.",
    "zh": "这是您所有 P2P 钱包的预估合并余额，以美元显示。",
    "zh_TW": "這是您所有 P2P 錢包的預估合併餘額，以美元顯示。",
}

# p2pWallet stays "P2P-Wallet" / "{currency} Wallet" in EN shape — override routes.
TRANSFER_ROUTE_OVERRIDES: dict[str, dict[str, str]] = {
    "de": {
        "transferRouteP2pToWallet": "P2P {currency} → {currency}-Wallet",
        "transferRouteWalletToP2p": "{currency}-Wallet → P2P {currency}",
        "transferRouteP2pToP2p": "P2P {currency} → P2P {currency}",
        "transferRouteWalletOnly": "{currency}-Wallet",
    },
}


def load_mobile_arb(path: Path) -> dict[str, str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        k: v
        for k, v in data.items()
        if not k.startswith("@") and k != "@@locale" and isinstance(v, str)
    }


def extract_wallet_word(p2p_wallet: str) -> tuple[str, bool]:
    """Return (wallet word, currency_before_word)."""
    s = p2p_wallet.strip()
    for pattern in (r"^P2P[\s\-]+(.+)$", r"^p2p[\s\-]+(.+)$"):
        m = re.match(pattern, s, re.IGNORECASE)
        if m:
            return m.group(1).strip(), True
    for sep in (" P2P", " p2p"):
        if sep in s:
            return s.split(sep, 1)[0].strip(), False
    return s, False


def transfer_route_strings(p2p_wallet: str) -> dict[str, str]:
    word, currency_first = extract_wallet_word(p2p_wallet)
    if currency_first:
        wallet_fmt = "{currency} " + word
    else:
        wallet_fmt = word + " {currency}"
    arrow = " → "
    return {
        "transferRouteP2pToWallet": f"P2P {{currency}}{arrow}{wallet_fmt}",
        "transferRouteWalletToP2p": f"{wallet_fmt}{arrow}P2P {{currency}}",
        "transferRouteP2pToP2p": f"P2P {{currency}}{arrow}P2P {{currency}}",
        "transferRouteWalletOnly": wallet_fmt,
    }


def apply_locale(locale: str, *, dry_run: bool) -> list[str]:
    web_path = WEB_L10N / f"{locale}.json"
    mob_path = MOBILE_L10N / f"app_{locale}.arb"
    if not web_path.is_file():
        return []

    web = json.loads(web_path.read_text(encoding="utf-8"))
    changes: list[str] = []

    profile = web.setdefault("profile", {})
    wallet = web.setdefault("wallet", {})

    if mob_path.is_file():
        mob = load_mobile_arb(mob_path)
        title = mob.get("p2pFollowingEmptyTitle")
        if title and profile.get("closedGroupEmptyTitle") != title:
            profile["closedGroupEmptyTitle"] = title
            changes.append("profile.closedGroupEmptyTitle")

    desc = CLOSED_GROUP_EMPTY_DESC.get(locale)
    if desc and profile.get("closedGroupEmptyDescription") != desc:
        profile["closedGroupEmptyDescription"] = desc
        changes.append("profile.closedGroupEmptyDescription")

    tooltip = EST_TOTAL_ASSETS_TOOLTIP.get(locale)
    if tooltip and wallet.get("estTotalAssetsTooltip") != tooltip:
        wallet["estTotalAssetsTooltip"] = tooltip
        changes.append("wallet.estTotalAssetsTooltip")

    p2p_wallet = wallet.get("p2pWallet") or "P2P Wallet"
    routes = TRANSFER_ROUTE_OVERRIDES.get(locale) or transfer_route_strings(
        str(p2p_wallet)
    )
    for key, value in routes.items():
        if wallet.get(key) != value:
            wallet[key] = value
            changes.append(f"wallet.{key}")

    if changes and not dry_run:
        web_path.write_text(
            json.dumps(web, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    total = 0
    for locale in LOCALES:
        changes = apply_locale(locale, dry_run=args.dry_run)
        if changes:
            prefix = "[dry-run] " if args.dry_run else ""
            print(f"{prefix}{locale}: {', '.join(changes)}")
            total += len(changes)

    print(f"done: {total} key updates across locales", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
