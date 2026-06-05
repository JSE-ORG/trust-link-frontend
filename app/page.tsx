"use client";

import { useState } from "react";
import { Shield, Zap, Lock, ChevronDown, ChevronUp, ArrowRight, CheckCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How does TrustLink protect my money?",
    answer: "TrustLink uses smart contracts on the Stellar network to hold funds in escrow. Your money is only released to the vendor after you confirm delivery, ensuring complete protection against fraud.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support Stellar (XLM) and various Stellar-based assets. The Stellar network enables fast, low-cost transactions globally, making it perfect for cross-border trade.",
  },
  {
    question: "How long does the escrow process take?",
    answer: "Most transactions complete within 2-5 business days depending on shipping. The escrow period automatically releases funds 7 days after delivery confirmation if no disputes are raised.",
  },
  {
    question: "What happens if there's a dispute?",
    answer: "If you don't receive your order or it's not as described, you can raise a dispute within the escrow period. Our team will review the evidence and make a fair decision based on the terms.",
  },
  {
    question: "Are there any hidden fees?",
    answer: "TrustLink charges a transparent 1.5% fee on successful transactions. There are no hidden charges, setup fees, or monthly costs. You only pay when you complete a sale.",
  },
  {
    question: "Is TrustLink available internationally?",
    answer: "Yes! Built on the Stellar network, TrustLink works globally. Vendors and buyers from any country can participate, with automatic currency conversion at competitive rates.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--muted-bg)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Secure Escrow for
              <span className="block text-[var(--accent)]">Every Transaction</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10">
              TrustLink protects buyers and vendors with smart contract escrow on the Stellar network. 
              Fast, secure, and transparent payments with zero trust required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/vendor/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/90 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started as a Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
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

      {/* How It Works Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Three simple steps to secure your transaction
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
                  <span className="text-3xl font-bold text-[var(--primary)]">1</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                  Vendor Creates Link
                </h3>
                <p className="text-[var(--muted)]">
                  The vendor generates a unique escrow link with payment details and delivery terms.
                </p>
              </div>
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-[var(--border)]" />
            </div>
            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-6">
                  <span className="text-3xl font-bold text-[var(--accent)]">2</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                  Buyer Pays
                </h3>
                <p className="text-[var(--muted)]">
                  Buyer sends payment to the smart contract. Funds are locked until delivery is confirmed.
                </p>
              </div>
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-[var(--border)]" />
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--success)]/10 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-[var(--success)]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                Funds Released
              </h3>
              <p className="text-[var(--muted)]">
                Upon delivery confirmation, the smart contract automatically releases funds to the vendor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
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
                <Shield className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                Stellar Network
              </h3>
              <p className="text-[var(--muted)]">
                Powered by the Stellar blockchain for fast, secure, and low-cost transactions worldwide.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-6">
                <Lock className="h-7 w-7 text-[var(--accent)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                Smart Contracts
              </h3>
              <p className="text-[var(--muted)]">
                Automated escrow execution ensures funds are only released when conditions are met.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-[var(--success)]" />
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

      {/* FAQ Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[var(--muted)]">
              Everything you need to know about TrustLink
            </p>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-[var(--muted-bg)]/50 transition-colors"
                  aria-expanded={openFaq === index}
                >
                  <span className="text-lg font-semibold text-[var(--foreground)] pr-4">
                    {item.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-[var(--muted)] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[var(--muted)] flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 pt-0 bg-[var(--muted-bg)]/30">
                    <p className="text-[var(--muted)] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Trade with Confidence?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of vendors and buyers who trust TrustLink for secure transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/vendor/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/90 transition-all shadow-lg hover:shadow-xl"
            >
              Start as a Vendor
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="/verify"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[var(--primary)] bg-white rounded-lg hover:bg-white/90 transition-all"
            >
              Verify a Link
              <CheckCircle className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--foreground)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">TrustLink</h3>
              <p className="text-white/70 max-w-md">
                Secure escrow payments powered by the Stellar network. Protecting buyers and vendors worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="/vendor/signup" className="hover:text-white transition-colors">For Vendors</a></li>
                <li><a href="/verify" className="hover:text-white transition-colors">Verify Link</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
            © 2025 TrustLink. Built on Stellar.
          </div>
        </div>
      </footer>
    </div>
  );
}
