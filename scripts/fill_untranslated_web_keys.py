#!/usr/bin/env python3
"""Fill web locale keys that still match English using mobile ARB + in-file fallbacks.

Skips keys listed in lib/i18n/NON_TRANSLATABLE.md (navigation labels stay English).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_L10N = REPO_ROOT.parent / "p2p" / "ai-deriv-p2p-app-languages" / "lib" / "l10n"
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"

# navigation.* keys — English in every locale (sidebar + mobile footer). See NON_TRANSLATABLE.md.
NON_TRANSLATABLE_KEYS = frozenset({
    "navigation.home",
    "navigation.askAmy",
    "navigation.market",
    "navigation.myAds",
    "navigation.orders",
    "navigation.p2pHelpCentre",
    "navigation.profile",
    "navigation.wallet",
})

LOCALES = [
    "ar", "bn", "de", "es", "fr", "it", "ko", "pl", "pt", "ru", "sw", "vi", "zh", "zh_TW", "ta", "si", "mn",
]

# Web dotted key -> mobile ARB key (English wording differs between platforms).
EXPLICIT_MOBILE: dict[str, str] = {
    "login.didntReceiveCode": "authDidntReceiveCode",
    "login.email": "authEmailLabel",
    "login.logIn": "authLoginButton",
    "login.welcomeBack": "authWelcomeBack",
    "login.resendCode": "authResendCode",
    "login.signUp": "authSignupButton",
    "login.verification": "p2pProfileVerificationSection",
    "login.verify": "profileVerifyButton",
    "login.noAccountYet": "authNoAccount",
    "login.enterSixDigitCode": "authTwoFactorAuthSubtitle",
    "login.failedToLogin": "authErrorGenericMigration",
    "login.loginFailed": "authErrorGenericMigration",
    "login.verificationFailed": "profileInvalidCodeError",
    "login.verifyFailed": "profileInvalidCodeError",
    "login.failedToResendCode": "authErrorGenericMigration",
    "login.failedToResendCodeTryAgain": "authErrorGenericMigration",
    "notifications.title": "notificationsTitle",
    "notifications.error": "errorGeneric",
    "notifications.loadFailed": "profileFailedToLoadProfile",
    "common.continue": "profileContinueButton",
    "common.copy": "manageAdsCopy",
    "common.refresh": "authTotpRefresh",
    "common.closedGroup": "closedGroupTitle",
    "common.warning": "orderErrGenericTitle",
    "common.addPayment": "addPaymentMethod",
    "common.back": "orderErrGoBack",
    "common.noResults": "profileNoResultFound",
    "common.errorLoadingPage": "errorGeneric",
    "common.eWallet": "eWallets",
    "paymentMethod.eWallets": "eWallets",
    "paymentMethod.failedToLoadPaymentMethods": "profileFailedToLoadProfile",
    "paymentMethod.noPaymentMethodsAddedYet": "addPaymentMethod",
    "paymentMethod.noPaymentMethodsFound": "paymentMethodNotFound",
    "paymentMethod.pleaseSelectPaymentMethod": "createAdSelectPaymentMethod",
    "paymentMethod.paymentMethodsSheetTitle": "createAdSelectPaymentMethod",
    "paymentMethod.selectPaymentMethodsHint": "paymentMethodSelectUpTo3",
    "paymentMethod.methodNotAvailableSearch": "paymentMethodNotFoundSearchSuggestion",
    "advertiser.offline": "p2pAdvertiserOffline",
    "advertiser.online": "p2pAdvertiserOnline",
    "chat.online": "chatOnline",
    "chat.offline": "p2pAdvertiserOffline",
    "common.deleteItemTitle": "deletePaymentMethod",
    "common.deleteItemDescription": "p2pDeletePaymentMethodBody",
    "wallet.marketplaceTitle": "depositWithdrawPage2_marketplace",
    "wallet.marketplaceDescription": "depositWithdrawPage2_tradeUsdDirectly",
    "wallet.transferUnexpectedError": "transferUnsuccessful_body",
    "wallet.transferErrorDuring": "transferUnsuccessful_body",
    "wallet.depositToP2p": "walletPage_deposit",
    "wallet.withdrawFromP2p": "walletPage_withdraw",
    "wallet.directDepositTitle": "walletTransactions_deposit",
    "wallet.directWithdrawalTitle": "walletTransactions_withdraw",
    "market.failedToLoadAdvertisements": "errorGeneric",
    "market.noAdsMaintenanceTitle": "marketsNoAdsAvailableMaintenance",
    "order.createOrderFailed": "orderCreateGenericErrorMessage",
    "order.unableToCompleteOrder": "orderErrGenericMessage",
    "errors.failedToLoadCurrencies": "authFailedToLoadCountries",
    "errors.failedToProcessCurrencies": "authFailedToLoadCountries",
    "profile.closedGroupMemberTooltip": "marketsClosedGroupTooltip",
    "p2pAccess.title": "accountDisabledTitle",
    "p2pAccess.description": "accountDisabledMessage",
    "p2pAccess.illustrationAlt": "onboardingHeroImageLabel",
    "login.emailOrPhoneNumber": "authEmailOrPhoneNumber",
    "login.phonePlaceholder": "authPhoneHint",
    "navigation.askAmy": "askAmyButtonLabel",
    "guideIntro.amyTitle": "askAmyButtonLabel",
    "login.password": "authPasswordLabel",
    "orderDetails.instructions": "orderDetailsInstructions",
    "paymentMethodFields.instructions": "orderDetailsInstructions",
    "paymentMethodFields.name": "profileNameLabel",
    "wallet.date": "transactionDetails_date",
    "orders.date": "transactionDetails_date",
    "orders.status": "profileApiTokenTableStatusColumn",
    "orderDetails.status": "profileApiTokenTableStatusColumn",
    "myAds.status": "profileApiTokenTableStatusColumn",
    "adForm.payingWith": "createAdPayingWith",
    "adForm.receiveIn": "createAdReceiveIn",
    "adForm.countryAll": "countriesSelectionAllCountries",
    "learnPage.termExchangeRateTitle": "filterSortExchangeRate",
    "learnPage.visitHelpCentre": "common.learnMore",
}

# Copy translated value from another web key in the same locale file.
WEB_KEY_FALLBACK: dict[str, str] = {
    "login.resendCodeTimer": "orders.resendCodeTimer",
    "login.verifying": "orders.verifying",
    "login.resendCode": "orders.resendCode",
    "login.didntReceiveCode": "orders.didntReceiveCode",
    "wallet.transferUnexpectedError": "wallet.transferUnsuccessfulMessage",
    "notifications.loading": "common.loading",
    "market.tradeLimitsLabel": "market.orderLimits",
    "login.loginWithEmail": "login.email",
    "login.loginWithPhone": "kyc.phoneNumber",
    "login.phoneNumber": "kyc.phoneNumber",
    "orderDetails.total": "order.total",
    "wallet.mainWallet": "walletTransactions_wallet",
}

# Accessibility / UI chrome — no mobile English match; translate per locale.
A11Y: dict[str, dict[str, str]] = {
    "ar": {
        "common.back": "رجوع",
        "common.arrow": "سهم",
        "common.bank": "بنك",
        "common.blockedUser": "مستخدم محظور",
        "common.calendar": "تقويم",
        "common.chat": "دردشة",
        "common.chevronRight": "سهم يمين",
        "common.clear": "مسح",
        "common.clearSearch": "مسح البحث",
        "common.decrement": "إنقاص",
        "common.derivLogo": "شعار Deriv",
        "common.dropdown": "قائمة منسدلة",
        "common.increment": "زيادة",
        "common.info": "معلومات",
        "common.options": "خيارات",
        "common.p2pLogo": "شعار P2P",
        "common.plus": "زائد",
        "common.previous": "السابق",
        "common.star": "نجمة",
        "common.switch": "تبديل",
        "common.thumbsDown": "إبهام لأسفل",
        "common.toggleStatus": "تبديل الحالة",
        "common.trade": "تداول",
        "common.transaction": "معاملة",
        "common.unsuccessful": "غير ناجح",
        "common.user": "مستخدم",
        "common.visibilityStatus": "حالة الظهور",
        "common.deleteItemTitle": "حذف العنصر",
        "common.deleteItemDescription": "هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
        "login.emailPlaceholder": "name@email.com",
        "login.loggingIn": "جارٍ تسجيل الدخول...",
        "notifications.loading": "جارٍ تحميل الإشعارات",
        "notifications.poweredBy": "الإشعارات بواسطة",
        "market.tradeLimitsLabel": "حدود الطلب",
        "paymentMethod.methodNotAvailableSearch": "طريقة الدفع غير متاحة في بحثك",
        "wallet.directDepositDescription": "أودع الأموال مباشرة من حسابك البنكي أو محفظتك الإلكترونية أو طرق دفع أخرى.",
        "wallet.directWithdrawalDescription": "اسحب الأموال مباشرة إلى حسابك البنكي أو محفظتك الإلكترونية أو طرق دفع أخرى.",
    },
    "de": {
        "common.back": "Zurück",
        "common.arrow": "Pfeil",
        "common.bank": "Bank",
        "common.blockedUser": "Blockierter Benutzer",
        "common.calendar": "Kalender",
        "common.chat": "Chat",
        "common.chevronRight": "Chevron rechts",
        "common.clear": "Löschen",
        "common.clearSearch": "Suche löschen",
        "common.decrement": "Verringern",
        "common.derivLogo": "Deriv-Logo",
        "common.dropdown": "Dropdown",
        "common.increment": "Erhöhen",
        "common.info": "Info",
        "common.options": "Optionen",
        "common.p2pLogo": "P2P-Logo",
        "common.plus": "Plus",
        "common.previous": "Zurück",
        "common.star": "Stern",
        "common.switch": "Wechseln",
        "common.thumbsDown": "Daumen runter",
        "common.toggleStatus": "Status umschalten",
        "common.trade": "Handel",
        "common.transaction": "Transaktion",
        "common.unsuccessful": "Nicht erfolgreich",
        "common.user": "Benutzer",
        "common.visibilityStatus": "Sichtbarkeitsstatus",
        "common.deleteItemTitle": "Element löschen",
        "common.deleteItemDescription": "Möchten Sie dieses Element wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
        "login.emailPlaceholder": "name@email.com",
        "login.loggingIn": "Anmeldung läuft...",
        "notifications.loading": "Benachrichtigungen werden geladen",
        "notifications.poweredBy": "Benachrichtigungen von",
        "market.tradeLimitsLabel": "Bestelllimits",
        "paymentMethod.methodNotAvailableSearch": "Zahlungsmethode in Ihrer Suche nicht verfügbar",
        "wallet.directDepositDescription": "Zahlen Sie Geld direkt von Ihrem Bankkonto, E-Wallet oder anderen Zahlungsmethoden ein.",
        "wallet.directWithdrawalDescription": "Heben Sie Geld direkt auf Ihr Bankkonto, E-Wallet oder andere Zahlungsmethoden ab.",
        "wallet.depositToP2p": "Einzahlung auf P2P",
        "wallet.withdrawFromP2p": "Auszahlung von P2P",
        "wallet.directDepositTitle": "Direkte Einzahlung",
        "wallet.directWithdrawalTitle": "Direkte Auszahlung",
        "wallet.transferErrorDuring": "Bei der Übertragung ist ein Fehler aufgetreten.",
    },
}


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


def set_path(flat: dict[str, object], path: str, value: str) -> None:
    flat[path] = value


def fill_locale(locale: str) -> tuple[int, int]:
    web_en = flatten(json.loads((WEB_L10N / "en.json").read_text(encoding="utf-8")))
    web_loc_path = WEB_L10N / f"{locale}.json"
    web_loc = flatten(json.loads(web_loc_path.read_text(encoding="utf-8")))

    mob_en = load_mobile_arb(MOBILE_L10N / "app_en.arb")
    mob_loc = load_mobile_arb(MOBILE_L10N / f"app_{locale}.arb")

    filled = 0
    still_en = 0

    for path, en_val in web_en.items():
        if not isinstance(en_val, str):
            continue
        if path in NON_TRANSLATABLE_KEYS:
            continue
        current = web_loc.get(path)
        if current != en_val:
            continue

        # 1) In-file fallback from another translated web key
        if path in WEB_KEY_FALLBACK:
            src = WEB_KEY_FALLBACK[path]
            src_val = web_loc.get(src)
            if isinstance(src_val, str) and src_val != web_en.get(src):
                set_path(web_loc, path, src_val)
                filled += 1
                continue

        # 2) Explicit mobile ARB key
        mob_key = EXPLICIT_MOBILE.get(path)
        if mob_key and mob_key in mob_loc:
            val = mob_loc[mob_key]
            if path == "login.noAccountYet":
                val = val.strip()
            set_path(web_loc, path, val)
            filled += 1
            continue

        # 3) Exact English string match in mobile
        for mk, men in mob_en.items():
            if men == en_val and mk in mob_loc:
                set_path(web_loc, path, mob_loc[mk])
                filled += 1
                break
        else:
            # 4) Manual a11y / web-only table
            manual = A11Y.get(locale, {}).get(path) or A11Y.get("de", {}).get(path)
            if manual and locale in ("de", "ar"):
                set_path(web_loc, path, manual)
                filled += 1
            else:
                still_en += 1

    nested = unflatten(web_loc)
    web_loc_path.write_text(json.dumps(nested, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return filled, still_en


def main() -> int:
    if not (MOBILE_L10N / "app_en.arb").is_file():
        print(f"Missing mobile l10n at {MOBILE_L10N}", file=sys.stderr)
        return 1

    for locale in LOCALES:
        filled, still_en = fill_locale(locale)
        print(f"{locale}: filled={filled} still_english={still_en}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
