import Link from "next/link";

export const metadata = {
  title: "About | TrustLink",
  description: "Learn about TrustLink — secure escrow payments on the Stellar network.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          &larr; Back to Home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-zinc-950 dark:text-white">About TrustLink</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          TrustLink is a decentralized escrow platform built on the Stellar network. 
          We enable secure, trustless transactions between buyers and vendors using 
          Soroban smart contracts.
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Our mission is to make peer-to-peer commerce safe and accessible for everyone, 
          everywhere — combining the familiar web experience with the guarantees of blockchain technology.
        </p>
      </div>
    </main>
  );
}
