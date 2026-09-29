"use client";

import { toast as sonnerToast } from "sonner";

const DEFAULT_DURATION = 4000;

type ToastOptions = Parameters<typeof sonnerToast.success>[1];

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) =>
      sonnerToast.success(message, { duration: DEFAULT_DURATION, ...options }),
    error: (message: string, options?: ToastOptions) =>
      sonnerToast.error(message, { duration: DEFAULT_DURATION, ...options }),
    loading: (message: string, options?: ToastOptions) =>
      sonnerToast.loading(message, { duration: DEFAULT_DURATION, ...options }),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  };
}

const SESSION_EXPIRED_TOAST_ID = "session-expired";

/**
 * Display a session expired message and clear the stored JWT token.
 * Use this in API interceptors when receiving a 401 response.
 */
export function sessionExpired() {
  // Remove the expired token from localStorage
  window.localStorage.removeItem("wallet.jwt");

  // Notify the user and prompt them to reconnect
  sonnerToast.error("Session expired. Please reconnect your wallet.", {
    id: SESSION_EXPIRED_TOAST_ID,
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: "Reconnect",
      onClick: () => {
        // Redirect the user to reconnect their wallet
        window.location.href = "/";
      },
    },
  });
}