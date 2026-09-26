"use client";

import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflineClient() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-black text-center">
      <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30 mb-6">
        <WifiOff className="h-12 w-12 text-red-600 dark:text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">You are offline</h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
        It looks like you&apos;ve lost your internet connection. Please check your network settings and try again.
      </p>
      <Link
        href="/"
        className="rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
      >
        Try Again
      </Link>
    </main>
  );
}
