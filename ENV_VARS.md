# Environment Variables

> 📖 **Canonical Documentation**: Full documentation for all environment variables, security rules, evaluation lifecycles, and consuming modules is maintained in [docs/ENV_VARS.md](docs/ENV_VARS.md).

---

## Quick Reference

This repository maintains its canonical environment documentation in [`docs/ENV_VARS.md`](docs/ENV_VARS.md). Refer to that document for full technical details on:

- **Effective Build-Time Validation**: The 4 variables enforced by `next.config.ts` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`).
- **Validation Script**: The standalone check in `env-validation.js`.
- **URL Configuration Comparison**: Detailed breakdown of `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_SOROBAN_RPC_URL`.
- **Client vs Server Exposure**: Public `NEXT_PUBLIC_` bundled keys vs server-only secret credentials.
- **Legacy & Unused Keys**: Clarification on `NEXT_PUBLIC_HORIZON_URL`, `NEXT_PUBLIC_USDC_CONTRACT`, and `NEXT_PUBLIC_BASE_URL`.

---

## Required Setup Variables

To start the application locally, copy `.env.example` to `.env.local` and ensure these 4 required keys are populated:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Soroban smart contract ID
NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

# Stellar network identifier (testnet | mainnet)
NEXT_PUBLIC_STELLAR_NETWORK=testnet

# Stellar network passphrase
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

For optional variables, rate limiting configuration, Sentry error tracking, PostHog analytics, and development flags, consult the [canonical documentation in docs/ENV_VARS.md](docs/ENV_VARS.md).
