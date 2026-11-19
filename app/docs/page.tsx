import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  AlertTriangle, 
  Wallet, 
  CheckCircle2, 
  Info,
  QrCode
} from "lucide-react";

export const metadata: Metadata = {
  title: "User Guides & Documentation | TrustLink",
  description:
    "Task-focused guides for creating escrow links, funding payments, tracking shipments, and resolving disputes on TrustLink.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.06),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] px-4 py-12 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_30%),linear-gradient(180deg,_#09090b_0%,_#0f172a_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <header className="mt-8 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light">
            Knowledge Base
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl lg:text-5xl">
            TrustLink Platform Documentation
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Complete, task-oriented guides for managing secure peer-to-peer and business escrow
            transactions on the Stellar network. Learn how to create links, complete payments, track
            order fulfillment, and initiate disputes.
          </p>
        </header>

        {/* Quick Navigation Cards */}
        <nav aria-label="Guides Navigation" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="#vendor-guide"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-primary dark:text-zinc-100">
              1. Create & Share
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Vendor flow for generating shareable escrow links.
            </p>
          </a>

          <a
            href="#buyer-guide"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-primary dark:text-zinc-100">
              2. Pay & Fund
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Buyer payment, wallet connection, and signing.
            </p>
          </a>

          <a
            href="#tracking-guide"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-primary dark:text-zinc-100">
              3. Track & Release
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Shipment updates, order lookup, and fund release.
            </p>
          </a>

          <a
            href="#dispute-guide"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-primary dark:text-zinc-100">
              4. Disputes
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Filing claims, uploading evidence, and arbitration.
            </p>
          </a>
        </nav>

        {/* Main Guides Content */}
        <div className="mt-12 space-y-16">
          {/* Section 1: Vendor Workflow */}
          <section id="vendor-guide" className="scroll-mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Vendor Workflow
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Creating & Sharing Escrow Links
                </h2>
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
              >
                Go to Create Escrow
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-6 text-zinc-600 dark:text-zinc-300">
              <p>
                Vendors can initiate an escrow transaction without requiring upfront backend setup.
                TrustLink coordinates with the Soroban escrow contract on Stellar to lock funds in smart
                contract custody until delivery conditions are satisfied.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    <Wallet className="h-4 w-4 text-brand-primary" />
                    Step 1: Connect Wallet
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Connect your Freighter browser extension. Ensure your active wallet network matches
                    the application network (Testnet or Mainnet).
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                    Step 2: Enter Terms
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Specify the payment token amount, token symbol (e.g. USDC or XLM), engagement description,
                    and optional buyer wallet address.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    <QrCode className="h-4 w-4 text-brand-primary" />
                    Step 3: Share Link
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    The platform outputs a shareable link in the format <code className="text-zinc-900 dark:text-zinc-100">/pay/[escrowId]</code> along with a downloadable payment QR code.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <strong className="font-semibold">How to deliver payment links to buyers:</strong>
                    <p className="mt-1 text-xs leading-relaxed">
                      TrustLink does not publish private escrow details in a public search directory. As the
                      vendor, you must copy the generated payment URL or share the QR code directly with your buyer
                      via chat, email, or invoice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Buyer Workflow */}
          <section id="buyer-guide" className="scroll-mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Buyer Workflow
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Reviewing, Signing & Funding Escrows
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-6 text-zinc-600 dark:text-zinc-300">
              <p>
                Buyers fund an escrow by authorizing a cryptographic transaction using their Stellar wallet.
                Funds remain securely held in smart contract escrow until you receive and verify the goods or
                services.
              </p>

              <ol className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    1
                  </span>
                  <div>
                    <strong className="text-zinc-950 dark:text-white">Access the Escrow URL:</strong>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Open the exact URL provided by the seller (<code className="font-mono">/pay/[escrowId]</code>) or scan the vendor&apos;s QR code. Note that navigating directly to <code className="font-mono">/pay</code> without an escrow ID will prompt you to enter a valid link.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    2
                  </span>
                  <div>
                    <strong className="text-zinc-950 dark:text-white">Verify Transaction Parameters:</strong>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Inspect the recipient address, required token amount, escrow fee breakdown, and delivery milestones. Confirm the active network in the top banner matches your wallet.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    3
                  </span>
                  <div>
                    <strong className="text-zinc-950 dark:text-white">Authorize Payment in Freighter:</strong>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Click <em>Connect Wallet & Pay</em>. Review the transaction XDR prompt in Freighter. Once signed and submitted to Soroban RPC, the escrow status changes to <span className="font-semibold text-emerald-600 dark:text-emerald-400">FUNDED</span>.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Need to check an existing order?</span>{" "}
                You can look up the status of any transaction using its escrow identifier on our{" "}
                <Link href="/tracking" className="font-semibold text-brand-primary underline hover:text-brand-primary-hover">
                  Order Tracking Page
                </Link>
                .
              </div>
            </div>
          </section>

          {/* Section 3: Tracking & Milestones */}
          <section id="tracking-guide" className="scroll-mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Fulfillment & Lifecycle
                </span>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Order Tracking & Fund Release
                </h2>
              </div>
              <Link
                href="/tracking"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Open Order Lookup
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-6 text-zinc-600 dark:text-zinc-300">
              <p>
                Both buyers and sellers can monitor escrow milestones in real time. The order tracking interface
                reflects verified smart contract state and carrier shipment events.
              </p>

              <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Who Can Act</th>
                      <th className="p-3">Permitted Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-200">CREATED</td>
                      <td className="p-3">Buyer</td>
                      <td className="p-3">Sign funding transaction to lock payment.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">FUNDED</td>
                      <td className="p-3">Vendor / Buyer</td>
                      <td className="p-3">Vendor ships item; Buyer may open dispute if seller breaches terms.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">SHIPPED</td>
                      <td className="p-3">Buyer</td>
                      <td className="p-3">Buyer confirms receipt to trigger smart contract fund release.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-purple-600 dark:text-purple-400">RELEASED</td>
                      <td className="p-3">Completed</td>
                      <td className="p-3">Funds successfully transferred to vendor wallet. Lifecycle complete.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">DISPUTED</td>
                      <td className="p-3">Arbiter / Admin</td>
                      <td className="p-3">Contract funds locked pending dispute resolution evidence review.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Direct route: You can bookmark or navigate directly to <code className="font-mono">/track/[escrowId]</code> to view real-time polling updates.
              </p>
            </div>
          </section>

          {/* Section 4: Dispute Resolution */}
          <section id="dispute-guide" className="scroll-mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
            <div className="border-b border-zinc-100 pb-6 dark:border-zinc-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Dispute Resolution
              </span>
              <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                Raising & Managing Disputes
              </h2>
            </div>

            <div className="mt-6 space-y-6 text-zinc-600 dark:text-zinc-300">
              <p>
                When an order encounters an issue—such as damaged goods, non-delivery, or terms violation—either
                party can raise a dispute to freeze escrow funds before automatic release takes place.
              </p>

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <h3 className="font-semibold text-zinc-950 dark:text-white">Prerequisites to Initiate a Dispute:</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <li>The escrow must currently be in <strong className="text-zinc-800 dark:text-zinc-200">FUNDED</strong> or <strong className="text-zinc-800 dark:text-zinc-200">SHIPPED</strong> state.</li>
                    <li>Disputes cannot be opened on escrows that have already transitioned to <strong className="text-zinc-800 dark:text-zinc-200">RELEASED</strong> or <strong className="text-zinc-800 dark:text-zinc-200">CANCELLED</strong>.</li>
                    <li>You must connect the specific wallet address associated with either the buyer or vendor role for that transaction.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <h3 className="font-semibold text-zinc-950 dark:text-white">Dispute Entry Point:</h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Disputes are tied directly to an active transaction. Open the dispute route using your escrow identifier:
                    <span className="mt-2 block font-mono text-zinc-900 dark:text-zinc-100">
                      /dispute/[escrowId]
                    </span>
                    You can also click the <em>&ldquo;Raise Dispute&rdquo;</em> button directly from the tracking view (<code className="font-mono">/track/:escrowId</code>).
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <h3 className="font-semibold text-zinc-950 dark:text-white">Evidence Upload Guidelines:</h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    The dispute submission form supports up to 5 evidence attachments (PNG, JPEG, PDF) under 10MB each.
                    Be prepared to supply tracking receipts, photo evidence of damages, or communication logs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Platform Boundaries & Limitations */}
          <section className="rounded-3xl border border-zinc-300/80 bg-zinc-100/70 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              Implementation Boundaries & Financial Disclosures
            </h2>
            <div className="mt-4 grid gap-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
              <div>
                <strong className="text-zinc-900 dark:text-zinc-200">On-Chain Finality:</strong>
                <p className="mt-1">
                  Once smart contract release transactions are confirmed on Stellar, funds are settled irrevocably.
                  TrustLink cannot reverse transactions or retrieve assets once the contract execution has completed.
                </p>
              </div>

              <div>
                <strong className="text-zinc-900 dark:text-zinc-200">Testnet vs. Mainnet Assets:</strong>
                <p className="mt-1">
                  When operating on Stellar Testnet, all balances and tokens are test assets with zero monetary value.
                  Verify the network banner before transacting real tokens on Stellar Mainnet.
                </p>
              </div>

              <div>
                <strong className="text-zinc-900 dark:text-zinc-200">Network Connectivity:</strong>
                <p className="mt-1">
                  Offline mode (<code className="font-mono">/offline</code>) serves a fallback notification when your internet disconnects.
                  All wallet signatures, blockchain queries, and status updates strictly require active network access; offline transactions are not queued or permitted.
                </p>
              </div>

              <div>
                <strong className="text-zinc-900 dark:text-zinc-200">Dispute Arbitration:</strong>
                <p className="mt-1">
                  Filing a dispute pauses contract releases and submits evidence for review. It does not provide an automated
                  chargeback guarantee; final outcomes depend on evidence evaluation and smart contract arbiter rules.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
