import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePageHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-accent text-white">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float"
          style={{ willChange: "transform" }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s", willChange: "transform" }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
            Secure Escrow for
            <span className="block text-brand-accent-soft">
              Every Transaction
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10">
            TrustLink protects buyers and vendors with smart contract escrow on the
            Stellar network. Fast, secure, and transparent payments with zero trust
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vendor/signup"
              className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
            >
              Get Started as a Vendor
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href="/verify"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-all"
            >
              Verify Escrow Link
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
