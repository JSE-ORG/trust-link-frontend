import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  beforeSend(event, hint) {
    const error = hint.originalException as any;
    const message = error?.message || String(error);
    
    if (message.includes("User rejected")) {
      return null;
    }
    return event;
  },
});
