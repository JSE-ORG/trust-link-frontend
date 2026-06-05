"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSubscription } from "@/lib/api";
import type { Plan, Subscription } from "@/types";

interface SubscriptionContextType {
  plan: Plan;
  subscription: Subscription | null;
  isPro: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

const CACHE_KEY = "subscription.cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function loadCached(): Plan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { plan, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return plan as Plan;
  } catch {
    return null;
  }
}

function saveCache(plan: Plan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ plan, ts: Date.now() }));
}

export function clearSubscriptionCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async (bustCache = false) => {
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("wallet.jwt") ?? undefined)
        : undefined;

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (!bustCache) {
      const cached = loadCached();
      if (cached) {
        setPlan(cached);
        setIsLoading(false);
        return;
      }
    }

    try {
      const data = await getSubscription(token);
      setSubscription(data);
      setPlan(data.plan);
      saveCache(data.plan);
    } catch {
      // No subscription record → treat as FREE
      setPlan("FREE");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetch_(true), [fetch_]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return (
    <SubscriptionContext.Provider
      value={{ plan, subscription, isPro: plan === "PRO", isLoading, refetch }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  return ctx;
}
