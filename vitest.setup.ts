import "@testing-library/jest-dom";
import "@/lib/i18n";

import { vi } from "vitest";

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
