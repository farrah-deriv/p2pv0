import type { NextConfig } from "next"

const csp = [
  // Scripts: self + Next.js inline/eval + GTM + RudderStack + Datadog agent + Intercom + blob workers
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.rudderlabs.com https://cdn.datafile.net https://widget.intercom.io https://js.intercomcdn.com blob:",
  // Workers: Datadog RUM spawns a blob worker
  "worker-src 'self' blob:",
  // XHR/WS: Deriv APIs, Datadog intake, GTM, RudderStack, PostHog, Intercom
  "connect-src 'self' https://*.deriv.com wss://*.deriv.com https://browser-intake-datadoghq.com https://*.datadoghq.com https://www.google-analytics.com https://www.googletagmanager.com https://cdn.rudderlabs.com https://*.rudderstack.com https://*.posthog.com https://api-iam.intercom.io https://*.intercom.io wss://nexus-websocket-a.intercom.io wss://nexus-websocket-b.intercom.io https://uploads.intercomcdn.com https://uploads.intercomusercontent.com",
  // Frames: GTM noscript iframe
  "frame-src https://www.googletagmanager.com https://*.intercom.io",
  // Images: Intercom avatars and uploads
  "img-src 'self' data: blob: https: https://js.intercomcdn.com https://static.intercomassets.com https://uploads.intercomcdn.com https://uploads.intercomusercontent.com https://gifs.intercomcdn.com",
  // Styles: inline styles + Google Fonts (used by Intercom widget)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: Intercom widget fonts
  "font-src 'self' data: https://js.intercomcdn.com https://fonts.intercomcdn.com https://fonts.gstatic.com",
  // Everything else defaults to self
  "default-src 'self'",
].join("; ")

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
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
