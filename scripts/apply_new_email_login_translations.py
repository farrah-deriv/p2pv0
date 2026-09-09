#!/usr/bin/env python3
"""Apply translations for emailRequired.* and new login.* phone keys."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_L10N = REPO_ROOT / "lib" / "i18n" / "translations"
MOBILE_L10N = REPO_ROOT.parent / "p2p" / "ai-deriv-p2p-app-languages" / "lib" / "l10n"

LOCALES = [
    "ar", "bn", "de", "es", "fr", "it", "ko", "mn", "pl", "pt", "ru", "si", "sw", "ta", "vi", "zh", "zh_TW",
]

EMAIL_REQUIRED: dict[str, dict[str, str]] = {
    "ar": {
        "title": "أضف بريدك الإلكتروني للمتابعة",
        "description": "تحتاج إلى عنوان بريد إلكتروني في حساب Deriv الخاص بك لشراء أو بيع على Deriv P2P.",
        "addEmail": "إضافة بريد إلكتروني",
    },
    "bn": {
        "title": "চালিয়ে যেতে আপনার ইমেল যোগ করুন",
        "description": "Deriv P2P-এ কেনা বা বিক্রি করতে আপনার Deriv অ্যাকাউন্টে একটি ইমেল ঠিকানা প্রয়োজন।",
        "addEmail": "ইমেল যোগ করুন",
    },
    "de": {
        "title": "Fügen Sie Ihre E-Mail hinzu, um fortzufahren",
        "description": "Sie benötigen eine E-Mail-Adresse in Ihrem Deriv-Konto, um auf Deriv P2P zu kaufen oder zu verkaufen.",
        "addEmail": "E-Mail hinzufügen",
    },
    "es": {
        "title": "Añade tu correo electrónico para continuar",
        "description": "Necesitas una dirección de correo electrónico en tu cuenta Deriv para comprar o vender en Deriv P2P.",
        "addEmail": "Añadir correo electrónico",
    },
    "fr": {
        "title": "Ajoutez votre e-mail pour continuer",
        "description": "Vous avez besoin d'une adresse e-mail sur votre compte Deriv pour acheter ou vendre sur Deriv P2P.",
        "addEmail": "Ajouter un e-mail",
    },
    "it": {
        "title": "Aggiungi la tua email per continuare",
        "description": "Ti serve un indirizzo email sul tuo account Deriv per comprare o vendere su Deriv P2P.",
        "addEmail": "Aggiungi email",
    },
    "ko": {
        "title": "계속하려면 이메일을 추가하세요",
        "description": "Deriv P2P에서 매수 또는 매도하려면 Deriv 계정에 이메일 주소가 필요합니다.",
        "addEmail": "이메일 추가",
    },
    "mn": {
        "title": "Үргэлжлүүлэхийн тулд имэйлээ нэмнэ үү",
        "description": "Deriv P2P дээр худалдан авах эсвэл зарахын тулд Deriv дансадаа имэйл хаяг шаардлагатай.",
        "addEmail": "Имэйл нэмэх",
    },
    "pl": {
        "title": "Dodaj adres e-mail, aby kontynuować",
        "description": "Potrzebujesz adresu e-mail na koncie Deriv, aby kupować lub sprzedawać na Deriv P2P.",
        "addEmail": "Dodaj e-mail",
    },
    "pt": {
        "title": "Adicione seu e-mail para continuar",
        "description": "Você precisa de um endereço de e-mail na sua conta Deriv para comprar ou vender no Deriv P2P.",
        "addEmail": "Adicionar e-mail",
    },
    "ru": {
        "title": "Добавьте электронную почту, чтобы продолжить",
        "description": "Чтобы покупать или продавать на Deriv P2P, в вашем аккаунте Deriv нужен адрес электронной почты.",
        "addEmail": "Добавить электронную почту",
    },
    "si": {
        "title": "ඉදිරියට යාමට ඔබගේ ඊමේල් එකතු කරන්න",
        "description": "Deriv P2P හි මිලදී ගැනීමට හෝ විකිණීමට ඔබගේ Deriv ගිණුමේ ඊමේල් ලිපිනයක් අවශ්‍යයි.",
        "addEmail": "ඊමේල් එකතු කරන්න",
    },
    "sw": {
        "title": "Ongeza barua pepe yako ili uendelee",
        "description": "Unahitaji anwani ya barua pepe kwenye akaunti yako ya Deriv ili kununua au kuuza kwenye Deriv P2P.",
        "addEmail": "Ongeza barua pepe",
    },
    "ta": {
        "title": "தொடர உங்கள் மின்னஞ்சலைச் சேர்க்கவும்",
        "description": "Deriv P2P-இல் வாங்க அல்லது விற்க, உங்கள் Deriv கணக்கில் மின்னஞ்சல் முகவரி தேவை.",
        "addEmail": "மின்னஞ்சலைச் சேர்க்கவும்",
    },
    "vi": {
        "title": "Thêm email để tiếp tục",
        "description": "Bạn cần có địa chỉ email trên tài khoản Deriv để mua hoặc bán trên Deriv P2P.",
        "addEmail": "Thêm email",
    },
    "zh": {
        "title": "添加邮箱以继续",
        "description": "您需要在 Deriv 账户中添加电子邮件地址，才能在 Deriv P2P 上买卖。",
        "addEmail": "添加邮箱",
    },
    "zh_TW": {
        "title": "新增電子郵件以繼續",
        "description": "您需要在 Deriv 帳戶中新增電子郵件地址，才能在 Deriv P2P 上買賣。",
        "addEmail": "新增電子郵件",
    },
}

COUNTRY_CODE: dict[str, str] = {
    "ar": "رمز الدولة",
    "bn": "দেশের কোড",
    "de": "Ländercode",
    "es": "Código de país",
    "fr": "Indicatif pays",
    "it": "Prefisso internazionale",
    "ko": "국가 코드",
    "mn": "Улсын код",
    "pl": "Kod kraju",
    "pt": "Código do país",
    "ru": "Код страны",
    "si": "රටේ කේතය",
    "sw": "Msimbo wa nchi",
    "ta": "நாட்டுக் குறியீடு",
    "vi": "Mã quốc gia",
    "zh": "国家代码",
    "zh_TW": "國家代碼",
}

INCORRECT_CREDENTIALS_IDENTIFIER: dict[str, str] = {
    "ar": "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة. يُرجى المحاولة مرة أخرى.",
    "bn": "ইমেল, ফোন নম্বর বা পাসওয়ার্ড ভুল। অনুগ্রহ করে আবার চেষ্টা করুন।",
    "de": "E-Mail, Telefonnummer oder Passwort ist falsch. Bitte versuchen Sie es erneut.",
    "es": "El correo electrónico, el número de teléfono o la contraseña son incorrectos. Inténtalo de nuevo.",
    "fr": "E-mail, numéro de téléphone ou mot de passe incorrect. Veuillez réessayer.",
    "it": "Email, numero di telefono o password non corretti. Riprova.",
    "ko": "이메일, 전화번호 또는 비밀번호가 올바르지 않습니다. 다시 시도해 주세요.",
    "mn": "И-мэйл, утасны дугаар эсвэл нууц үг буруу байна. Дахин оролдоно уу.",
    "pl": "Nieprawidłowy e-mail, numer telefonu lub hasło. Spróbuj ponownie.",
    "pt": "E-mail, número de telefone ou senha incorretos. Tente novamente.",
    "ru": "Неверный адрес электронной почты, номер телефона или пароль. Попробуйте снова.",
    "si": "විද්‍යුත් තැපෑල, දුරකථන අංකය හෝ මුරපදය වැරදිය. නැවත උත්සාහ කරන්න.",
    "sw": "Barua pepe, nambari ya simu au nenosiri si sahihi. Tafadhali jaribu tena.",
    "ta": "மின்னஞ்சல், தொலைபேசி எண் அல்லது கடவுச்சொல் தவறானது. மீண்டும் முயற்சிக்கவும்.",
    "vi": "Email, số điện thoại hoặc mật khẩu không đúng. Vui lòng thử lại.",
    "zh": "邮箱、电话号码或密码不正确，请重试。",
    "zh_TW": "電子郵件、電話號碼或密碼不正確，請重試。",
}

USE_PHONE_CODE: dict[str, str] = {
    "ar": "تسجيل الدخول باستخدام رمز الهاتف بدلاً من ذلك",
    "bn": "পরিবর্তে ফোন কোড দিয়ে লগ ইন করুন",
    "de": "Stattdessen mit Telefon-Code anmelden",
    "es": "Iniciar sesión con un código enviado por teléfono",
    "fr": "Se connecter avec un code envoyé par téléphone",
    "it": "Accedi con il codice via telefono",
    "ko": "전화 코드로 로그인하기",
    "mn": "Утасны кодоор нэвтрэх",
    "pl": "Zaloguj się kodem z telefonu",
    "pt": "Entrar com código por telefone",
    "ru": "Войти с помощью кода из SMS",
    "si": "ඒ වෙනුවට දුරකථන කේතයෙන් පිවිසෙන්න",
    "sw": "Ingia kwa kutumia msimbo wa simu",
    "ta": "தொலைபேசி குறியீட்டைப் பயன்படுத்தி உள்நுழையவும்",
    "vi": "Đăng nhập bằng mã gửi qua điện thoại",
    "zh": "改用手机验证码登录",
    "zh_TW": "改用手機驗證碼登入",
}


def load_mobile_arb(locale: str) -> dict[str, str]:
    data = json.loads((MOBILE_L10N / f"app_{locale}.arb").read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("@") and isinstance(v, str)}


def apply_locale(locale: str) -> None:
    path = WEB_L10N / f"{locale}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    mobile = load_mobile_arb(locale)

    login = data.setdefault("login", {})
    kyc = data.setdefault("kyc", {})
    email_required = data.setdefault("emailRequired", {})

    email_required["title"] = EMAIL_REQUIRED[locale]["title"]
    email_required["description"] = EMAIL_REQUIRED[locale]["description"]
    email_required["addEmail"] = EMAIL_REQUIRED[locale]["addEmail"]
    email_required.pop("notNow", None)

    login["incorrectCredentialsIdentifier"] = INCORRECT_CREDENTIALS_IDENTIFIER[locale]
    login["countryCode"] = COUNTRY_CODE[locale]
    login["countryCodePlaceholder"] = "+60"
    login["emailOrPhoneNumber"] = mobile.get("authEmailOrPhoneNumber", login.get("emailOrPhoneNumber"))
    login["loginWithEmail"] = login.get("email", mobile.get("authEmailLabel", "Email"))
    phone_label = kyc.get("phoneNumber", mobile.get("authPhoneHint", "Phone number"))
    login["loginWithPhone"] = phone_label
    login["phoneNumber"] = phone_label
    login["phonePlaceholder"] = mobile.get("authPhoneHint", phone_label)
    login["usePhoneCode"] = USE_PHONE_CODE[locale]

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    for locale in LOCALES:
        apply_locale(locale)
        print(f"updated {locale}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
