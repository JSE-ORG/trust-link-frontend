import "@testing-library/jest-dom";

import { setI18n } from "react-i18next";
import { vi } from "vitest";

import i18n from "@/lib/i18n";

// `lib/i18n` initialises i18next core only — the React binding is registered by
// `components/providers/I18nProvider.tsx`, which no individual test necessarily
// renders. Publish the instance here so every `useTranslation` consumer
// resolves it the same way it does in the running app.
setI18n(i18n);

process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
// jsdom + Node `--localstorage-file` yields a broken localStorage stub that
// lacks clear()/key(), so provide a full in-memory polyfill for tests.
class LocalStorageMock {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

if (typeof globalThis !== "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: new LocalStorageMock(),
    writable: true,
    configurable: true,
  });
}

vi.mock("@/components/providers/CurrencyProvider", () => ({
  useCurrency: () => ({
    currency: "USDC",
    setCurrency: vi.fn(),
    formatAmount: (amount: number | string) => {
      const num = typeof amount === "string" ? parseFloat(amount) : amount;
      return `USDC ${num.toFixed(2)}`;
    },
  }),
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => children,
}));
