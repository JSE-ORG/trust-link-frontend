/**
 * Privacy-respecting analytics via PostHog.
 *
 * Controlled by two environment variables:
 *   NEXT_PUBLIC_POSTHOG_KEY     – PostHog project API key (required to enable)
 *   NEXT_PUBLIC_POSTHOG_DISABLED – Set to "true" to disable analytics entirely
 *
 * Tracked events (no PII – public keys are pseudonymous):
 *   - link_created
 *   - payment_initiated
 *   - payment_completed
 *   - dispute_raised
 *   - delivery_confirmed
 *   - link_share_attempt
 *   - link_shared
 *   - link_copied
 *   - qr_code_downloaded
 */

type EventName =
  | "link_created"
  | "payment_initiated"
  | "payment_completed"
  | "dispute_raised"
  | "delivery_confirmed"
  | "link_share_attempt"
  | "link_shared"
  | "link_copied"
  | "qr_code_downloaded";

let posthogInstance: typeof import("posthog-js").default | null = null;
let initialized = false;

function isDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") return true;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return true;
  return false;
}

async function getPosthog() {
  if (posthogInstance) return posthogInstance;

  const posthog = (await import("posthog-js")).default;
  posthogInstance = posthog;
  return posthog;
}

async function ensureInitialized() {
  if (initialized || isDisabled()) return;

  const posthog = await getPosthog();
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    persistence: "localStorage",
    // Respect Do Not Track
    respect_dnt: true,
    // Disable session recording for privacy
    disable_session_recording: true,
    loaded: (ph) => {
      // In development, opt out by default
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });

  initialized = true;
}

/**
 * Track an analytics event. No-op when analytics is disabled.
 *
 * @param event - The event name to track
 * @param properties - Optional event properties (must not contain PII)
 */
export async function track(
  event: EventName,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  if (isDisabled()) return;

  try {
    await ensureInitialized();
    const posthog = await getPosthog();
    posthog.capture(event, properties);
  } catch {
    // Silently ignore analytics errors – never break the app
  }
}

/**
 * Identify a user by a pseudonymous ID (e.g. public key).
 * Never pass email, name, or other PII.
 */
export async function identify(distinctId: string): Promise<void> {
  if (isDisabled()) return;

  try {
    await ensureInitialized();
    const posthog = await getPosthog();
    posthog.identify(distinctId);
  } catch {
    // Silently ignore
  }
}

/**
 * Reset the current user session (e.g. on wallet disconnect).
 */
export async function resetAnalytics(): Promise<void> {
  if (isDisabled()) return;

  try {
    await ensureInitialized();
    const posthog = await getPosthog();
    posthog.reset();
  } catch {
    // Silently ignore
  }
}
