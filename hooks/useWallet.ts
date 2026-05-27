"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectFreighter,
  isFreighterInstalled,
  signTransaction,
} from "@/lib/stellar/freighter";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "not-installed"
  | "error";

const JWT_STORAGE_KEY = "wallet.jwt";
const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";

export default function useWallet() {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedJwt = window.localStorage.getItem(JWT_STORAGE_KEY);
    const storedPublicKey = window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);

    if (storedJwt && storedPublicKey) {
      setJwt(storedJwt);
      setPublicKey(storedPublicKey);
      setStatus("connected");
    }
  }, []);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(JWT_STORAGE_KEY);
    window.localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
    setJwt(null);
    setPublicKey(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setStatus("not-installed");
        setError("Freighter is not installed.");
        return;
      }

      const connection = await connectFreighter();
      const account = connection.publicKey;
      setPublicKey(account);
      window.localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, account);

      const challengeResponse = await fetch(
        `/stellar/sep10/challenge?account=${encodeURIComponent(account)}`
      );
      if (!challengeResponse.ok) {
        throw new Error("Failed to fetch SEP-10 challenge.");
      }

      const challengeBody = await challengeResponse.json();
      const signedTransaction = await signTransaction(
        challengeBody.transaction,
        challengeBody.network_passphrase
      );

      const tokenResponse = await fetch("/stellar/sep10/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: signedTransaction }),
      });

      if (!tokenResponse.ok) {
        throw new Error("SEP-10 authentication failed.");
      }

      const tokenBody = await tokenResponse.json();
      window.localStorage.setItem(JWT_STORAGE_KEY, tokenBody.token);
      setJwt(tokenBody.token);
      setStatus("connected");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Wallet connect failed.";
      setError(message);
      if (message === "Freighter is not installed.") {
        setStatus("not-installed");
      } else {
        setStatus("error");
      }
    }
  }, []);

  return {
    status,
    publicKey,
    jwt,
    error,
    connect,
    disconnect,
  };
}
