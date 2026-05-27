"use client";

import useWallet from "@/hooks/useWallet";

function truncatePublicKey(publicKey: string) {
  if (publicKey.length <= 12) {
    return publicKey;
  }
  return `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
}

export default function WalletConnectButton() {
  const { status, publicKey, connect, disconnect, error } = useWallet();

  if (status === "not-installed") {
    return (
      <button
        type="button"
        onClick={() => window.open("https://freighter.app", "_blank")}
        className="rounded-full bg-yellow-400 px-4 py-3 text-sm font-semibold text-black"
      >
        Install Freighter
      </button>
    );
  }

  const buttonText =
    status === "connecting"
      ? "Connecting..."
      : status === "connected" && publicKey
      ? truncatePublicKey(publicKey)
      : "Connect Wallet";

  return (
    <button
      type="button"
      onClick={status === "connected" ? disconnect : connect}
      className="rounded-full bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      disabled={status === "connecting"}
      aria-busy={status === "connecting"}
    >
      {buttonText}
      {status === "error" && error ? <span className="sr-only"> Error: {error}</span> : null}
    </button>
  );
}
