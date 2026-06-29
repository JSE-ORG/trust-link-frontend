"use client";

import { use } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Star, ShieldCheck, MapPin, History, Package, BarChart3 } from "lucide-react";
import Link from "next/link";
import { formatUSDC } from "@/utils/currency";
import { formatTimeAgo } from "@/lib/utils";

// Mock data generator for the vendor profile
const getVendorMock = (address: string) => {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  return {
    name: "Premium Electronics Co.",
    address,
    rating: 4.8,
    reviewsCount: 124,
    verificationLevel: "Gold",
    location: "New York, USA",
    joinDate: "2024-01-01T12:00:00Z",
    stats: {
      totalTransactions: 342,
      successfulEscrows: 340,
      disputeRate: "0.5%",
    },
    recentTransactions: [
      { id: "tx-101", item: "MacBook Pro M3", amount: 2400, status: "completed", date: twoWeeksAgo },
      { id: "tx-102", item: "AirPods Pro", amount: 250, status: "in-transit", date: threeDaysAgo },
      { id: "tx-103", item: "Magic Keyboard", amount: 150, status: "completed", date: oneWeekAgo },
    ]
  };
};

export default function VendorProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { i18n } = useTranslation();
  const unwrappedParams = use(params);
  const vendor = getVendorMock(unwrappedParams.address);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header & Back Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Vendor Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{vendor.name}</h2>
                <p className="mt-1 font-mono text-sm text-zinc-500 dark:text-zinc-400 break-all">
                  {vendor.address}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-zinc-900 dark:text-white">{vendor.rating}</span>
                    <span>({vendor.reviewsCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{vendor.verificationLevel} Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Joined {formatTimeAgo(vendor.joinDate, i18n.language)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  aria-label="Start a trade with this vendor"
                  className="rounded-full bg-[#1B2A6B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152052] transition"
                >
                  Start Trade
                </button>
                <Link
                  href="/dashboard/analytics"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Transactions</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{vendor.stats.totalTransactions}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Successful Escrows</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{vendor.stats.successfulEscrows}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Dispute Rate</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{vendor.stats.disputeRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
              <History className="h-5 w-5 text-zinc-500" />
              Recent Transactions
            </h3>
          </div>
          
          <div className="space-y-4">
            {vendor.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-[#1B2A6B] dark:bg-blue-900/30 dark:text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{tx.item}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatTimeAgo(tx.date, i18n.language)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-zinc-900 dark:text-white">{formatUSDC(tx.amount)}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    tx.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
