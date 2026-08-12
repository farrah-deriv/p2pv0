import type { NextConfig } from "next"

const csp = [
  // Scripts: self + Next.js inline/eval + GTM + RudderStack + Datadog agent + blob workers
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.rudderlabs.com https://cdn.datafile.net blob:",
  // Workers: Datadog RUM spawns a blob worker
  "worker-src 'self' blob:",
  // XHR/WS: Deriv APIs, Datadog intake, GTM, RudderStack, PostHog (host may vary)
  "connect-src 'self' https://*.deriv.com wss://*.deriv.com https://browser-intake-datadoghq.com https://*.datadoghq.com https://www.google-analytics.com https://www.googletagmanager.com https://cdn.rudderlabs.com https://*.rudderstack.com https://*.posthog.com",
  // Frames: GTM noscript iframe
  "frame-src https://www.googletagmanager.com",
  // Images
  "img-src 'self' data: blob: https:",
  // Styles: inline styles used throughout
  "style-src 'self' 'unsafe-inline'",
  // Fonts
  "font-src 'self' data:",
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
