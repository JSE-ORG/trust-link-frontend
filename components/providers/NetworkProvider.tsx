"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Network = "testnet" | "mainnet";

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
  toggleNetwork: () => void;
  isTestnet: boolean;
  isMainnet: boolean;
}

const STORAGE_KEY = "network.preferred";

function resolveInitialNetwork(): Network {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "testnet" || stored === "mainnet") return stored;
  }
  const env = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  if (env === "mainnet" || env === "public") return "mainnet";
  return "testnet";
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<Network>(resolveInitialNetwork);

  const setNetwork = useCallback((net: Network) => {
    setNetworkState(net);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, net);
    }
  }, []);

  const toggleNetwork = useCallback(() => {
    setNetworkState((prev) => {
      const next = prev === "testnet" ? "mainnet" : "testnet";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = {
    network,
    setNetwork,
    toggleNetwork,
    isTestnet: network === "testnet",
    isMainnet: network === "mainnet",
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
