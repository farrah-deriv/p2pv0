# Deriv P2P — Web App

Web application for the Deriv P2P. Built with Next.js 15 App Router and React 19, deployed on Cloudflare Pages.

## Project Structure

```
p2pv0/
├── app/                        # App Router pages & route handlers
│   ├── page.tsx                # Markets (home)
│   ├── ads/                    # My Ads
│   ├── advertiser/             # Advertiser profile
│   ├── orders/                 # Orders
│   ├── profile/                # User profile
│   ├── wallet/                 # Wallet & transfer
│   ├── login/                  # Auth (Ory Kratos)
│   ├── api/                    # Route handlers (proxy to Kratos etc.)
│   └── layout.tsx
├── components/                 # Feature & shared components
│   ├── ui/                     # Radix primitives (Button, Dialog, Tabs, ...)
│   ├── buy-sell/
│   ├── order-details/
│   ├── market-filter/
│   └── ...
├── hooks/                      # Custom hooks (use-api-queries, use-websocket, ...)
├── stores/                     # Zustand stores
├── services/api/               # API client (Ory + P2P backend)
├── contexts/                   # React contexts (websocket, alert-dialog, ...)
├── lib/
│   ├── i18n/translations/      # 12 locale JSON files (en, de, es, fr, ...)
│   └── utils.ts
├── analytics/                  # Event tracking helpers
├── public/icons/               # SVG/PNG assets
├── playwright/                 # E2E tests
└── __tests__/                  # Jest unit/integration tests
```

## Getting Started

```bash
pnpm install
pnpm dev          # http://localhost:3000 (includes the local WebSocket upgrade proxy)
```

`.env.local` is gitignored and not templated in the repo. Create one pointing at
staging — these are the same values the staging deploy uses, and none of them are
secrets:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CORE_URL=https://staging-api-core.deriv.com
NEXT_PUBLIC_CORE_ME_URL=https://staging-api-core.deriv.me
NEXT_PUBLIC_CORE_BE_URL=https://staging-api-core.deriv.be
NEXT_PUBLIC_SOCKET_URL=wss://staging-api-core.deriv.com
NEXT_PUBLIC_SOCKET_ME_URL=wss://staging-api-core.deriv.me
NEXT_PUBLIC_SOCKET_BE_URL=wss://staging-api-core.deriv.be
NEXT_PUBLIC_IS_ORY_ENABLED=1
NEXT_PUBLIC_ORY_URL=https://staging-auth.deriv.com
NEXT_PUBLIC_ORY_ME_URL=https://staging-auth.deriv.me
NEXT_PUBLIC_ORY_BE_URL=https://staging-auth.deriv.be
NEXT_PUBLIC_NODE_ENV=staging
```

Anything else the app reads (Datadog, Novu, PostHog, feature flags) is optional
locally and can be left unset. For the full list, see the `env:` block of
`.github/workflows/build-and-deploy-staging.yml`, or the repo's staging
environment variables on GitHub.

Then log in at [http://localhost:3000/login](http://localhost:3000/login) with your
staging credentials — email + password, or email + OTP.

`package.json` pins `"packageManager": "pnpm@9.15.9"`, so pnpm 10+ automatically
switches to 9 inside this repo. On pnpm 9 the `pnpm.overrides` block is honoured
and the lockfile stays stable; without the pin, `pnpm dev` fails with
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.

### How local dev reaches the API

The Deriv upstreams only accept browser traffic from Deriv origins:

- the Core API answers CORS preflights from `localhost` with a **403**
- Ory omits `access-control-allow-origin` for `localhost`
- Ory cookies come back scoped to `Domain=deriv.com`, which a `localhost` origin
  cannot store

So `next dev` serves same-origin BFF proxies. The browser only ever talks to
`localhost`; the dev server makes the cross-origin call (servers have no CORS)
and strips the cookie `Domain` attribute on the way back.

| Browser calls | Proxy | Upstream |
|---|---|---|
| `/api/proxy/api/*` | `app/api/proxy/api/[...path]/route.ts` | `NEXT_PUBLIC_CORE_URL` |
| `/api/auth/*` | `app/api/auth/[...path]/route.ts` | `NEXT_PUBLIC_ORY_URL` |
| `/api/ory/{login,login-otp,verify-login-otp}` | `app/api/ory/*/route.ts` | Ory Kratos login flows |

WebSockets use the local dev server as an upgrade proxy. This forwards the
localhost session cookie to `NEXT_PUBLIC_SOCKET_URL` and presents the expected
Deriv origin to the upstream, while the browser connects only to localhost.

All of it is gated on `isLocalDev()` (`lib/is-local-dev.ts`), which checks
`process.env.NODE_ENV === "development"`. Next inlines that at build time, so in
a deployed build the proxy branches are dead-code eliminated (the proxy paths do
not appear in `.next/static` at all) and the proxy routes return 404. Deployed
environments authenticate through home.deriv.com as before.

`/login` renders nothing in a deployed build — the guard is in the server
component, so the form and its client JS are unreachable. It does serve the
"Page not found" body with a **200** status rather than 404: the root layout is
edge-rendered, calls `cookies()`, and wraps `children` in `<Suspense>`, so the
response is committed before the page component runs. That applies to any
rendered-then-`notFound()` route here.

## Commands

```bash
pnpm dev               # Start dev server
pnpm build             # Next.js build + Cloudflare Pages adapter (next-on-pages)
pnpm lint              # ESLint via next lint
npx tsc --noEmit       # TypeScript typecheck
pnpm test:e2e          # Playwright E2E tests (headless)
pnpm test:e2e:ui       # Playwright with interactive UI
pnpm test:e2e:headed   # Playwright in headed browser mode
pnpm test:e2e:debug    # Playwright debug mode
```

## Key Patterns

### State management

- **Server state** — React Query via `hooks/use-api-queries.ts`. Default 2-minute staleTime for balance queries.
- **Client state** — Zustand stores (`useUserDataStore`, `useMarketFilterStore`, `useOrderSidebarStore`). Use selectors to minimise re-renders.
- **Local UI state** — `useState` / `useReducer` inside components.

### API layer

All API calls go through `services/api/`. Each file maps to a backend domain (`api-auth.ts`, `api-buy-sell.ts`, `api-chat.ts`, ...). React Query hooks in `hooks/use-api-queries.ts` wrap these for data fetching.

### i18n

`useTranslations()` returns `{ t, locale }`. `t(key, params?)` resolves dotted keys (e.g. `"market.noBalanceTitle"`). English is the fallback for missing keys.

When adding a new string:
1. Add to `lib/i18n/translations/en.json` (required).
2. Add translated values to all other locale files (`bn, de, es, fr, it, ko, pl, pt, ru, sw, vi`).
3. Never hardcode user-facing strings in components.

### UI components

- Use `components/ui/` Radix wrappers (Button, Alert, Dialog, Tabs, ...) — never use raw HTML buttons or custom modals when a primitive exists.
- Follow the `cva` variant pattern for new primitives.
- Tailwind-first. Use design tokens from `tailwind.config.ts` (`bg-error-light`, `text-grayscale-100`, ...) — never hardcode hex colors.

### WebSocket

Single shared `WebSocketContext` wraps the whole app. Subscribe from components via `useWebSocketContext()`. Channels: `users/me`, `adverts/currency/{currency}/{type}`, `users_online`. Filter callbacks on `data.options.channel` before reading the payload.

### Auth (Ory Kratos)

Login: `GET /self-service/login/api` → `POST /self-service/login?flow={flowId}`. Session token passed via `X-Session-Token` header. See `services/api/api-auth.ts`.

### Routing

App Router. Use `useRouter()` / `useSearchParams()` / `usePathname()` from `next/navigation`. Deep links use URL search params (e.g. `/wallet?operation=TRANSFER`). Call `router.replace()` after consuming a deep-link param to keep the URL clean.

## pnpm Lockfile Policy

**Never edit or commit `pnpm-lock.yaml` / `pnpm-workspace.yaml` unless `package.json` intentionally changed.** If a hook or install accidentally modified lockfiles, revert before committing:

```bash
git checkout -- pnpm-lock.yaml pnpm-workspace.yaml
```

## Verification (run before PR)

```bash
npx tsc --noEmit   # typecheck
pnpm lint          # eslint
pnpm test:e2e      # playwright
```
