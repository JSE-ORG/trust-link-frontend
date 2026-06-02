import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Validated at config-load time so `next build` and `next dev` fail immediately
// with a clear message instead of surfacing a cryptic undefined at runtime.
// Validated at config-load time (next build / next dev). Fail fast with a
// clear message rather than surfacing a cryptic runtime undefined later.
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_CONTRACT_ID",
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `\n\nMissing required environment variable: ${key}\n` +
        `Add it to .env.local or your deployment environment before building.\n`
    );
  }
}

const nextConfig: NextConfig = {
  // swcMinify is always-on in Next.js 15+ and has no config toggle.
  // swcMinify is always-on in Next.js 15+ and cannot be set explicitly.
  compress: true,

  images: {
    remotePatterns: [
      // Stellar Expert contract explorer (mainnet)
      {
        protocol: "https",
        hostname: "stellarexpert.io",
        pathname: "/**",
      },
      // Stellar Expert contract explorer (testnet)
      {
        protocol: "https",
        hostname: "testnet.stellarexpert.io",
        pathname: "/**",
      },
      // S3 evidence bucket — virtual-hosted-style, global endpoint
      // S3 evidence bucket — virtual-hosted-style (us-east-1 and global)
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      // S3 evidence bucket — virtual-hosted-style, region-scoped endpoint
      // S3 evidence bucket — virtual-hosted-style with explicit region
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      // Common image hosting services for escrow item images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.imgix.net",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    const sorobanRpcUrl =
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const preconnectTargets = [sorobanRpcUrl, apiUrl].filter(Boolean);
    const linkHeaderValue = preconnectTargets.map((url) => `<${url}>; rel=preconnect`).join(", ");

    // ── Content-Security-Policy (issue #111) ─────────────────────────────────
    // Restrictive policy that still permits the origins the app legitimately
    // needs: the Stellar Soroban RPC, the backend API, Sentry ingestion, and the
    // image hosts already whitelisted under images.remotePatterns. Next.js needs
    // 'unsafe-inline' for its injected styles and (in dev) 'unsafe-eval' for the
    // React Refresh runtime, so eval is only enabled outside production.
    const isProd = process.env.NODE_ENV === "production";
    const connectSrc = [
      "'self'",
      sorobanRpcUrl,
      apiUrl,
      "https://horizon.stellar.org",
      "https://horizon-testnet.stellar.org",
      "https://*.sentry.io",
      "https://*.ingest.sentry.io",
    ].filter(Boolean);

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://stellarexpert.io https://testnet.stellarexpert.io https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com https://images.unsplash.com https://*.cloudinary.com https://*.imgix.net",
      "font-src 'self' data:",
      `connect-src ${connectSrc.join(" ")}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Link", value: linkHeaderValue },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
});
