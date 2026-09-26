import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicVendorEscrows, getVendorProfile } from "@/lib/api";
import { filterActiveListings, shortenAddress } from "@/lib/vendorProfile";
import type { Escrow, VendorProfile } from "@/types";

import VendorProfileClient from "./VendorProfileClient";

interface VendorPageProps {
  params: Promise<{ id: string }>;
}

/** Trims a vendor description down to a length search engines will actually show. */
function toMetaDescription(vendor: VendorProfile): string {
  const description = vendor.description?.trim();
  if (!description) {
    return `Browse ${vendor.shopName}'s active escrow listings on TrustLink, secured on the Stellar blockchain.`;
  }

  return description.length > 155 ? `${description.slice(0, 152).trimEnd()}...` : description;
}

/** The profile is public, so an unreachable vendor is a 404 rather than an error. */
async function loadVendorProfile(id: string): Promise<VendorProfile | null> {
  try {
    return await getVendorProfile(id);
  } catch {
    return null;
  }
}

/** Listings are secondary — a failure here degrades to an empty list. */
async function loadVendorListings(id: string): Promise<Escrow[]> {
  try {
    return await getPublicVendorEscrows(id);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await loadVendorProfile(id);

  if (!vendor) {
    return {
      title: "Vendor Not Found | TrustLink",
      description: "This TrustLink vendor profile is unavailable.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${vendor.shopName} | TrustLink`;
  const description = toMetaDescription(vendor);
  const url = `/vendor/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "profile",
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Public vendor profile. No authentication is required or attempted — anyone
 * holding the link can see the vendor's shop details and open escrow listings.
 */
export default async function VendorProfilePage({ params }: VendorPageProps) {
  const { id } = await params;

  const [vendor, escrows] = await Promise.all([
    loadVendorProfile(id),
    loadVendorListings(id),
  ]);

  if (!vendor) {
    notFound();
  }

  return (
    <VendorProfileClient
      vendor={{ ...vendor, id: vendor.id || id }}
      listings={filterActiveListings(escrows)}
      shortAddress={shortenAddress(vendor.id || id)}
    />
  );
}
