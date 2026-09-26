"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  type CurrencyCode,
  EXCHANGE_RATES,
  formatCurrency,
} from "@/utils/currency";

export type { CurrencyCode };

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amountUsdc: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USDC");

  useEffect(() => {
    const saved = localStorage.getItem("preferredCurrency") as CurrencyCode | null;
    if (saved && saved in EXCHANGE_RATES) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("preferredCurrency", newCurrency);
  };

  const formatAmount = (amountUsdc: number | string) =>
    formatCurrency(amountUsdc, currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
