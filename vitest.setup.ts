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
process.env.NEXT_PUBLIC_CONTRACT_ID ??= "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
process.env.NEXT_PUBLIC_STELLAR_NETWORK ??= "testnet";
process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??= "Test SDF Network ; September 2015";
process.env.NEXT_PUBLIC_SITE_URL ??= "https://trustlink.app";
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

vi.mock("@/components/providers/CurrencyProvider", async () => {
  const React = await import("react");
  const { formatCurrency } = await import("@/utils/currency");
  type CurrencyCode = "USDC" | "USD" | "EUR" | "NGN" | "GBP";
  interface CurrencyContextValue {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
    formatAmount: (amount: number | string) => string;
  }
  const CurrencyContext = React.createContext<CurrencyContextValue | undefined>(undefined);
  const fallback: CurrencyContextValue = {
    currency: "USDC",
    setCurrency: vi.fn(),
    formatAmount: (amount) => formatCurrency(amount, "USDC"),
  };
  const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
    const [currency, setCurrencyState] = React.useState<CurrencyCode>(() => {
      const saved = localStorage.getItem("preferredCurrency");
      return saved === "USD" || saved === "EUR" || saved === "NGN" || saved === "GBP"
        ? saved
        : "USDC";
    });
    const setCurrency = (next: CurrencyCode) => {
      setCurrencyState(next);
      localStorage.setItem("preferredCurrency", next);
    };
    const value = {
      currency,
      setCurrency,
      formatAmount: (amount: number | string) => formatCurrency(amount, currency),
    };
    return React.createElement(CurrencyContext.Provider, { value }, children);
  };
  return {
    useCurrency: () => React.useContext(CurrencyContext) ?? fallback,
    CurrencyProvider,
  };
});
