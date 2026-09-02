# CLAUDE.md — P2P Web

Web client for the Deriv P2P product. Next.js 15 App Router + React 19.

Cross-platform context (mobile counterpart, shared backend, feature parity rules) lives at `../CLAUDE.md`.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom tokens in `tailwind.config.ts` |
| UI primitives | Quill Design System (`@deriv-com/quill-ui-v2`, `@deriv/quill-icons`) wrapped in `components/ui/` — migrating off Radix UI/lucide-react (see `## Design System (Quill)` below) |
| Server state | `@tanstack/react-query` v5 |
| Client state | Zustand stores in `stores/` |
| Forms | react-hook-form + Zod |
| i18n | Custom `useTranslations` hook reading JSON files in `lib/i18n/translations/` |
| WebSocket | Context in `contexts/websocket-context.tsx` + `hooks/use-websocket*` |
| Analytics | `@deriv-com/analytics` (RudderStack wrappers) + Datadog RUM |
| Testing | Jest + `@testing-library/react` |
| Package manager | pnpm |
| Deploy | Cloudflare Pages via `next-on-pages` |

## Repository Structure

```
p2p-v0/
├── app/                    # App Router pages & route handlers
│   ├── page.tsx            # Markets (home)
│   ├── ads/                # My Ads
│   ├── advertiser/         # Advertiser profile
│   ├── orders/             # Orders
│   ├── profile/            # User profile
│   ├── wallet/             # Wallet & transfer
│   ├── login/              # Auth (Ory Kratos)
│   ├── api/                # Route handlers (proxy to Kratos etc.)
│   └── layout.tsx
├── components/             # Feature & shared components
│   ├── ui/                 # Quill Design System wrapped (Button, Alert, Dialog, ...) — some still Radix, mid-migration
│   ├── buy-sell/
│   ├── order-details/
│   ├── p2p-balance-warning/
│   └── ...
├── hooks/                  # Custom hooks (use-api-queries, use-websocket, ...)
├── stores/                 # Zustand stores
├── services/api/           # API client (Ory + P2P backend)
├── contexts/               # React contexts (websocket, alert dialog, ...)
├── lib/
│   ├── i18n/translations/  # 18 locale JSON files
│   └── utils.ts
├── analytics/              # Event tracking
├── public/icons/           # SVG/PNG assets
└── __tests__/              # Jest tests mirroring source tree
```

## Commands

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm build         # Next.js build + Cloudflare adapter
pnpm lint          # next lint
pnpm test          # jest (if configured in scripts)
npx tsc --noEmit   # typecheck
```

## pnpm lockfiles (agents — do not touch)

**Never edit or commit changes to `pnpm-lock.yaml` or `pnpm-workspace.yaml` unless `package.json` (or another manifest) intentionally changed** — e.g. adding/removing/updating a dependency.

- Do **not** run `pnpm install` only to verify builds/tests/lint if it will rewrite the lockfile.
- Prefer `pnpm dev`, `pnpm lint`, `npx tsc --noEmit`, `pnpm test` without reinstalling.
- If a hook or install accidentally modified lockfiles, **revert** them before commit (`git checkout -- pnpm-lock.yaml pnpm-workspace.yaml`).
- Only update lockfiles in the same PR that changes `package.json`, and only because that dependency change requires it.

## Key Patterns

### State split

- **Server state** → React Query via `hooks/use-api-queries.ts` (`useTotalBalance`, `usePaymentMethods`, `useAdvertisements`, etc.). 2-minute default staleTime for balance.
- **Client state** → Zustand stores (`useUserDataStore`, `useMarketFilterStore`, `useOrderSidebarStore`). Use selector functions to minimize re-renders.
- **Local UI state** → `useState` / `useReducer` in components.

### API layer

All API calls go through `services/api/`. Each file maps to a backend domain (`api-auth.ts`, `api-buy-sell.ts`, `api-chat.ts`, ...). React Query hooks wrap these in `hooks/use-api-queries.ts`.

### i18n

`useTranslations()` returns `{ t, locale }`. `t(key, params?)` resolves dotted keys (`"market.noBalanceTitle"`). EN is the fallback for missing keys in other locales. When adding a new string:

1. Add to `lib/i18n/translations/en.json` (required).
2. Add translated values to the other 11 locale files (`bn, de, es, fr, it, ko, pl, pt, ru, sw, vi`).
3. Never hardcode user-facing strings in components.

### UI components

- Use `components/ui/` wrappers (Button, Alert, Dialog, Tabs, ...) — never use raw HTML buttons or custom modals when a primitive exists.
- Follow the `cva` variant pattern already in place for new primitives.
- Tailwind-first. Use design tokens from `tailwind.config.ts` (`bg-error-light`, `bg-slate-1200`, `text-grayscale-100`, ...) instead of hex literals.

### Design System (Quill)

Web is mid-migration from Radix UI + lucide-react to Deriv's **Quill Design System** (`@deriv-com/quill-ui-v2`, `@deriv/quill-icons`) — see PR #1386 ("Design System / Migrate UI primitives to Quill Design System"). `components/ui/` wraps Quill components (e.g. `alert.tsx` wraps `SectionMessage`, `badge.tsx` wraps `Tag`, `button.tsx`, `select.tsx`, `toast.tsx`/Snackbar, `tabs.tsx`, `dropdown-menu.tsx`, `checkbox.tsx`, `tooltip.tsx`, `accordion.tsx`, `sheet.tsx`, `input-otp.tsx`, `link.tsx`, `panel-wrapper.tsx`, `modal-header-row.tsx`, `back-arrow-icon.tsx`); some primitives (`dialog.tsx`, `popover.tsx`, `switch.tsx`, `radio-group.tsx`, `label.tsx`, `alert-dialog.tsx`) are still plain Radix and not yet migrated — check the file before assuming either way.

- **New/edited UI work must use Quill**, not raw Radix or ad-hoc markup, when a Quill-backed `components/ui/` primitive covers the case.
- Status/variant-driven primitives (Alert, Badge, Toast, ...) are styled entirely by Quill's internal design tokens (`--quill-semantic-colour-...`) keyed off the `variant`/`status` prop. **Pass the correct variant** (`"destructive"`, `"warning"`, `"info"`, ...) instead of overriding colors with custom Tailwind classes — manual `bg-*`/`text-*` overrides get silently ignored or overridden by Quill's own CSS. (We hit this: `ConnectionLostBanner` never passed a `variant`, defaulted to the gray "default" status, and a `bg-red-withdraw` class that isn't even a real Tailwind token — the banner rendered nearly invisible.)
- Before styling a Quill-wrapped primitive, check its Quill props/status map in `components/ui/` rather than fighting it with `className`.

### Icons

- **Prefer `@deriv/quill-icons`** for new icons (migration target). `lucide-react` still exists for not-yet-migrated call sites — don't add new `lucide-react` imports.
- SVG/PNG assets under `public/icons/`.
- For decorative icons, add `alt=""` + `aria-hidden="true"`.

### WebSocket

- Single shared `WebSocketContext` wraps the whole app.
- Subscribe from a component via `useWebSocketContext()` — returns `subscribe`, `joinAdvertsChannel`, `subscribeToUserUpdates`, etc.
- Subscribe callbacks must filter on `data.options.channel` before reading payload.
- Channels: `users/me`, `adverts/currency/{currency}/{type}`, `users_online`.
- Event: `data.payload.data.event` (`balance_change`, `status_change`, `update`, ...).

### Auth (Ory Kratos)

- Login flow: `GET /self-service/login/api` → `POST /self-service/login?flow={flowId}`.
- Registration flow: `GET /self-service/registration/api` → `POST /self-service/registration?flow={flowId}`.
- OTP: submit with `method: 'code'` and the code.
- Session token passed via `X-Session-Token` header (see `services/api/api-auth.ts`).

### Routing

- App Router. `useRouter()` / `useSearchParams()` / `usePathname()` from `next/navigation`.
- Deep links use URL search params (e.g. wallet transfer deep link: `/wallet?operation=TRANSFER`, read by `app/wallet/components/wallet-summary.tsx`).
- `router.replace()` to clean URLs after consuming a deep-link param.

## Testing

- Tests live in `__tests__/` mirroring source paths (`__tests__/hooks/`, `__tests__/components/`, `__tests__/app/`).
- Mock `next/navigation` when testing nav behaviour.
- Mock `@/lib/i18n/use-translations` when testing components with `t()` calls — return a small key→string map.
- Use `renderHook` + `act` + fake timers when testing hooks with `setTimeout` / debouncing.
- Follow the `import jest from "jest"` convention already in the repo (there are outstanding tsc complaints about this across the repo; don't try to fix one-off).

## UI rules (critical)

- **NEVER** hardcode user-facing strings — always use `t("namespace.key")`.
- **NEVER** hardcode colors — use Tailwind tokens from `tailwind.config.ts`.
- **ALWAYS** use `components/ui/` primitives when one exists — follow Quill Design System conventions (see `### Design System (Quill)` above), not raw Radix/lucide-react, for anything already migrated.
- **ALWAYS** add `aria-*` attributes on interactive controls; decorative icons get `alt=""` + `aria-hidden="true"`.
- **PREFER** server state in React Query over duplicating state in Zustand.

## Data source gotchas

See `../CLAUDE.md` for the full list. Web-specific ones:

- `userData?.balances?.amount` (from `/users/me`) = **P2P balance** — matches mobile's `myProfileProvider.totalAccountValue`. Use this for banner/gate logic.
- `useTotalBalance()` returns the wallet-service shape (`wallets.items[]`) — a DIFFERENT source. Don't use for P2P balance decisions; only use for displaying wallet breakdowns on the wallet page.
- WebSocket `balance_change` handler lives in `app/page.tsx` and `app/wallet/page.tsx` — updates local `balance` state AND `useUserDataStore.updateBalances`.

## Verification (run before PR)

```bash
npx tsc --noEmit   # typecheck
pnpm lint          # eslint
pnpm test          # jest (if wired into scripts)
```
