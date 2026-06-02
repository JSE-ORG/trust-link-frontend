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
