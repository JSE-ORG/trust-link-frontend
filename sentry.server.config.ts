import * as Sentry from "@sentry/nextjs";

import { getTracesSampleRate } from "@/lib/sentry/sampleRate";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: getTracesSampleRate(),
});
