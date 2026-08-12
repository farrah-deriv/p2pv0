import type { NextConfig } from "next"

// Turbopack's dev bundle uses eval() for HMR; production builds do not.
// Scope 'unsafe-eval' to development only — same pattern as home-app.
const isDev = process.env.NODE_ENV === "development"

// Google ccTLDs the browser pings for GTM's Google Ads remarketing +
// conversion beacons. Shared by `img-src` (1p-user-list image beacons)
// and `connect-src` (/ccm/collect, /rmkt/collect, /pagead/form-data).
// Keeping both directives in sync from one constant prevents drift.
// Extend this list when a new market starts firing RUM violations.
const googleCcTldSources = [
  "https://www.google.com",
  "https://www.google.ae",
  "https://www.google.bf",
  "https://www.google.bj",
  "https://www.google.ca",
  "https://www.google.ci",
  "https://www.google.cl",
  "https://www.google.cm",
  "https://www.google.co.bw",
  "https://www.google.co.id",
  "https://www.google.co.il",
  "https://www.google.co.in",
  "https://www.google.co.jp",
  "https://www.google.co.ke",
  "https://www.google.co.kr",
  "https://www.google.co.nz",
  "https://www.google.co.th",
  "https://www.google.co.tz",
  "https://www.google.co.ug",
  "https://www.google.co.uk",
  "https://www.google.co.za",
  "https://www.google.co.zm",
  "https://www.google.co.zw",
  "https://www.google.com.ar",
  "https://www.google.com.au",
  "https://www.google.com.br",
  "https://www.google.com.ec",
  "https://www.google.com.eg",
  "https://www.google.com.gh",
  "https://www.google.com.hk",
  "https://www.google.com.jm",
  "https://www.google.com.mx",
  "https://www.google.com.my",
  "https://www.google.com.ng",
  "https://www.google.com.ph",
  "https://www.google.com.pk",
  "https://www.google.com.sa",
  "https://www.google.com.sg",
  "https://www.google.com.tr",
  "https://www.google.com.vn",
  "https://www.google.de",
  "https://www.google.es",
  "https://www.google.fr",
  "https://www.google.it",
  "https://www.google.mg",
  "https://www.google.mn",
  "https://www.google.nl",
  "https://www.google.pl",
  "https://www.google.ru",
  "https://www.google.se",
  "https://www.google.tg",
].join(" ")

// script-src and script-src-elem share the same allowlist.
// Setting script-src-elem explicitly avoids CSP L3 browser quirks where
// browsers consult the element-specific directive for <script> tags even
// when only the parent script-src is set (observed with Cloudflare Turnstile).
// 'wasm-unsafe-eval' — minimal WASM compilation permission (dotlottie-web);
// does NOT allow arbitrary JS eval.
// ph.deriv.{com,me,be} — self-hosted PostHog proxy; the SDK loads recorder/
// survey/web-vitals plugins dynamically from the configured API host.
// These are subdomains of *.deriv.{com,me,be} which covers connect-src, but
// default-src does NOT fall back for scripts when script-src is explicitly
// set — they must be listed here explicitly (same fix as home-app).
const scriptSources = `'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://cdn.rudderlabs.com https://cdn.datafile.net https://ph.deriv.com https://ph.deriv.me https://ph.deriv.be https://widget.intercom.io https://js.intercomcdn.com https://static.cloudflareinsights.com https://challenges.cloudflare.com blob:`

// style-src and style-src-elem share the same allowlist — same rationale as scripts.
const styleSources = `'self' 'unsafe-inline' https://fonts.googleapis.com`

const csp = [
  // default-src: fallback for un-explicitly-listed resource types (e.g. prefetch).
  // Widened to Deriv TLD wildcards so Chromium (which consults default-src for
  // <link rel="prefetch"> after removing prefetch-src in 2023) doesn't block
  // cross-origin Deriv prefetches.
  "default-src 'self' https://*.deriv.com https://*.deriv.be https://*.deriv.me",

  `script-src ${scriptSources}`,
  // Mirrors script-src to prevent browser-specific CSP L3 fallback ambiguity.
  `script-src-elem ${scriptSources}`,

  `style-src ${styleSources}`,
  // Mirrors style-src for the same reason as script-src-elem.
  `style-src-elem ${styleSources}`,

  // font-src: Intercom widget fonts + Google Fonts.
  // data: omitted — no data-URI fonts in use.
  "font-src 'self' https://fonts.gstatic.com https://js.intercomcdn.com https://fonts.intercomcdn.com",

  // img-src: enumerate specific origins; avoid the https: scheme wildcard.
  // googleCcTldSources — GTM fires 1p-user-list image beacons to the visitor's
  // local Google domain; same list as connect-src.
  // cdn.novu.co — Novu notification icons/avatars.
  `img-src 'self' data: blob: https://www.googletagmanager.com ${googleCcTldSources} https://translate.google.com https://fonts.gstatic.com https://assets.deriv.com https://assets.deriv.be https://assets.deriv.me https://static.intercomassets.com https://js.intercomcdn.com https://uploads.intercomcdn.com https://uploads.intercomusercontent.com https://gifs.intercomcdn.com https://downloads.intercomcdn.com https://cdn.novu.co`,

  // media-src: Deriv asset CDNs (video / audio used in onboarding flows).
  "media-src 'self' https://assets.deriv.com https://assets.deriv.be https://assets.deriv.me",

  // connect-src: every XHR/WS/fetch endpoint the app calls.
  //
  // https://*.analytics.google.com — GA4 sends /g/collect to REGIONAL hosts
  //   (region1.analytics.google.com, etc.) based on visitor location; wildcard
  //   covers new shards. analytics.google.com kept alongside (CSP wildcard
  //   does NOT match the bare parent).
  // googleCcTldSources — GTM conversion/remarketing beacons (/ccm/collect,
  //   /rmkt/collect, /pagead/form-data). Shared with img-src.
  // https://*.intercom-messenger.com — Intercom messenger uses a separate domain
  //   in addition to *.intercom.io; both HTTPS and WSS needed.
  // wss://*.novu.co — Novu real-time WebSocket (unread count, live notifications).
  // translate.googleapis.com — Chrome browser auto-translate; blocking it
  //   generates ~2 k+ RUM events/day on translated pages.
  `connect-src 'self' https://*.deriv.com wss://*.deriv.com https://*.deriv.be https://*.deriv.me https://browser-intake-datadoghq.com https://*.datadoghq.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com ${googleCcTldSources} https://www.googletagmanager.com https://cdn.rudderlabs.com https://api.rudderstack.com https://deriv-dataplane.rudderstack.com https://cdn.datafile.net https://eu.i.posthog.com https://eu-assets.i.posthog.com https://api-iam.intercom.io https://widget.intercom.io https://js.intercomcdn.com https://uploads.intercomcdn.com https://uploads.intercomusercontent.com wss://*.intercom.io https://*.intercom-messenger.com wss://*.intercom-messenger.com https://api.novu.co wss://*.novu.co https://static.cloudflareinsights.com https://cloudflareinsights.com https://challenges.cloudflare.com https://translate.googleapis.com https://translate-pa.googleapis.com`,

  // frame-src: GTM noscript iframe, Intercom, Cloudflare Turnstile widget.
  "frame-src 'self' https://www.googletagmanager.com https://*.intercom.io https://challenges.cloudflare.com",

  // worker-src: Datadog RUM spawns a blob: worker; 'self' not needed.
  "worker-src blob:",

  // frame-ancestors: block all cross-origin framing (clickjacking protection).
  "frame-ancestors 'self'",
].join("; ")

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // X-Frame-Options: defence-in-depth for scanners/proxies that check
          // this header; modern browsers prefer frame-ancestors above.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME-type sniffing attacks.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the origin on same-origin requests; only send the origin (no
          // path/query) on cross-origin requests; omit the header on downgrade.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not used by this app.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icons/dp2p.svg",
        permanent: false,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.module?.rules?.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('cookie');
      } else if (typeof config.externals === 'object') {
        config.externals['cookie'] = 'commonjs cookie';
      }
    }
    return config;
  },
}

export default nextConfig
