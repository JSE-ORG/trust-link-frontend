import { Lock, Shield, Zap } from "lucide-react";

export default function HomePageTrustSignals() {
  return (
    <section className="py-20 sm:py-24 bg-[var(--muted-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Why TrustLink?
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Built on technology you can trust
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-6">
              <Shield className="h-7 w-7 text-[var(--primary)]" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
              Stellar Network
            </h3>
            <p className="text-[var(--muted)]">
              Powered by the Stellar blockchain for fast, secure, and low-cost
              transactions worldwide.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-6">
              <Lock className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
              Smart Contracts
            </h3>
            <p className="text-[var(--muted)]">
              Automated escrow execution ensures funds are only released when
              conditions are met.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mb-6">
              <Zap className="h-7 w-7 text-[var(--success)]" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
              Low Fees
            </h3>
            <p className="text-[var(--muted)]">
              Just 1.5% per transaction with no hidden fees. Save more on every sale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
