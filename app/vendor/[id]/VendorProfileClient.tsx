"use client";

import {
  ArrowLeft,
  Globe,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { formatTimeAgo } from "@/lib/utils";
import { parseShippingLocations, safeWebsiteUrl } from "@/lib/vendorProfile";
import type { Escrow, VendorProfile } from "@/types";
import { formatUSDC } from "@/utils/currency";

export interface VendorProfileClientProps {
  vendor: VendorProfile;
  /** Active, non-expired escrow links to advertise. */
  listings: Escrow[];
  /** Pre-shortened vendor address for display. */
  shortAddress: string;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function VendorProfileClient({
  vendor,
  listings,
  shortAddress,
}: VendorProfileClientProps) {
  const { i18n } = useTranslation();

  const website = safeWebsiteUrl(vendor.website);
  const shippingLocations = parseShippingLocations(vendor.shippingLocations);
  const hasStats =
    vendor.totalTransactions !== undefined ||
    vendor.successfulEscrows !== undefined ||
    vendor.disputeRate !== undefined;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 pb-24 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Vendor Profile
          </h1>
        </div>

        {/* Shop details */}
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {vendor.shopName}
            </h2>
            <p
              className="mt-1 break-all font-mono text-sm text-zinc-500 dark:text-zinc-400"
              title={vendor.id}
            >
              {shortAddress}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              {vendor.rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {vendor.rating}
                  </span>
                  {vendor.reviewsCount !== undefined && (
                    <span>({vendor.reviewsCount} reviews)</span>
                  )}
                </span>
              )}
              {vendor.verificationLevel && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {vendor.verificationLevel} Verified
                </span>
              )}
              {vendor.joinedAt && (
                <span>Joined {formatTimeAgo(vendor.joinedAt, i18n.language)}</span>
              )}
            </div>

            {vendor.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {vendor.description}
              </p>
            )}

            {(website || shippingLocations.length > 0) && (
              <dl className="mt-6 space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                {website && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <dt className="flex items-center gap-2 font-medium text-zinc-500 dark:text-zinc-400">
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      Website
                    </dt>
                    <dd>
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-hover dark:text-brand-primary-dark"
                      >
                        {website}
                      </a>
                    </dd>
                  </div>
                )}

                {shippingLocations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <dt className="flex items-center gap-2 font-medium text-zinc-500 dark:text-zinc-400">
                      <Truck className="h-4 w-4" aria-hidden="true" />
                      Ships to
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {shippingLocations.map((location) => (
                        <span
                          key={location}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          {location}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {hasStats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {vendor.totalTransactions !== undefined && (
                  <StatCard label="Total Transactions" value={vendor.totalTransactions} />
                )}
                {vendor.successfulEscrows !== undefined && (
                  <StatCard label="Successful Escrows" value={vendor.successfulEscrows} />
                )}
                {vendor.disputeRate !== undefined && (
                  <StatCard label="Dispute Rate" value={`${vendor.disputeRate}%`} />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Active escrow links */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
            <Package className="h-5 w-5 text-zinc-500" aria-hidden="true" />
            Active Listings
          </h3>

          {listings.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              This vendor has no active listings right now.
            </p>
          ) : (
            <ul className="space-y-4">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/pay/${listing.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-primary dark:bg-blue-900/30 dark:text-brand-primary-dark">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900 dark:text-white">
                          {listing.item}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Listed {formatTimeAgo(listing.createdAt, i18n.language)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {formatUSDC(listing.amount)}
                      </p>
                      {listing.expiresAt && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Expires {formatTimeAgo(listing.expiresAt, i18n.language)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
