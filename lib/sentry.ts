import * as Sentry from "@sentry/nextjs";

export function setEscrowContext(escrowId: string) {
  Sentry.setTag("escrow.id", escrowId);
}

export function captureWalletError(error: Error, context: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: {
      transaction: context,
    },
  });
}

export default Sentry;
