"use client";

import { ArrowRight, Star, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface FeaturedArtist {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewsCount: number;
  verificationLevel: string;
  location: string;
  totalTransactions: number;
  imageUrl: string;
  category: string;
}

const FEATURED_ARTISTS: FeaturedArtist[] = [
  {
    id: "vendor-1",
    name: "Premium Electronics Co.",
    address: "GBAM5V6X2J7E3...K4L9M2N8P1",
    rating: 4.8,
    reviewsCount: 124,
    verificationLevel: "Gold",
    location: "New York, USA",
    totalTransactions: 342,
    imageUrl: "/images/vendors/electronics.jpg",
    category: "Electronics",
  },
  {
    id: "vendor-2",
    name: "Artisan Crafts Studio",
    address: "GCXQ3R8T9Y5A...B7K2M4N6P3",
    rating: 4.9,
    reviewsCount: 89,
    verificationLevel: "Gold",
    location: "Berlin, Germany",
    totalTransactions: 215,
    imageUrl: "/images/vendors/crafts.jpg",
    category: "Handmade Crafts",
  },
  {
    id: "vendor-3",
    name: "Digital Assets Hub",
    address: "GAW7K2X4M6N9...P1R3T5V8Y2",
    rating: 4.7,
    reviewsCount: 203,
    verificationLevel: "Silver",
    location: "Tokyo, Japan",
    totalTransactions: 567,
    imageUrl: "/images/vendors/digital.jpg",
    category: "Digital Goods",
  },
  {
    id: "vendor-4",
    name: "Luxury Timepieces",
    address: "GD8K1M4N7P2...R5T8V1X4Y7",
    rating: 4.6,
    reviewsCount: 67,
    verificationLevel: "Gold",
    location: "Zurich, Switzerland",
    totalTransactions: 178,
    imageUrl: "/images/vendors/watches.jpg",
    category: "Luxury Goods",
  },
];

export default function FeaturedArtistSection() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
              Featured Artists
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              Top-rated vendors trusted by our community for secure transactions
            </p>
          </div>
          <Link
            href="/vendor"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
          >
            View All Artists
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_ARTISTS.map((artist) => (
            <Link
              key={artist.id}
              href={`/vendor/${artist.address}`}
              className="group rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--muted-bg)] overflow-hidden mb-4 ring-2 ring-[var(--border)] group-hover:ring-[var(--accent)] transition-all">
                  <OptimizedImage
                    src={artist.imageUrl}
                    alt={`${artist.name} avatar`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                  {artist.name}
                </h3>
                <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">
                  {artist.category}
                </span>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-[var(--foreground)]">{artist.rating}</span>
                  <span className="text-sm text-[var(--muted)]">({artist.reviewsCount})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{artist.verificationLevel} Verified</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{artist.location}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border)] w-full">
                  <span className="text-sm text-[var(--muted)]">
                    <span className="font-semibold text-[var(--foreground)]">{artist.totalTransactions}</span> transactions
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
