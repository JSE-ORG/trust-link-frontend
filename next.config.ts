import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_CONTRACT_ID",
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `

Missing required environment variable: ${key}
` +
        `Add it to .env.local or your deployment environment before building.
`
    );
  }
}

const nextConfig: NextConfig = {
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stellarexpert.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "testnet.stellarexpert.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
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
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot|otf)",
        locale: false,
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/:path*.(json|pdf|txt|xml|webmanifest)",
        locale: false,
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
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
  sourcemaps: { disable: true },
});
