# Payment Mock Flags & Production Funding Boundaries

This guide provides an authoritative explanation of the payment mock flags implemented in the TrustLink codebase, the distinction between local mock behavior and live on-chain execution, and the boundary between wallet authentication and confirmed escrow settlement.

---

## 1. Implemented Mock Flags & Code Paths

TrustLink includes two distinct environment flags that alter payment execution paths during local development and testing. Both flags default to `false` and must remain disabled in production.

| Flag Name | Default Value | Declaring File | Call Sites & Affected Code Paths | Behavior When Enabled (`"true"`) |
|---|---|---|---|---|
| `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS` | `false` (unset) | `lib/stellar/contract.ts`<br/>(also listed in `.env.example`) | `submitPayment()` in `lib/stellar/contract.ts`<br/>*(checked via `isMockPaymentsEnabled()`)* | Bypasses the Soroban RPC network call and account sequence resolution. Validates destination format and amount, then returns a deterministic synthetic hash: `mock-${amount}-${destination.slice(0, 8)}-${network.toLowerCase()}`. |
| `NEXT_PUBLIC_USE_MOCKS` | `false` (unset) | `components/payment/PaymentForm.tsx` | `handlePaymentSubmit()` in `components/payment/PaymentForm.tsx`<br/>*(lines 203, 214)* | 1. Swaps `buildFundingTransactionXdr()` for `mockFetchTransactionXdr(escrowId)` (returns dummy base64 string after 500ms).<br/>2. Swaps `submitTransaction()` for `mockSubmitTransaction(signedXdr)` (returns pseudo-random hash `3f7a...91bc` after 1000ms). |

### Flag Precedence and Overrides

- In `submitPayment()`, callers can pass `{ mock: true }` in `SubmitPaymentOptions` to override the environment variable for unit tests (`const useMock = options.mock ?? isMockPaymentsEnabled()`).
- In `PaymentForm.tsx`, `USE_MOCKS` is evaluated statically at build/runtime from `process.env.NEXT_PUBLIC_USE_MOCKS`. When false, it requires:
  - Valid `NEXT_PUBLIC_CONTRACT_ID` (starts with `C`).
  - Active Stellar network configuration (`NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`).
  - Accessible Soroban RPC endpoint (`NEXT_PUBLIC_SOROBAN_RPC_URL`).

---

## 2. The Four Stages of the Payment Pipeline

Contributors must distinguish between the four sequential stages of payment processing. Success in an early stage does not imply completion of a later stage:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌───────────────────────────┐
│ 1. AUTHENTICATE │ ───> │    2. SIGN      │ ───> │   3. SUBMIT     │ ───> │ 4. CONFIRM & SETTLE       │
│ Freighter/SEP-10│      │ Local Wallet    │      │ Soroban RPC     │      │ Ledger Closed / Contract  │
│ (Identity Only) │      │ (Cryptographic) │      │ (In Mempool)    │      │ State Transition Verified │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └───────────────────────────┘
```

### Stage 1: Authentication (Identity Only)
- **Mechanism**: Connecting Freighter wallet (`isConnected()`, `getPublicKey()`) or running the SEP-10 challenge-response exchange (`/auth/challenge` -> sign challenge -> `/auth/verify` -> JWT).
- **Scope**: Authenticates the user's Stellar public key.
- **Guarantee**: Confirms who the user is. **Zero funds are moved, no smart contract is invoked, and no transaction is submitted.**

### Stage 2: Transaction Building & Signing (Authorization)
- **Mechanism**:
  - `buildFundingTransactionXdr()` constructs the Soroban contract call for method `fund_escrow`.
  - `signTransaction(xdr, networkPassphrase)` prompts the user's Freighter extension to sign the XDR.
- **Scope**: Produces a cryptographically signed transaction envelope with the buyer's authorization.
- **Guarantee**: Confirms the buyer authorized the transaction. **The transaction has NOT yet reached the Stellar network or been accepted into a ledger.**

### Stage 3: Submission (Mempool Ingestion)
- **Mechanism**:
  - `submitTransaction()` sends the signed transaction to the Soroban RPC via `server.sendTransaction(tx)`.
  - RPC validates basic syntax, sequence number, and account balance, returning a transaction hash and status `PENDING`.
- **Scope**: The transaction has entered the network node's mempool.
- **Guarantee**: The network acknowledged receipt. **The transaction is NOT confirmed or finalized. It may still fail, expire, or be rejected during ledger inclusion.**

### Stage 4: Confirmation & Settlement (Finality)
- **Mechanism**:
  - The client polls `server.getTransaction(hash)` until status changes from `NOT_FOUND` to `SUCCESS`.
  - Validates `resultXdr` to ensure contract execution succeeded without Soroban errors (`TxFailed`, `TxExpired`).
- **Scope**: A Stellar validator closed the ledger containing the transaction. The Soroban escrow contract state transitioned from `PENDING` to `FUNDED`.
- **Guarantee**: **True settlement proof.** Funds are verifiably locked in the escrow smart contract on the blockchain.

---

## 3. Playwright E2E Fixture Behavior vs Live Settlement

### What E2E Success Proves

In `tests/e2e/payment-flow.spec.ts`, tests utilize `mockFreighter(page, MOCK_PUBLIC_KEY, MOCK_SIGNED_XDR)` to inject a stubbed `window.freighter` object into the browser context.

The test asserts:
```typescript
await expect(page.getByText(/Freighter signature completed/i).first()).toBeVisible({ timeout: 5_000 });
```

This verifies that:
1. The DOM form renders input fields, labels, and action buttons properly.
2. The UI handles user input and updates state.
3. The component triggers the wallet hook and detects successful resolution of `window.freighter.signTransaction`.
4. Client feedback (toasts, badge indicators) responds to simulated wallet resolution.

### What E2E Tests Do NOT Prove

- E2E tests **do not** interact with the Stellar network or Soroban RPC.
- E2E tests **do not** move testnet tokens or call smart contracts.
- E2E success asserts **client-side UI flow and signature handling**, **NOT on-chain funding confirmation or token transfer**.

---

## 4. Production Guidance: Synthetic Hashes Are Never Settlement Proof

> [!WARNING]
> Synthetic transaction hashes generated by development mock paths (`mock-...` or `3f7a...91bc`) provide **zero proof of funds transfer or escrow settlement**.
> Never treat mock hashes as confirmation of payment in production environments or user-facing settlement verification.

### Validating Live Transactions on Testnet / Mainnet

When testing with live contracts on Stellar Testnet or Mainnet:

1. **Verify On-Chain Status**:
   - Check the transaction hash on Stellar Expert:
     - Testnet: `https://stellar.expert/explorer/testnet/tx/<TX_HASH>`
     - Mainnet: `https://stellar.expert/explorer/public/tx/<TX_HASH>`
   - Confirm that the operation shows contract method `fund_escrow` completed with result `txSUCCESS`.

2. **Verify Contract Storage / Escrow State**:
   - Query the contract via Soroban RPC `getContractData` or invoke backend endpoint `GET /escrow/:id`.
   - Confirm the escrow's on-chain status transitioned to `FUNDED`.

3. **Check Token Balances**:
   - Verify that the buyer's balance decreased by the escrow amount plus protocol fees.
   - Verify that the contract balance holds the escrowed USDC.

4. **Environment Health Check**:
   - Ensure `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS=false` (or unset) in `.env.local`.
   - Ensure `NEXT_PUBLIC_USE_MOCKS=false` (or unset) in `.env.local`.
   - Populate `NEXT_PUBLIC_CONTRACT_ID` with a deployed Soroban contract address on Testnet.
