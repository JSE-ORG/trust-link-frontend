# Local Development & Mock Mode Guide

How to work on the TrustLink frontend without a funded Stellar account, a browser wallet, or a running backend, and how to set all of those up when you do need them.

> **Read this first: there is no single "mock mode" switch.** The repository has two mock environment flags, but neither one makes the running app usable without a wallet, and neither is read by the live payment page. Wallet-free work is done with **Storybook**, **Vitest** and **Playwright**, which stub the wallet and the API themselves. Section 2 spells out exactly what each flag does so you do not lose time on it.

---

## 1. Pick the right setup

| What you are doing | Use | Needs a wallet? | Needs the backend? |
|---|---|---|---|
| Styling, layout, copy, static pages | `npm run dev` | No | No (pages that call the API will show their error or empty states) |
| Building or fixing a component | Storybook (`npm run storybook`) | No | No |
| Logic, hooks, helpers, regressions | Vitest (`npm run test`) | No | No |
| Whole user flows (create link, pay, dispute) | Playwright (`npm run test:e2e`) | No (a fake Freighter is injected) | No (API calls are intercepted) |
| Real signing, real Soroban calls | Dev server + Freighter on Testnet + Friendbot | Yes | Yes (or a shared dev API) |

Prerequisites for everything: Node.js 22 (`nvm use` reads `.nvmrc`) and `npm ci`. See [CONTRIBUTING.md](../CONTRIBUTING.md#development-setup).

---

## 2. The two mock flags

Both are read from `.env.local` when the server starts (see [ENV_VARS.md](ENV_VARS.md)), both default to off, and both must stay off in any deployed environment.

### `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS=true`

- **Read by:** `isMockPaymentsEnabled()` in `lib/stellar/contract.ts`.
- **Effect:** `submitPayment(amount, destination, options)` skips the Soroban RPC and Freighter entirely and returns a deterministic synthetic hash. It still validates the destination address and the amount (a positive number with at most 7 decimals), so bad input still throws.
- **Hash format:** `mock-<amount>-<first 8 characters of destination>-<network in lower case>`. For example `submitPayment("100", "GDESTINATIONADDRESS...")` returns `mock-100-GDESTINA-testnet`. The prefix `mock-` makes a fake hash easy to recognize.
- **Per-call override:** pass `{ mock: true }` or `{ mock: false }` in the options to override the environment variable.
- **Limit:** today no page calls `submitPayment()`, so this flag changes nothing you can see in the UI. It matters for unit tests and for any future screen that uses the function.

### `NEXT_PUBLIC_USE_MOCKS=true`

- **Read by:** the `PaymentForm` component (`components/payment/PaymentForm.tsx`).
- **Effect:** the component uses `mockFetchTransactionXdr()` instead of building a real transaction (about 500 ms, returns the string `mock_xdr_base64_string_for_escrow_<escrowId>`) and `mockSubmitTransaction()` instead of the RPC (about 1 s, returns a pseudo-random hash shaped like `3f7a<8 hex digits>91bc`).
- **Limit 1:** the component still calls `signTransaction()` between those two steps. With a placeholder XDR, a real Freighter cannot sign it, so you only get through that step where the wallet is stubbed (Storybook, tests).
- **Limit 2:** the live payment page, `app/pay/[escrowId]/PaymentEscrowClient.tsx`, does not read this flag and does not render `PaymentForm`. Setting it will not change what `/pay/<id>` does.

A mock hash proves nothing about settlement. Never present one as a real transaction. For the boundary between wallet authentication, signing, submission and on-chain confirmation, read [PAYMENT_BOUNDARIES.md](PAYMENT_BOUNDARIES.md).

---

## 3. Working without a wallet or blockchain funds

### Dev server only

```bash
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. This is enough for layout and copy work and for pages that do not need data. Anything that calls the API (`NEXT_PUBLIC_API_URL`, default `http://localhost:3001`) will fail to load its data unless a backend is running. Do not treat those error states as bugs in your change.

### Storybook (component work)

```bash
npm run storybook   # http://localhost:6006
```

Stories live next to components as `*.stories.tsx`. `.storybook/mock-wallet.tsx` provides `MockWalletProvider`, which lets a story render any wallet state (`connected`, `disconnected`, `not-installed`, `loading`, `error`) with a fake public key and a fake `signTransaction`. `.storybook/mock-api.ts` provides sample escrows. `PaymentForm.stories.tsx` also drives the form through idle, loading, success and error states using its `preview*` props.

### Vitest (logic and components)

```bash
npm run test                                  # whole suite
npx vitest run lib/stellar/poll.test.ts       # one file
npx vitest                                    # watch mode
```

Tests run in jsdom with the Next.js and Stellar modules shimmed in `vitest.config.ts` and `vitest.setup.ts`. For wallet-dependent code, mock `useWallet`, as described in [CONTRIBUTING.md](../CONTRIBUTING.md#what-to-test). Stellar SDK calls are mocked in `lib/stellar/*.test.ts`; copy that pattern instead of calling a network.

### Playwright (full flows with a fake wallet and API)

The end-to-end suite needs neither Freighter nor a backend:

- `tests/e2e/helpers/mock-freighter.ts` injects a fake Freighter into the page (`mockFreighter(page, publicKey, signedXdr, { rejectSignature })`), including a "user declined" mode.
- `tests/e2e/helpers/mock-api.ts` intercepts API calls with fixtures from `tests/e2e/fixtures/` (`setupNetworkMocks`).

```bash
npx playwright install chromium   # one-time
npm run build                     # required: the suite runs `npm run start`
npm run test:e2e
npm run test:e2e:ui               # interactive debugger
```

See [TEST_SELECTION_AND_FIXTURES.md](TEST_SELECTION_AND_FIXTURES.md) for how the suites are selected in CI.

---

## 4. Running against real Testnet (Freighter + Friendbot)

Only needed when you are changing code that signs or submits transactions. Nothing here moves real money: Testnet lumens have no value.

### Step 1: install Freighter

1. Install the **Freighter** extension for Chrome, Firefox or Brave from [freighter.app](https://freighter.app).
2. Create a new wallet (or import a throwaway one). Use a dedicated development account. Never use a wallet that holds real funds, and never paste a secret key into this app or into `.env.local`: the app only ever asks Freighter to sign.
3. Open the extension and switch the network to **Testnet** using its network selector.

### Step 2: fund the account with Friendbot

Copy your public key (it starts with `G`) and ask Friendbot for Testnet XLM:

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY"
```

You can also open <https://friendbot.stellar.org/> and paste the key. A successful call returns a JSON body with a transaction hash, and the balance shows up in Freighter after a few seconds. XLM pays transaction fees; escrow amounts are in the escrow's asset, so you may need a Testnet balance of that asset as well.

### Step 3: configure the app

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001          # or a shared dev API
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_CONTRACT_ID=C...                        # the deployed escrow contract on Testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS=false
NEXT_PUBLIC_USE_MOCKS=false
```

`NEXT_PUBLIC_CONTRACT_ID` and the passphrase are blank in `.env.example`. Ask the maintainers for the current Testnet contract ID if you do not have one. Restart `npm run dev` after any change to `.env.local`, because `NEXT_PUBLIC_*` values are inlined at build time.

You also need the TrustLink backend running at `NEXT_PUBLIC_API_URL`, because wallet sign-in uses a SEP-10 challenge from the backend.

### Step 4: connect

Run `npm run dev`, open <http://localhost:3000/create> and use **Connect Wallet**. Freighter asks for permission the first time. For payment testing, create an escrow and open its `/pay/<escrowId>` link.

---

## 5. Troubleshooting Freighter and wallet errors

| Symptom | Likely cause | Fix |
|---|---|---|
| "Freighter not installed" or an install prompt, even though the extension is installed | `isFreighterInstalled()` asks the Freighter API whether it can be reached; the page cannot talk to the extension | Reload the tab after installing. Make sure the extension is enabled for the browser profile and for this site. If it still fails on `localhost`, enable Freighter's experimental mode, as noted in the [README troubleshooting section](../README.md#freighter-wallet-connection-issues) |
| Connect button does nothing, or the popup never appears | The extension is locked | Unlock Freighter, then try again |
| Signing fails or the signature is rejected by the network | The wallet is on a different network from the app | Freighter must show the same network as `NEXT_PUBLIC_STELLAR_NETWORK`. The app asks Freighter to sign for the passphrase of its configured network. If the wallet is on another network, signing can fail, or the network will reject the transaction |
| "Transaction was rejected in wallet" | You declined the request in Freighter. Any error message containing "reject" or "cancel" is shown this way | Retry and approve in the popup |
| "Escrow contract is unavailable" on the pay page | `NEXT_PUBLIC_CONTRACT_ID` is empty | Set it in `.env.local` and restart the dev server |
| "Invalid escrow contract ID" | The contract ID does not start with `C` | Check for a stale or copied-in account address (`G...`) |
| `TxFailed` / "Transaction failed: ..." | The network rejected or executed-and-failed the transaction | Read the result code that follows. Common causes are an unfunded account (run Friendbot), the wrong network, or a contract-level rejection |
| "Timed out waiting for transaction to be included in a ledger" | The pay page waits only about 10 seconds for confirmation, and the transaction may still land | Look the transaction up on Stellar Expert (testnet) before retrying, so you do not pay twice. |
| Browser console shows CORS errors, or pages load with no data | The backend is not running at `NEXT_PUBLIC_API_URL` | Start the backend or point the variable at a shared dev API |
| Wallet disconnects after a while | The session token expired; the app emits a session-expired event and clears the identity | Reconnect |
| Data looks stale after changing `.env.local` | `NEXT_PUBLIC_*` values are baked in when the server starts | Stop and restart `npm run dev` |

---

## 6. Out of scope

This guide does not cover running a standalone local Soroban node (for example the quickstart Docker image). Development targets the public Testnet.

## Related documents

- [CONTRIBUTING.md](../CONTRIBUTING.md): setup checklist, testing and PR process
- [ENV_VARS.md](ENV_VARS.md): every environment variable
- [PAYMENT_BOUNDARIES.md](PAYMENT_BOUNDARIES.md): mock flags versus real settlement
