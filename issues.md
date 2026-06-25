#190 perf: lazy-load TrackingTimeline to reduce buyer payment page bundle

Problem
The TrackingTimeline component (and its logistics-API dependencies) is currently imported statically on the buyer payment page. Buyers who haven't yet paid don't need the timeline at all, but they pay the JS parse cost upfront on every load.

Proposed solution
Replace the static import with a next/dynamic lazy import guarded by the escrow payment state:

const TrackingTimeline = dynamic(
  () => import('@/components/escrow/TrackingTimeline'),
  { loading: () => <TrackingTimelineSkeleton />, ssr: false }
);

// Only rendered after payment is confirmed
{isPaid && <TrackingTimeline escrowId={escrowId} />}
Acceptance criteria
 TrackingTimeline and its imports are absent from the initial JS bundle for unpaid escrows (verify with next build + bundle analysis).
 A skeleton placeholder is shown while the chunk loads.
 No regression in Playwright e2e tracking tests.
 Lighthouse performance score on pay/[escrowId] improves by ≥ 5 points (document before/after).


#191 bug: mobile soft keyboard pushes PaymentForm CTA button off screen on iOS Safari

Description
On iOS Safari, when a buyer taps any input in PaymentForm (wallet address, amount), the soft keyboard slides up and pushes the "Pay Now" button partially or fully off screen. Scrolling to the button is unintuitive and causes drop-off.

Steps to reproduce
Open pay/[escrowId] on an iPhone (Safari, iOS 16+).
Tap the wallet address input — keyboard appears.
Observe the "Pay Now" button is no longer visible without dismissing the keyboard.
Root cause
The payment page uses min-h-screen with a fixed footer button. iOS Safari's dynamic viewport height (100vh) does not account for the soft keyboard, so the layout overflows.

Suggested fix
Use dvh units (min-h-[100dvh]) where supported, with min-h-screen fallback.
Position the sticky CTA inside the scrollable form area rather than as a fixed footer.
Test with the iOS simulator and real devices at viewport widths 375 px and 390 px.
Files likely affected
app/pay/[escrowId]/page.tsx
components/escrow/PaymentForm.tsx


#192 feat: dark mode support across all pages

Context
TrustLink targets a mobile-first social-commerce audience. A large share of mobile users keep their device in dark mode permanently. There is currently no dark-mode theme, which results in a harsh white UI and poor UX for these users.

Proposed solution
Use the existing Tailwind dark: variant throughout the codebase (Tailwind is already configured in the project).
Set darkMode: 'class' in tailwind.config.ts and sync it with prefers-color-scheme via a ThemeProvider.
Persist the user's preference in localStorage.
Add a toggle button in the vendor dashboard header and on the buyer payment page.


#193 chore: add Storybook stories for EscrowLinkCard, PaymentForm, and DisputeForm
Repo Avatar
JSE-ORG/trust-link-frontend
Context
The project has a .storybook configuration but the three core escrow-domain components — EscrowLinkCard, PaymentForm, and DisputeForm — have no stories. This makes visual regression testing, design review, and isolated development harder.

Tasks
EscrowLinkCard.stories.tsx
Default: active escrow with a full link
Expired: escrow past its expiresAt
Pending payout: shipment delivered, awaiting vendor release
PaymentForm.stories.tsx
Idle: form ready, wallet connected
Wallet not connected: shows connect-wallet prompt
Submitting: loading state on the CTA
Error: Horizon transaction rejected
DisputeForm.stories.tsx
Empty: fresh form
With evidence: file attached, description filled
Submitted: success confirmation state
Acceptance criteria
 All stories render without errors in pnpm storybook.
 Each story has meaningful controls (args) so reviewers can toggle states.
 Stories are co-located with their component files or in __stories__/ directories, matching whichever convention is already used.

