"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Menu,
  PlusCircle,
  QrCode,
  ShieldCheck,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useSyncExternalStore } from "react";

import { Accordion, type AccordionItem } from "@/components/ui/Accordion";

const DOCS_SECTIONS = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Compass,
    badge: "Basics",
  },
  {
    id: "vendor-guide",
    label: "Vendor Guide",
    sublabel: "Link Creation & Fulfillment",
    icon: ShieldCheck,
    badge: "Vendors",
  },
  {
    id: "buyer-guide",
    label: "Buyer Guide",
    sublabel: "Funding & Confirmation",
    icon: CreditCard,
    badge: "Buyers",
  },
  {
    id: "tracking-guide",
    label: "Tracking & Delivery",
    sublabel: "Real-time Order Status",
    icon: Truck,
    badge: "Logistics",
  },
  {
    id: "dispute-guide",
    label: "Dispute Resolution",
    sublabel: "Evidence & Claims",
    icon: AlertTriangle,
    badge: "Protection",
  },
];

function getActiveSectionFromHash(): string {
  const sectionId = window.location.hash.slice(1);
  return DOCS_SECTIONS.some(({ id }) => id === sectionId)
    ? sectionId
    : "getting-started";
}

function subscribeToHashChange(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const GETTING_STARTED_FAQS: AccordionItem[] = [
  {
    question: "Do buyers or vendors need deep cryptocurrency experience to use TrustLink?",
    answer:
      "No. TrustLink abstracts away blockchain complexities. Vendors simply generate payment links or QR codes, and buyers connect their Freighter browser extension to approve payment with transparent USD Coin (USDC) or Stellar Lumens (XLM).",
  },
  {
    question: "What wallets and networks are currently supported?",
    answer:
      "TrustLink integrates directly with the Freighter wallet on both Stellar Testnet (for safe sandbox testing) and Stellar Mainnet. Ensure your browser extension network toggle matches the application header network.",
  },
  {
    question: "Where are escrow funds held during the transaction?",
    answer:
      "Funds are never held by TrustLink as a centralized custodian. All funds reside directly within Soroban smart contract custody on the Stellar blockchain, releasing exclusively when agreed delivery conditions are met.",
  },
];

const VENDOR_FAQS: AccordionItem[] = [
  {
    question: "Can a vendor cancel an escrow after generating a link?",
    answer:
      "Yes, as long as the buyer has not yet deposited funds (status: CREATED). Once the buyer funds the contract (status: FUNDED), cancellation requires buyer consent or dispute mediation to prevent unilateral withdrawal.",
  },
  {
    question: "How do I share the payment link with my customer?",
    answer:
      "After creating the escrow, TrustLink provides a direct link in the format /pay/[escrowId] and a downloadable high-resolution QR code. You can paste the link into WhatsApp, Instagram DMs, email, or your invoice.",
  },
  {
    question: "When are payout funds delivered to the vendor wallet?",
    answer:
      "Funds release instantly and irrevocably to your connected Stellar address the moment the buyer confirms delivery or when carrier tracking confirms delivery milestones per the escrow configuration.",
  },
];

const BUYER_FAQS: AccordionItem[] = [
  {
    question: "What happens if I fund an escrow but the vendor never ships?",
    answer:
      "Your funds remain securely locked in the smart contract. If the shipping deadline passes without shipment verification or dispatch, you can open a dispute directly from your tracking view to freeze the contract and request a refund.",
  },
  {
    question: "Do I pay additional platform fees on top of the order amount?",
    answer:
      "TrustLink charges a transparent, low fee clearly itemized on the payment breakdown screen before you sign the transaction. Stellar blockchain network transaction fees are negligible (typically less than $0.0001).",
  },
  {
    question: "How do I confirm delivery once my order arrives?",
    answer:
      "Open your unique order tracking page (/track/[escrowId]), verify that the goods match your expectations, and click 'Confirm Delivery'. Signing the confirmation prompt releases the payment from smart contract custody to the vendor.",
  },
];

const TRACKING_FAQS: AccordionItem[] = [
  {
    question: "Which shipping carriers are supported for automatic tracking?",
    answer:
      "TrustLink supports leading logistics partners including Terminal Africa and GIGL, as well as manual tracking numbers. Real-time courier webhooks update smart contract milestones automatically.",
  },
  {
    question: "How can I look up an escrow if I lost my link?",
    answer:
      "Visit the Order Tracking page (/tracking) and paste your Escrow Contract ID. If your wallet is connected, you can also view all past and active transactions in your personal Dashboard.",
  },
];

const DISPUTE_FAQS: AccordionItem[] = [
  {
    question: "Who reviews disputes and what evidence is required?",
    answer:
      "Disputes are reviewed by neutral arbitrators assigned per the contract rules. You may attach up to 5 files (PNG, JPEG, PDF up to 10MB each), including shipping slips, courier communications, photos of damaged goods, or chat transcripts.",
  },
  {
    question: "Can an escrow be disputed after funds are released?",
    answer:
      "No. On-chain release is final and irreversible on the Stellar blockchain. Disputes must be initiated while the escrow is in FUNDED or SHIPPED state, before confirmation.",
  },
];

export default function DocsClient() {
  const activeSection = useSyncExternalStore(
    subscribeToHashChange,
    getActiveSectionFromHash,
    () => "getting-started"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.06),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_30%),linear-gradient(180deg,_#09090b_0%,_#0f172a_100%)] dark:text-zinc-50">
      {/* Top Banner Navigation */}
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
              <BookOpen className="h-4 w-4 text-brand-primary" />
              <span>Documentation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Open an Escrow</span>
            </Link>

            {/* Mobile Nav Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Toggle documentation navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Guide Topics
            </p>
            <nav className="space-y-1">
              {DOCS_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={handleNavClick}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {sec.label}
                    </span>
                    <span className="text-xs text-zinc-400">{sec.badge}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light">
            Knowledge Base & Walkthroughs
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl lg:text-5xl">
            TrustLink Platform Documentation
          </h1>
          <p className="mt-3 max-w-3xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Everything you need to know about setting up smart escrow links, funding orders with
            Freighter, tracking courier deliveries, and resolving disputes with on-chain guarantees.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
            >
              <PlusCircle className="h-4 w-4" />
              Open an Escrow
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Desktop Sticky Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Core User Journeys
              </h2>
              <nav className="mt-3 space-y-1">
                {DOCS_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const active = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={handleNavClick}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-brand-primary/10 font-semibold text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                        <span>{sec.label}</span>
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          active ? "rotate-90 text-brand-primary" : "text-zinc-400 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </a>
                  );
                })}
              </nav>

              <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                  <p className="font-semibold text-zinc-900 dark:text-white">Need personal assistance?</p>
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">Reach our team directly through our contact form.</p>
                  <Link
                    href="/contact"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline dark:text-brand-primary-light"
                  >
                    Contact Support &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Guides Content Column */}
          <main className="space-y-12 lg:col-span-3">
            {/* Section 1: Getting Started */}
            <section
              id="getting-started"
              className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
            >
              <div className="border-b border-zinc-100 pb-6 dark:border-zinc-900">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-primary-light">
                  <Compass className="h-3.5 w-3.5" /> 1. Getting Started
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Core Escrow Concepts & Architecture
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Understand how TrustLink automates trust between buyers and sellers on the Stellar network.
                </p>
              </div>

              <div className="mt-6 space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                <p className="leading-relaxed">
                  TrustLink replaces high-fee legacy intermediaries with decentralized smart escrow contracts powered by{" "}
                  <strong className="text-zinc-950 dark:text-white">Soroban on Stellar</strong>. In traditional social commerce,
                  buyers fear paying upfront without receiving items, while sellers risk shipping without guaranteed payment.
                  TrustLink eliminates both risks simultaneously.
                </p>

                {/* State Machine Callout */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <h3 className="font-semibold text-zinc-950 dark:text-white">Escrow State Machine Lifecycle:</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="rounded-lg bg-zinc-200 px-2.5 py-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">CREATED</span>
                    <span className="text-zinc-400">&rarr;</span>
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">FUNDED</span>
                    <span className="text-zinc-400">&rarr;</span>
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-blue-800 dark:bg-blue-950 dark:text-blue-300">SHIPPED</span>
                    <span className="text-zinc-400">&rarr;</span>
                    <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-purple-800 dark:bg-purple-950 dark:text-purple-300">RELEASED</span>
                    <span className="text-zinc-400">or</span>
                    <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-rose-800 dark:bg-rose-950 dark:text-rose-300">DISPUTED</span>
                  </div>
                </div>

                {/* FAQs */}
                <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
                    <HelpCircle className="h-4 w-4 text-brand-primary" />
                    Getting Started FAQs
                  </h3>
                  <Accordion items={GETTING_STARTED_FAQS} />
                </div>
              </div>
            </section>

            {/* Section 2: Vendor Guide */}
            <section
              id="vendor-guide"
              className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> 2. Vendor Guide
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                    Creating & Sharing Escrow Links
                  </h2>
                </div>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
                >
                  Create Link Now
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-6 space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                <p>
                  Vendors can create a customized escrow contract in under 30 seconds without coding or complex merchant verification.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <Wallet className="h-4 w-4 text-brand-primary" />
                      1. Connect Wallet
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Connect your Freighter browser extension with your payout account active.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                      2. Enter Terms
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Specify item name, price, USDC/XLM currency, and delivery timeline.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <QrCode className="h-4 w-4 text-brand-primary" />
                      3. Share Anywhere
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Copy the generated link <code className="font-mono text-zinc-900 dark:text-white">/pay/[escrowId]</code> or download the QR code for WhatsApp and Instagram.
                    </p>
                  </div>
                </div>

                {/* Example Link Payload */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-4 font-mono text-xs text-zinc-100 shadow-inner">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span>Generated Payment Format</span>
                    <span className="text-emerald-400">Verified On-Chain</span>
                  </div>
                  <pre className="overflow-x-auto">
                    {`https://trustlink.app/pay/esc_01h8v9a2bf4c8d9e2
Token: USDC (Stellar Soroban)
Amount: 150.00 USDC
Arbiter: TrustLink Neutral Dispute Resolution`}
                  </pre>
                </div>

                <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
                    <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Vendor FAQs
                  </h3>
                  <Accordion items={VENDOR_FAQS} />
                </div>
              </div>
            </section>

            {/* Section 3: Buyer Guide */}
            <section
              id="buyer-guide"
              className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
            >
              <div className="border-b border-zinc-100 pb-6 dark:border-zinc-900">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="h-3.5 w-3.5" /> 3. Buyer Guide
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Reviewing, Signing & Funding Escrows
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  How buyers verify escrow agreements and authorize protected payments with Freighter.
                </p>
              </div>

              <div className="mt-6 space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      1
                    </span>
                    <div>
                      <strong className="text-zinc-950 dark:text-white">Access the Link:</strong> Open the link provided by the seller (<code className="font-mono text-xs">/pay/[escrowId]</code>). Confirm transaction summary and vendor address.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      2
                    </span>
                    <div>
                      <strong className="text-zinc-950 dark:text-white">Authorize Deposit in Freighter:</strong> Click &lsquo;Connect Wallet & Pay&rsquo;. Verify the exact token amount and sign the transaction prompt in Freighter.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      3
                    </span>
                    <div>
                      <strong className="text-zinc-950 dark:text-white">Confirm Delivery:</strong> Once the package arrives and goods are inspected, navigate to <code className="font-mono text-xs">/track/[escrowId]</code> and click &lsquo;Confirm Delivery&rsquo; to release payment.
                    </div>
                  </li>
                </ol>

                <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
                    <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Buyer FAQs
                  </h3>
                  <Accordion items={BUYER_FAQS} />
                </div>
              </div>
            </section>

            {/* Section 4: Tracking & Delivery */}
            <section
              id="tracking-guide"
              className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Truck className="h-3.5 w-3.5" /> 4. Tracking & Delivery
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                    Order Tracking & Carrier Status Updates
                  </h2>
                </div>
                <Link
                  href="/tracking"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Lookup an Order
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-6 space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                <p>
                  Both buyers and vendors can monitor escrow milestones in real time. Order tracking reflects verified smart contract events combined with live logistics updates.
                </p>

                <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actors</th>
                        <th className="p-3">Permitted Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      <tr>
                        <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-200">CREATED</td>
                        <td className="p-3">Buyer</td>
                        <td className="p-3">Deposit funds into Soroban contract.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">FUNDED</td>
                        <td className="p-3">Vendor</td>
                        <td className="p-3">Fulfill order and attach carrier shipment tracking.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">SHIPPED</td>
                        <td className="p-3">Buyer</td>
                        <td className="p-3">Verify package delivery and confirm fund release.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-purple-600 dark:text-purple-400">RELEASED</td>
                        <td className="p-3">Settled</td>
                        <td className="p-3">Funds successfully transferred to vendor wallet. Transaction completed.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">DISPUTED</td>
                        <td className="p-3">Arbiter</td>
                        <td className="p-3">Locked pending dispute evidence review and resolution.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
                    <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Tracking FAQs
                  </h3>
                  <Accordion items={TRACKING_FAQS} />
                </div>
              </div>
            </section>

            {/* Section 5: Dispute Resolution */}
            <section
              id="dispute-guide"
              className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
            >
              <div className="border-b border-zinc-100 pb-6 dark:border-zinc-900">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> 5. Dispute Resolution
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Filing Claims, Evidence Upload & Arbitration
                </h2>
              </div>

              <div className="mt-6 space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                <p>
                  When an order encounters an issue—such as damaged goods, non-delivery, or terms breach—either party can raise a dispute to freeze smart contract funds.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <h3 className="font-semibold text-zinc-950 dark:text-white">Evidence Upload Guidelines:</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <li>Up to 5 file attachments per claim.</li>
                      <li>PNG, JPEG, and PDF formats supported.</li>
                      <li>Max 10MB per file attachment.</li>
                      <li>Include tracking receipts, chat logs, and damage photos.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <h3 className="font-semibold text-zinc-950 dark:text-white">Direct Dispute URL:</h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Disputes are opened via your order ID:
                      <code className="mt-1 block font-mono text-zinc-900 dark:text-zinc-100">
                        /dispute/[escrowId]
                      </code>
                      Or click &lsquo;Raise Dispute&rsquo; directly inside the tracking screen.
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
                    <HelpCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Dispute FAQs
                  </h3>
                  <Accordion items={DISPUTE_FAQS} />
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
