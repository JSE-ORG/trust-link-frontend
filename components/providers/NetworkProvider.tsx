"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

type Network = "testnet" | "mainnet";

interface NetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  horizonUrl: string;
  stellarExpertPrefix: string;
}

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
  toggleNetwork: () => void;
  isTestnet: boolean;
  isMainnet: boolean;
  config: NetworkConfig;
}

const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  testnet: {
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    horizonUrl: "https://horizon-testnet.stellar.org",
    stellarExpertPrefix: "testnet",
  },
  mainnet: {
    rpcUrl: "https://soroban.stellar.org",
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    horizonUrl: "https://horizon.stellar.org",
    stellarExpertPrefix: "public",
  },
};

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

  const config = useMemo(() => NETWORK_CONFIGS[network], [network]);

  const value = useMemo(() => ({
    network,
    setNetwork,
    toggleNetwork,
    isTestnet: network === "testnet",
    isMainnet: network === "mainnet",
    config,
  }), [network, setNetwork, toggleNetwork, config]);

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
