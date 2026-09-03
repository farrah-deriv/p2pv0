# Non-translatable i18n keys

**Do not translate these keys into other locales.** Every file under `lib/i18n/translations/*.json` (except `en.json` as source of truth) must keep the **exact English values** below.

Product rule: sidebar navigation and mobile footer navigation stay in English in all locales.

## Keys (always English)

| Key | Value |
|-----|-------|
| `navigation.home` | Home |
| `navigation.askAmy` | Ask Amy |
| `navigation.market` | Market |
| `navigation.myAds` | My Ads |
| `navigation.orders` | Orders |
| `navigation.p2pHelpCentre` | P2P help centre |
| `navigation.profile` | Profile |
| `navigation.wallet` | Wallet |

## Used in

- `components/sidebar.tsx` — desktop nav
- `components/mobile-footer-nav.tsx` — mobile nav
- `components/header.tsx` — Ask Amy button (mobile)

## For agents and contributors

- **Do not** localize these keys when editing locale JSON, running auto-translate, or syncing from mobile.
- **Do not** add translated entries for these keys in `scripts/i18n_manual_translations.py` — use the English strings above.
- Other `navigation.*` keys (e.g. `navigation.backToHome`, `navigation.goToMyAds`) **may** be translated.
- If a script overwrites these keys, revert to the English values in this table.

See also: `docs/LOCALIZATION.md` → “Non-translatable navigation labels”.
