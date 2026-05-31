# 🌐 TrustLink — Frontend

> **The Web2 experience. The Web3 guarantee.**

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Stellar](https://img.shields.io/badge/Stellar-Freighter%20SDK-7B68EE?style=flat-square&logo=stellar)](https://stellar.org)
[![Stellar Wave](https://img.shields.io/badge/Stellar%20Wave-Open%20Issues-blue?style=flat-square)](https://www.drips.network/wave/stellar)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

---

##  Overview

The TrustLink frontend is a **Next.js 14 web application** that makes decentralized escrow feel as simple as sending a payment link. Vendors generate a Smart Escrow Link in seconds. Buyers click a link, pay with a Stellar wallet, and their funds are held by a Soroban contract until the order is delivered.

No wallets to explain. No blockchain jargon. No friction.

### Key User Journeys

```
VENDOR FLOW                          BUYER FLOW
───────────────────────────────      ─────────────────────────────────
1. Connect Freighter wallet          1. Click Smart Escrow Link
2. Fill order form                   2. See order summary & price
   (item, price, shipping window)    3. Connect wallet or use hosted
3. Get a shareable link              4. Approve USDC payment
4. Share on WhatsApp / Instagram     5. Track shipment status
5. Track escrow status               6. Confirm delivery OR
6. Receive payout on delivery           raise a dispute
```

---

##  Features

- **🔗 Smart Link Generator** — Vendors create escrow links with one form. Links are shareable anywhere — DMs, bios, stories.
- **💳 Wallet-native Payments** — Integrates Freighter SDK for in-browser Stellar transaction signing. No private key exposure.
- **📦 Shipment Tracker** — Live shipment status pulled from logistics APIs (Terminal Africa / GIGL) displayed inline.
- **⚖️ Dispute Dashboard** — Buyers can flag issues, upload evidence, and track resolution status.
- **🔔 Real-time Notifications** — Email and SMS alerts via SendGrid/Twilio at every state change.
- **📱 Mobile-first Design** — Built for the social commerce audience — primarily on mobile.
- **🌍 No Crypto Knowledge Required** — Blockchain complexity is entirely abstracted from the buyer experience.

---

##  Architecture

```
trustlink-frontend/
│
├── app/                            # Next.js App Router
│   ├── (vendor)/                   # Vendor-authenticated routes
│   │   ├── dashboard/              # Vendor escrow dashboard
│   │   ├── create/                 # Smart Escrow Link generator
│   │   └── disputes/               # Outgoing dispute view
│   │
│   ├── pay/[escrowId]/             # Buyer payment page (public)
│   ├── track/[escrowId]/           # Order tracking page (public)
│   ├── dispute/[escrowId]/         # Buyer dispute submission
│   │
│   ├── admin/                      # Admin dispute resolution panel
│   └── api/                        # Next.js API routes
│       ├── escrow/                 # Escrow creation & status
│       ├── webhooks/               # Logistics API webhooks
│       └── notifications/          # Email/SMS triggers
│
├── components/
│   ├── ui/                         # shadcn/ui base components
│   ├── escrow/                     # Escrow-domain components
│   │   ├── EscrowLinkCard.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── TrackingTimeline.tsx
│   │   └── DisputeForm.tsx
│   ├── wallet/                     # Freighter wallet components
│   │   ├── WalletConnectButton.tsx
│   │   └── WalletProvider.tsx
│   └── layout/                     # Shared layout components
│
├── lib/
│   ├── stellar/                    # Stellar / Soroban SDK wrappers
│   │   ├── contract.ts             # Contract interaction helpers
│   │   ├── freighter.ts            # Freighter wallet integration
│   │   └── horizon.ts              # Horizon API utilities
│   ├── api/                        # Backend API client
│   └── utils/                      # Shared utilities
│
├── hooks/                          # Custom React hooks
│   ├── useEscrow.ts
│   ├── useWallet.ts
│   └── useTracking.ts
│
└── types/                          # Shared TypeScript types
```

---

##  Getting Started

### Prerequisites

- Node.js `18.17+`
- npm / yarn / pnpm
- [Freighter Wallet](https://freighter.app/) browser extension (for testing wallet flows)
- A running instance of the [TrustLink Backend](https://github.com/your-org/trustlink-backend)

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=C...              # Your deployed Soroban contract ID
NEXT_PUBLIC_USDC_CONTRACT=C...            # USDC token contract address (testnet)

# Horizon RPC
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-org/trustlink-frontend
cd trustlink-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

##  Key Integrations

### Freighter Wallet (Stellar)

Wallet interactions are wrapped in a reusable hook:

```typescript
import { useWallet } from "@/hooks/useWallet";

const { isConnected, publicKey, signTransaction } = useWallet();

// Connect wallet
await connect();

// Sign and submit a Soroban contract call
const result = await signTransaction(xdr, { network: "TESTNET" });
```

### Soroban Contract Calls

Smart Escrow Link generation triggers a contract interaction:

```typescript
import { fundEscrow } from "@/lib/stellar/contract";

// Buyer funds the escrow — this prompts Freighter for signature
const { hash } = await fundEscrow({
  escrowId,
  buyerAddress: publicKey,
  amount: BigInt(escrow.amount),
});
```

### Logistics API (Terminal Africa)

Real-time shipment status is polled from the backend and rendered as a visual timeline:

```typescript
import { useEscrow } from "@/hooks/useEscrow";

const { data: escrow, isLoading, error, refetch } = useEscrow(escrowId, {
  pollingInterval: 30_000,
});

// Tracking pages can revalidate escrow status while they are open.
```

---

##  Testing

```bash
# Unit tests (Jest + React Testing Library)
npm run test

# End-to-end tests (Playwright)
npm run test:e2e

# Type checking
npm run type-check

# Lint
npm run lint
```

### Test Coverage Goals

- [ ] Wallet connect / disconnect flows
- [ ] Escrow link generation form validation
- [ ] Payment page — funded vs unfunded state
- [ ] Tracking timeline rendering
- [ ] Dispute form submission
- [ ] Mobile responsiveness (Playwright viewport tests)

---

##  Design System

TrustLink uses **shadcn/ui** components built on Radix UI primitives, styled with TailwindCSS. The design language is intentionally clean and "trust-signalling" — we're asking people to commit real money through a social media link.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#1B2A6B` (navy) | CTAs, headers |
| `--accent` | `#7B68EE` (stellar purple) | Highlights, links |
| `--success` | `#22C55E` | Delivery confirmed, funds released |
| `--warning` | `#F59E0B` | In transit, awaiting confirmation |
| `--destructive` | `#EF4444` | Dispute raised, errors |

### Component Rules

- All payment-facing pages must show the escrow contract address in a visible `trust badge`.
- State changes (Funded, Shipped, Completed) must trigger visible feedback — no silent updates.
- Skeleton loaders for all async data — no layout shift.

---

## Contributing via Stellar Wave

This repo is part of the **[Stellar Wave Program](https://www.drips.network/wave/stellar)** — join the sprint, pick an issue, earn rewards.

### Good First Issues

Look for [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) and [`Stellar Wave`](../../issues?q=label%3A%22Stellar+Wave%22) labels.

**Example beginner-friendly tasks:**
- Add loading skeleton to the `TrackingTimeline` component
- Improve mobile layout of the payment confirmation page
- Add form field validation messages to `EscrowLinkGenerator`
- Write a unit test for `useWallet` hook
- Improve accessibility (ARIA labels) on the dispute form

**Example medium tasks:**
- Implement dark mode support
- Add a "Copy Link" with QR code generator on the link creation success page
- Build the vendor analytics dashboard page
- Add i18n support for Nigerian Pidgin / French (West Africa focus)

### Contribution Workflow

```bash
# 1. Fork the repo and create your branch
git checkout -b feat/your-feature-name

# 2. Make your changes and write tests

# 3. Ensure everything passes
npm run test && npm run lint && npm run type-check

# 4. Commit using conventional commits
git commit -m "feat: add QR code to escrow link success page"

# 5. Open a Pull Request — describe what you did and reference the issue
```

---

## 🗺️ Roadmap

- [x] Vendor dashboard (escrow creation, link sharing)
- [x] Buyer payment page (wallet connect + fund)
- [x] Order tracking timeline
- [x] Dispute form
- [ ] Admin dispute resolution panel
- [ ] Vendor analytics dashboard (transaction volume, payout history)
- [ ] Mobile app wrapper (React Native / PWA)
- [ ] WhatsApp Pay integration (for non-wallet buyers)
- [ ] Multi-language support (FR, HA, YO)
- [ ] Vendor pro tier (custom branding)

---

## 📜 License

MIT © TrustLink Contributors

---

> Powered by Next.js · Secured by Stellar Soroban · Part of the Stellar Wave ecosystem.
