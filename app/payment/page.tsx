import type { Metadata } from "next";
import { Suspense } from "react";

import ErrorBoundary from "@/components/layout/ErrorBoundary";
import { PAYMENT_FAQ_ITEMS } from "@/components/payment/paymentFaq";
import PaymentSection from "@/components/payment/PaymentSection";
import { Accordion, type AccordionItem } from "@/components/ui/Accordion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";

const PAYMENT_DESCRIPTION =
  "Make secure escrow payments on the Stellar network. Your funds are protected by smart contracts until delivery is confirmed.";

export const metadata: Metadata = {
  title: "Payment | TrustLink",
  description: PAYMENT_DESCRIPTION,
  keywords: [
    "escrow payment",
    "Stellar escrow",
    "secure payments",
    "smart contract escrow",
    "TrustLink payment",
  ],
  alternates: {
    canonical: "/payment",
  },
  openGraph: {
    title: "Payment | TrustLink",
    description: PAYMENT_DESCRIPTION,
    url: "/payment",
    siteName: "TrustLink",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Payment | TrustLink",
    description: PAYMENT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Payment" },
];

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Payment</h1>
        <ErrorBoundary>
          <Suspense
            fallback={
              /* Skeleton matches the PaymentSection card shape — prevents CLS
                 caused by the page height jumping from 0 → full content height */
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Skeleton className="mb-4 h-6 w-1/3" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            }
          >
            <PaymentSection />
          </Suspense>
        </ErrorBoundary>
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-zinc-950 dark:text-white">
            Frequently Asked Questions
          </h2>
          <Accordion items={PAYMENT_FAQ_ITEMS as AccordionItem[]} />
        </section>
      </div>
    </div>
  );
}
