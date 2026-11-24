# Contributing to TrustLink — Frontend

Thank you for contributing to TrustLink's frontend! This is the layer that real buyers and vendors interact with — the place where blockchain complexity disappears and trust becomes a feeling, not a technical argument.

Whether you're fixing a broken button on mobile, building a new dashboard page, or writing tests for a tricky wallet flow — your contribution has a direct impact on people's ability to transact safely.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Stellar Wave Program](#stellar-wave-program)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Component Guidelines](#component-guidelines)
- [Wallet & Blockchain Guidelines](#wallet--blockchain-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Accessibility Standards](#accessibility-standards)
- [Localization (i18n) Guidelines](#localization-i18n-guidelines)
- [Getting Help](#getting-help)

---

## Code of Conduct

Be kind, be constructive, and assume good intent. This project is built for social commerce communities in emerging markets — many of our future users are not technical. Design and code decisions should reflect that empathy.

Condescension, harassment, or gatekeeping will not be tolerated.

---

## 🌊 Stellar Wave Program

This repository is part of the **[Stellar Wave Program](https://www.drips.network/wave/stellar)** — a funded open-source sprint program by the Stellar Development Foundation. Contribute to labelled issues during an active Wave cycle and earn XLM rewards.

### How to Participate

1. Browse [`Stellar Wave`](../../issues?q=label%3A%22Stellar+Wave%22) and [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) labels
2. Log into [drips.network/wave](https://www.drips.network/wave) with your GitHub account
3. Apply to an issue — describe your approach briefly in the application
4. Once assigned, open a PR before the Wave cycle ends
5. Earn Points → earn rewards

### Point Values

| Label | Points | What it means |
|---|---|---|
| `complexity: trivial` | 100 pts | Small UI fix, missing label, copy change |
| `complexity: medium` | 150 pts | New component, bug fix, unit test suite |
| `complexity: high` | 200 pts | Full page implementation, major refactor, new integration |

> ⚡ Apply early during a Wave cycle. Maintainers assign contributors fast — don't apply without your dev environment ready to go.

---

## Before You Start

### Find an Issue

- **First-time contributor?** → [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) labels are pre-scoped with full context. You won't need to read the entire codebase.
- **Comfortable with React/Next.js?** → [`complexity: medium`](../../issues?q=label%3A%22complexity%3A+medium%22) issues are good next steps.
- **Want to go deep?** → Check the roadmap in the README or look for [`complexity: high`](../../issues?q=label%3A%22complexity%3A+high%22) issues.
- **Have your own idea?** → Open a [GitHub Discussion](../../discussions) before building. We want to merge your work — not close it because of overlap.

### Before Picking Up an Issue

- Check the issue for an existing linked PR — someone may already be working on it.
- Read any maintainer comments in the thread — the scope may have evolved.
- If your approach is non-obvious, leave a comment outlining it first. A quick ✅ from a maintainer saves you from building the wrong thing.

---

## Development Setup

> **Working without a wallet or backend?** Read the [Local Development & Mock Mode Guide](docs/LOCAL_DEVELOPMENT_MOCK_MODE.md). It explains what the two mock flags do (and do not do), how to work with Storybook, Vitest and Playwright without a wallet, and how to set up Freighter and Friendbot for real Testnet testing, with troubleshooting for common Freighter errors.

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | `22` | Matches `.nvmrc` and CI. Use [nvm](https://github.com/nvm-sh/nvm) (`nvm use` / `nvm install`) |
| npm | `10+` | Uses checked-in `package-lock.json`. Prefer `npm ci` for clean installs |
| Freighter Wallet | latest | [freighter.app](https://freighter.app) — only required for wallet and contract flows |
| Git | latest | |

### Clean-Clone Checklist

Follow this checklist when verifying a fresh repository checkout:

#### 1. Frontend-Only Verification (No Wallet or Backend Required)
- [ ] Run `nvm use` to activate Node.js 22 as specified in `.nvmrc`.
- [ ] Run `npm ci` for an exact, clean installation from `package-lock.json`.
- [ ] Run `npm run type-check` to verify TypeScript types across the codebase.
- [ ] Run `npm run lint` to execute ESLint rules.
- [ ] Run `npm run test` to execute Vitest unit tests.
- [ ] Run `npm run dev` and navigate to [http://localhost:3000](http://localhost:3000) to test UI components, responsive layouts, and static pages with fallback data.

#### 2. Wallet & Backend Integration (Testnet & Full Flows)
- [ ] Copy `.env.example` to `.env.local`: `cp .env.example .env.local`.
- [ ] Populate required contract and network settings in `.env.local`:
  - `NEXT_PUBLIC_CONTRACT_ID`: Soroban contract ID deployed to Testnet (left blank in `.env.example`).
  - `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`: `"Test SDF Network ; September 2015"` for Testnet (left blank in `.env.example`).
- [ ] Have the TrustLink backend running or point `NEXT_PUBLIC_API_URL` to an accessible dev instance.
- [ ] Install the Freighter browser extension, switch network to **Testnet**, and fund your address with [Friendbot](https://friendbot.stellar.org/).

### First-Time Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/trustlink-frontend
cd trustlink-frontend

# 2. Add upstream remote
git remote add upstream https://github.com/your-org/trustlink-frontend

# 3. Use the checked-in Node runtime
nvm use

# 4. Install dependencies using lockfile
npm ci

# 5. Set up environment variables
cp .env.example .env.local
# Note: NEXT_PUBLIC_CONTRACT_ID and NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE are blank in .env.example.
# Fill them in if testing live smart contract or testnet escrow flows.

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app should load with testnet configuration.

### Pre-Commit Hooks

Husky is installed automatically via the `prepare` script whenever you run `npm install` — no manual setup is needed.

The pre-commit hook runs `lint-staged`, which executes:

- **ESLint** on staged TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`), using the same config and flags as `npm run lint`.
- **Type checking** via `tsc --noEmit` when `.ts`/`.tsx` files are staged. This always runs against the **full project** — it cannot be scoped to only the staged files.

If a staged file fails lint or type-checking, the commit is blocked and the errors are printed to your terminal. Fix the reported issues, re-stage, and commit again.

> **Emergency bypass:** you can skip the hooks with `git commit --no-verify`. Only use this as a last resort — it bypasses the same quality gates that CI enforces, so anything you push must still pass the pipeline.

### Connecting to Testnet

For wallet-connected features, you'll need:
1. Freighter extension installed and set to **Testnet**
2. A funded testnet account — use [Friendbot](https://friendbot.stellar.org/) with your Freighter public key
3. The TrustLink backend running locally (see [trustlink-backend](https://github.com/your-org/trustlink-backend)) — or point `NEXT_PUBLIC_API_URL` to the shared dev environment

### Staying in Sync

```bash
git fetch upstream
git rebase upstream/main
```

---

## Project Structure

```
trustlink-frontend/
├── app/                            # Next.js App Router pages
│   ├── (vendor)/                   # Vendor-only authenticated routes
│   │   ├── dashboard/page.tsx      # Main vendor dashboard
│   │   ├── create/page.tsx         # Escrow link generator
│   │   └── disputes/page.tsx       # Vendor dispute view
│   ├── pay/[escrowId]/page.tsx     # Buyer payment page — PUBLIC
│   ├── track/[escrowId]/page.tsx   # Order tracking — PUBLIC
│   ├── dispute/[escrowId]/page.tsx # Buyer dispute submission — PUBLIC
│   ├── admin/                      # Admin panel routes
│   └── api/                        # API routes (server-side only logic)
│
├── components/
│   ├── ui/                         # shadcn/ui primitives — DO NOT EDIT directly
│   ├── escrow/                     # Escrow domain components
│   │   ├── EscrowLinkCard.tsx      # Shareable link display
│   │   ├── PaymentForm.tsx         # Buyer payment interaction
│   │   ├── TrackingTimeline.tsx    # Shipment status visual
│   │   └── DisputeForm.tsx         # Dispute submission form
│   ├── wallet/                     # Freighter wallet UI
│   │   ├── WalletConnectButton.tsx
│   │   └── WalletProvider.tsx      # Context provider — wraps the app
│   └── layout/                     # Header, footer, nav, page shells
│
├── hooks/                          # Custom React hooks
│   ├── useEscrow.ts                # Fetch + mutate escrow data
│   ├── useWallet.ts                # Freighter connect/sign helpers
│   └── useTracking.ts              # Poll tracking status
│
├── lib/
│   ├── stellar/                    # Stellar SDK wrappers
│   │   ├── contract.ts             # Soroban contract call helpers
│   │   ├── freighter.ts            # Freighter SDK integration
│   │   └── horizon.ts              # Horizon API utilities
│   └── api/                        # Backend API client functions
│
└── types/                          # Shared TypeScript types
```

**Key rules:**
- `components/ui/` — These are generated by shadcn/ui. Don't edit them directly. Add custom variants in a wrapper component.
- `app/api/` — Server-only code. Never import browser APIs or Freighter here.
- `lib/stellar/` — Keep Stellar SDK logic here. Pages and components should never import `stellar-sdk` directly.

---

## Making Changes

### Branching

```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
```

| Branch type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/qr-code-on-link-success` |
| Bug fix | `fix/short-description` | `fix/payment-form-mobile-overflow` |
| Tests | `test/short-description` | `test/wallet-hook-unit-tests` |
| Accessibility | `a11y/short-description` | `a11y/dispute-form-aria-labels` |
| Docs/copy | `docs/short-description` | `docs/update-onboarding-copy` |

---

## Component Guidelines

### General Rules

- Every component must have a clearly typed `props` interface — no `any`
- Use `shadcn/ui` primitives as the foundation — don't reinvent buttons, inputs, or dialogs
- Mobile layout is the primary concern — design for 375px width first, then scale up
- Async data states must always be handled: show a skeleton while loading, show an error state on failure — never leave the user staring at a blank section
- Avoid `useEffect` for data fetching — use the `hooks/` abstractions or React Server Components where possible

### Escrow-Specific UI Rules

- Any page where real money is involved must display a **trust badge** showing the escrow contract address
- State changes (`Funded`, `Shipped`, `Delivered`, `Disputed`) must be communicated with a visible status indicator — not just a console log or toast
- The buyer payment page must show the exact token amount and a breakdown of any fees before the wallet signature prompt

### Example: Adding a New Component

```tsx
// components/escrow/EscrowStatusBadge.tsx

interface EscrowStatusBadgeProps {
  state: EscrowState;
  className?: string;
}

const stateConfig: Record<EscrowState, { label: string; variant: BadgeVariant }> = {
  PENDING:   { label: "Awaiting Payment", variant: "outline" },
  FUNDED:    { label: "Funds Locked",     variant: "secondary" },
  SHIPPED:   { label: "In Transit",       variant: "warning" },
  COMPLETED: { label: "Delivered",        variant: "success" },
  DISPUTED:  { label: "Under Review",     variant: "destructive" },
  REFUNDED:  { label: "Refunded",         variant: "outline" },
};

export function EscrowStatusBadge({ state, className }: EscrowStatusBadgeProps) {
  const { label, variant } = stateConfig[state];
  return <Badge variant={variant} className={className}>{label}</Badge>;
}
```

---

## Wallet & Blockchain Guidelines

Wallet interactions are the most sensitive part of this codebase. Follow these rules carefully:

- **Never** store a user's private key, seed phrase, or raw secret anywhere — not in state, localStorage, or logs
- All transaction signing must go through `lib/stellar/freighter.ts` — no direct `window.freighter` calls in components
- Always show the user what they're signing in plain language before prompting Freighter
- After a transaction is submitted, poll for confirmation — don't assume it was included in a ledger
- Freighter availability should be checked gracefully — the buyer payment page must degrade if the user doesn't have Freighter installed

```typescript
// ✅ Correct — use the hook abstraction
const { signTransaction, isConnected } = useWallet();

// ❌ Wrong — bypasses error handling and type safety
const result = await window.freighter.signTransaction(xdr);
```

---

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short imperative description>

[optional body]

[optional footer: closes #123]
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | New component, page, or capability |
| `fix` | Bug fix |
| `test` | Adding or improving tests |
| `style` | CSS/Tailwind changes with no logic change |
| `a11y` | Accessibility improvement |
| `refactor` | Restructuring without behaviour change |
| `docs` | README, comments, copy updates |
| `chore` | Dependencies, config, tooling |

**Examples:**

```bash
git commit -m "feat(escrow): add QR code to link creation success page"
git commit -m "fix(payment): resolve amount overflow on small mobile screens"
git commit -m "a11y(dispute): add ARIA labels and keyboard nav to evidence upload"
git commit -m "test(wallet): add unit tests for useWallet disconnect flow"
```

---

## Pull Request Process

### Before Opening a PR

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Tests
npm run test

# Build (catches SSR and bundling errors)
npm run build
```

All four must pass — the CI enforces this.

### PR Checklist

- [ ] **What changed** — Clear description of the change
- [ ] **Why** — Motivation and link to the issue
- [ ] **Screenshots** — For any UI change, include before/after screenshots (mobile viewport required)
- [ ] **Tests** — What was tested and how
- [ ] **Accessibility** — Did you test with keyboard navigation? Screen reader if applicable?
- [ ] **Closes** — `Closes #123`

### PR Template

```markdown
## Summary
<!-- What does this PR change? -->

## Motivation
<!-- Why is this needed? Link to the issue. -->

## Screenshots
<!-- Before / After for UI changes. Mobile viewport required. -->

| Before | After |
|---|---|
| <!-- screenshot --> | <!-- screenshot --> |

## Testing
<!-- How did you test this? -->

## Checklist
- [ ] Type check passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Mobile layout tested
- [ ] No console errors

Closes #
```

### Review Turnaround

- Active Wave cycles: within **48 hours**
- Outside Wave: within **5 business days**
- 1 approving review required to merge
- Payment-related UI (PaymentForm, WalletConnectButton) requires 2 approvals

---

## Testing

TrustLink uses **Vitest** for unit/component tests and **Playwright** for end-to-end testing. See the [Test Selection & Fixture Architecture Guide](docs/TEST_SELECTION_AND_FIXTURES.md) for full details on module shims, SSR vs CSR fixtures, and CI job states.

```bash
# Unit + component tests (Vitest + React Testing Library)
npm run test

# Run a specific unit test file
npx vitest run components/providers/SubscriptionProvider.test.tsx

# Watch mode (interactive)
npx vitest

# Coverage report
npx vitest run --coverage

# Type checking
npm run type-check

# Linting
npm run lint

# End-to-end tests (Playwright — requires `npm run build` first)
npm run test:e2e

# Interactive Playwright debugger
npm run test:e2e:ui
```

### What to Test

- **Hooks** — Test logic in isolation from UI (mock the Stellar SDK)
- **Components** — Test render states: loading, error, empty, populated
- **Forms** — Test validation messages, submission flow, disabled states
- **Wallet flows** — Mock `useWallet` to test connected vs disconnected states

### Example: Testing a Component

```tsx
// __tests__/components/EscrowStatusBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";

describe("EscrowStatusBadge", () => {
  it("renders the correct label for FUNDED state", () => {
    render(<EscrowStatusBadge state="FUNDED" />);
    expect(screen.getByText("Funds Locked")).toBeInTheDocument();
  });

  it("renders destructive variant for DISPUTED state", () => {
    const { container } = render(<EscrowStatusBadge state="DISPUTED" />);
    expect(container.firstChild).toHaveClass("destructive");
  });
});
```

---

## Accessibility Standards

TrustLink is used by people across varying digital literacy levels, on a wide range of devices. Accessibility is not optional.

- All interactive elements must be reachable via keyboard (`Tab`, `Enter`, `Space`, `Escape`)
- All form fields must have associated `<label>` elements or `aria-label` attributes
- Color alone must never convey state — always pair with text or an icon
- Minimum contrast ratio: **4.5:1** for normal text, **3:1** for large text (WCAG AA)
- Images and icons must have `alt` text or `aria-hidden="true"` if decorative
- Modal dialogs must trap focus and return focus on close

Run a quick accessibility check before submitting:
```bash
# Install axe CLI (one-time)
npm install -g @axe-core/cli

# Scan a local page
axe http://localhost:3000/pay/test-escrow-id
```

---

## Localization (i18n) Guidelines

TrustLink is designed for cross-border and emerging-market trade. We support English (`en`), French (`fr`), and Nigerian Pidgin (`pcm`) using `i18next` and `react-i18next`. Full reference documentation is available in [docs/LOCALIZATION.md](docs/LOCALIZATION.md).

### 1. Key Nesting & Namespaces
Translations live in `locales/{en,fr,pcm}/translation.json`. Always nest new keys within the appropriate feature domain object (e.g. `dashboard`, `payment`, `tracking`, `dispute`, `common`):

```json
{
  "dashboard": {
    "title": "Dashboard",
    "selectedCount": "{{count}} selected",
    "buyer": "Buyer: {{buyer}}"
  }
}
```

In components:
```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
t("dashboard.selectedCount", { count: 3 });
```

### 2. Token Parity Rules
Interpolation tokens use double curly braces (`{{token}}`). **Tokens must never be translated or renamed across locale files.**
- ✅ English: `"Buyer: {{buyer}}"` → French: `"Acheteur : {{buyer}}"`
- ❌ French: `"Acheteur : {{acheteur}}"` *(broken interpolation)*

### 3. Beware the "Silent Fallback Trap"
`lib/i18n.ts` configures `fallbackLng: "en"`. If a key is missing from `fr` or `pcm`, `react-i18next` automatically resolves the English string.
> ⚠️ **Visual testing in a non-English locale alone is not sufficient** to verify translation completeness, because missing strings silently render in English without error. Always audit that every key added to `locales/en/translation.json` is mirrored in `locales/fr/translation.json` and `locales/pcm/translation.json`.

### 4. Testing Language Switching
Test local language switching in your browser console:
```javascript
// Switch to French and reload
localStorage.setItem("trustlink.language", "fr");
location.reload();

// Switch to Nigerian Pidgin
localStorage.setItem("trustlink.language", "pcm");
location.reload();
```

See [docs/LOCALIZATION.md](docs/LOCALIZATION.md) for automated key-parity auditing scripts and diagnostic instructions.

---

## Getting Help

- 💬 **GitHub Discussions** → [Ask a question](../../discussions/categories/q-a)
- 🐛 **GitHub Issues** → Confirmed bugs only — describe steps to reproduce
- 🌊 **Stellar Wave Discord** → [discord.gg/stellardev](https://discord.gg/stellardev) for real-time dev chat

Helpful external resources:
- [Next.js 14 App Router Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Freighter API Docs](https://docs.freighter.app)
- [Stellar SDK for JavaScript](https://stellar.github.io/js-stellar-sdk/)

---

> Every pixel you improve makes TrustLink safer and more accessible for the communities it's built for. Thank you for contributing.
