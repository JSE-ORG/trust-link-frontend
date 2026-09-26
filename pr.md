# test: wallet transaction rejection E2E + EscrowLinkCard unit coverage

Closes #557
Closes #556

## What

Adds the two missing test suites, plus two small fixes that were needed to get
`main` building so the E2E suite can run.

### #557 — Playwright E2E for wallet rejection

- `tests/e2e/helpers/mock-freighter.ts` — new `MockFreighterOptions.rejectSignature`
  flag. When set, the mock answers `SUBMIT_TRANSACTION` with an `apiError`
  payload instead of a signed XDR — the exact shape `@stellar/freighter-api@6`
  returns when the user dismisses or declines the signing dialog. The option is a
  new optional 4th argument, so existing callers are untouched.
- `tests/e2e/payment-flow.spec.ts` — new `Buyer payment flow — wallet rejection`
  describe. The buyer fills contact details, clicks **Pay Now**, Freighter
  connects, and the challenge signature is rejected. The test asserts:
  - a sonner error toast naming the signature/auth failure is shown;
  - the success confirmation ("Freighter signature completed") never renders;
  - the **Pay Now** button re-enables so the buyer can retry.

### #556 — EscrowLinkCard unit tests

`components/escrow/__tests__/EscrowLinkCard.test.tsx` already existed; this adds
6 cases to it:

- **Card states** — renders nothing while the link is loading, then renders the
  loaded summary (status badge, formatted amount, escrow id, QR code).
- **Copy edge cases** — shows an error message when the Clipboard API is
  unavailable; ignores a second click while a copy is already in flight.
- **Native share** — WhatsApp uses the Web Share API and skips the app-scheme
  fallback when `navigator.share` exists; Instagram falls back to copying the
  share text when Web Share is unavailable.

> Note on the issue text: `EscrowLinkCard` has no per-status ("Pending" /
> "Funded" / "Completed") rendering — it fetches a fixed link internally and
> renders `link.status` as a plain badge (status-specific UI lives in
> `EscrowStatusBadge`). The added tests cover the component's real states and
> its clipboard/share interaction paths instead.

### Incidental fixes (main did not build)

- `lib/api.ts` — re-export `cancelEscrow` from the barrel. `VendorDashboardList`
  imports it from `@/lib/api`, but it was never re-exported after the function
  moved into `lib/api/client.ts`; Turbopack failed the production build.
- `lib/markdown.ts` — replace the `/s` (dotAll) regex flag with `[\s\S]`. The
  flag needs a TS target of ES2018+; the project targets ES2017, so the
  type-check step of `next build` failed. Behaviour is unchanged.

## Commits

1. `fix(api): re-export cancelEscrow from the lib/api barrel`
2. `fix(markdown): use ES2017-compatible regex for list wrapping`
3. `test(e2e): add signature-rejection mode to the Freighter mock`
4. `test(e2e): add wallet transaction rejection to payment flow (#557)`
5. `test: expand EscrowLinkCard unit coverage (#556)`

## Testing

- `npm test` — 442/442 pass (EscrowLinkCard suite: 22).
- `npm run test:e2e -- payment-flow` — 4/4 pass; stable across repeated and
  CI-mode (`workers: 1`) runs.
- `npx tsc --noEmit` — clean. `npx eslint` — clean on all touched files.
- Rejection test is meaningful: reverting the mock to the happy path makes it
  fail (no error toast, and it would also catch a wrongly-shown success), so it
  reliably fails if the rejection is left unhandled.

## Notes for reviewers / local run

- E2E needs env vars (same as the disabled `e2e-tests.yml` workflow):
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ID`,
  `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`.
- `@stellar/freighter-api@6.0.1` ships a `prepare: yarn build` script but no
  build toolchain; with newer npm this can abort `npm install`. `npm ci` on
  Node 22 (as in CI) is unaffected.
