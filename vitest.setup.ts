import "@testing-library/jest-dom";
import "@/lib/i18n";

import { vi } from "vitest";

// jsdom does not always provide a fully-functional localStorage (e.g. when
// Node's `--localstorage-file` flag is supplied without a valid path, the
// global `localStorage` becomes a broken stub without `clear`/`key` methods).
// Provide a working in-memory implementation so component/unit tests that
// read or write localStorage behave as expected.
const storage = (() => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, String(value));
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
  writable: true,
});

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
