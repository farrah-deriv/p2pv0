# Localization Guide

P2P web supports **18 locales**. English ships in the main bundle; other languages load on demand when selected.

## Architecture

- **Zustand** (`stores/language-store.ts`) — persisted locale preference
- **`LanguageSync`** — reads `?lang=`, restores storage, sets `document.lang` / `document.dir`, triggers locale chunk load
- **`useTranslations`** — `t("dotted.key", params?)` with English fallback for missing keys
- **`translation-loader.ts`** — dynamic `import()` per locale JSON + in-memory cache
- **JSON files** — `lib/i18n/translations/{locale}.json`

## Supported locales

Defined in `lib/i18n/config.ts`: `en`, `es`, `it`, `pt`, `fr`, `ru`, `vi`, `de`, `bn`, `pl`, `ko`, `sw`, `ar`, `mn`, `si`, `ta`, `zh`, `zh_TW`.

RTL: only `ar` (see `RTL_LOCALES` in `config.ts`).

## Usage in components

```tsx
import { useTranslations } from "@/lib/i18n/use-translations"

export function MyComponent() {
  const { t, locale } = useTranslations()

  return (
    <div>
      <h1>{t("common.buy")}</h1>
      <p>{t("order.orderLimitError", { min: "10", max: "100", currency: "USD" })}</p>
    </div>
  )
}
```

While a non-English chunk is loading, UI shows **English** strings (same per-key fallback as missing keys). After load, components re-render automatically.

## Adding a new language

1. Add code to `locales` and `localeNames` in `lib/i18n/config.ts`.
2. If RTL, add to `RTL_LOCALES`.
3. Create `lib/i18n/translations/{code}.json` (copy structure from `en.json`).
4. Add a loader entry in `lib/i18n/translation-loader.ts` → `localeLoaders`.
5. Optionally sync from mobile: `python3 scripts/sync_locale_from_mobile.py {code}` (from `p2p-v0/`).
6. Test with `?lang={code}` and language selector.

## Updating translations

- **Manual** — edit the locale JSON under `lib/i18n/translations/`.
- **Mobile parity** — `scripts/sync_locale_from_mobile.py`:
  - `web-first` (default): only fills missing / still-English keys.
  - `mobile-first` (e.g. `ar`): overwrites when mobile has a match.
  - Requires sibling repo `p2p/ai-deriv-p2p-app/lib/l10n/`.

### Non-translatable navigation labels

**Agents and contributors: read `lib/i18n/NON_TRANSLATABLE.md` before editing locale files.**

Sidebar and mobile footer nav labels must stay **English in every locale**. Do not translate:

`navigation.home`, `navigation.askAmy`, `navigation.market`, `navigation.myAds`, `navigation.orders`, `navigation.p2pHelpCentre`, `navigation.profile`, `navigation.wallet`

Copy the exact English strings from `en.json` into all other locale JSON files. Do not change `scripts/i18n_manual_translations.py` to use localized values for these keys.

## Bundle behaviour

| Locale | Bundle |
|--------|--------|
| `en` | Main client chunk (always available) |
| Others | Separate async chunks, loaded once per session when first selected |

Do **not** statically import all JSON files in `use-translations.ts`; use `translation-loader.ts` only.

## RTL testing checklist

With `?lang=ar`:

- [ ] `document.documentElement.dir === "rtl"`
- [ ] Sheets open from logical end (`components/ui/sheet.tsx`)
- [ ] Tabs, dropdowns, margins use logical classes (`ms`/`me`, `start`/`end`)
- [ ] Back chevrons mirrored (`rtl:rotate-180` / `BackArrowIcon`)
- [ ] Calendars and date labels use locale (`format-date.ts`)

## Tests

```bash
pnpm exec jest __tests__/lib/i18n/
```

Covers `config`, `translation-tree`, and async `translation-loader`.
