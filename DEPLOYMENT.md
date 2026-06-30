# Deployment Smoke Test Checklist

Use this checklist after every production or preview deployment before marking it stable.

## 1. Deployment Health

- [ ] Confirm the deployment completed without build, lint, or type errors.
- [ ] Open the deployed URL in a clean browser session.
- [ ] Verify the home page loads without console errors.
- [ ] Confirm the app uses the expected release branch and commit SHA.
- [ ] Check `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` return successful responses.
- [ ] Confirm the fallback error page and `/offline` page render if their routes are opened directly.

## 2. Environment Configuration

- [ ] Confirm `NEXT_PUBLIC_API_URL` points to the intended backend environment.
- [ ] Confirm `NEXT_PUBLIC_STELLAR_NETWORK` is set to the intended network.
- [ ] Confirm `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_USDC_CONTRACT` are present.
- [ ] Confirm Horizon and Soroban RPC URLs are reachable from the deployed app.
- [ ] Verify analytics and error-reporting keys are set only for the intended environment.
- [ ] Confirm no local development secrets or test-only endpoints are exposed in the browser.

## 3. Core Page Checks

- [ ] Visit `/create` and confirm the vendor escrow creation page renders.
- [ ] Visit `/dashboard` and confirm the vendor dashboard handles loading, empty, and populated states.
- [ ] Visit `/pay/test-escrow-id` or a known test escrow link and confirm the buyer payment page renders.
- [ ] Visit `/track/test-escrow-id` or a known test tracking link and confirm the tracking page renders.
- [ ] Visit `/dispute/test-escrow-id` or a known test dispute link and confirm the dispute form renders.
- [ ] Visit `/admin/disputes` with an authorized account and confirm dispute data loads.
- [ ] Verify page metadata appears correctly for core public pages when shared or inspected.

## 4. Wallet And Payment Flow

- [ ] Open the app with Freighter unavailable and confirm wallet UI fails gracefully.
- [ ] Connect Freighter on the intended Stellar network.
- [ ] Confirm the connected public key displays where expected.
- [ ] Start escrow creation and verify required form validation messages appear.
- [ ] Create a test escrow link and confirm the generated URL can be copied.
- [ ] Open the generated buyer payment link in a new session.
- [ ] Confirm the buyer sees the exact token amount and fee breakdown before signing.
- [ ] Trigger a test signature prompt and verify the transaction summary is understandable.
- [ ] Confirm transaction submission shows a clear pending, success, or failure state.

## 5. Tracking And Disputes

- [ ] Confirm shipment status polling works for a known test escrow.
- [ ] Verify every tracking status has both text and a visible status indicator.
- [ ] Mark a vendor shipment as shipped in a test flow and confirm the tracking page updates.
- [ ] Submit a dispute with valid required fields.
- [ ] Confirm invalid dispute evidence or missing fields produce clear validation messages.
- [ ] Confirm the admin dispute detail page shows the submitted evidence.
- [ ] Resolve a test dispute and verify the user-facing status changes.

## 6. Notifications

- [ ] Trigger a test escrow creation event and confirm notification requests are sent.
- [ ] Trigger a shipment update and confirm notification requests are sent.
- [ ] Trigger a dispute submission and confirm notification requests are sent.
- [ ] Confirm notification failures do not block the primary user action.
- [ ] Verify user-facing notification toasts are readable on mobile and desktop.

## 7. Mobile And Accessibility

- [ ] Test the home, create, pay, track, dispute, and dashboard pages at 375px width.
- [ ] Confirm text, buttons, cards, and modals do not overflow or overlap.
- [ ] Navigate key flows with keyboard only.
- [ ] Confirm focus indicators are visible on interactive elements.
- [ ] Confirm form fields have labels or accessible names.
- [ ] Confirm status is communicated with text, not color alone.
- [ ] Verify light and dark themes remain readable.

## 8. Observability

- [ ] Confirm Sentry receives a test event from the deployed environment.
- [ ] Confirm analytics events fire only after user interactions that should be tracked.
- [ ] Review browser console output for errors and noisy warnings.
- [ ] Review network requests for unexpected 4xx or 5xx responses.
- [ ] Confirm rate-limited endpoints return clear user-facing errors.
- [ ] Check deployment logs for startup, route, and API errors.

## 9. Rollback Readiness

- [ ] Confirm the previous stable deployment is still available for rollback.
- [ ] Confirm release notes or deployment notes include the changed commit SHA.
- [ ] Confirm database, contract, or backend changes are backward compatible with this frontend.
- [ ] Confirm maintainers know who is on call for the first hour after release.
- [ ] Record unresolved issues, skipped checks, and follow-up owners before marking stable.

## Sign-Off

- [ ] Smoke test completed by:
- [ ] Deployment URL:
- [ ] Commit SHA:
- [ ] Date and time:
- [ ] Notes:
