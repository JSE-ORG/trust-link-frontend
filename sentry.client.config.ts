import * as Sentry from "@sentry/nextjs";
import { browserTracingIntegration } from "@sentry/nextjs";

import { getTracesSampleRate } from "@/lib/sentry/sampleRate";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: getTracesSampleRate(),
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [browserTracingIntegration()],

  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    const error = hint.originalException;
    const message = error instanceof Error ? error.message : String(error ?? "");

    if (message.includes("User rejected")) {
      return null;
    }
    return event;
  },
});
