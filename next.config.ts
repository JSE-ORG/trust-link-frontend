import type { NextConfig } from "next";

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
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
