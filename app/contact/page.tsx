import { ArrowLeft, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | TrustLink",
  description: "Get in touch with TrustLink for escrow inquiries, dispute assistance, and partnerships.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.06),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] px-4 py-12 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_30%),linear-gradient(180deg,_#09090b_0%,_#0f172a_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <header className="mt-6 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light">
            Support & Inquiries
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Get in Touch
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Have questions about creating escrows, resolving disputes, or integrating with TrustLink?
            Send us a message below and our team will get back to you shortly.
          </p>
        </header>

        {/* Interactive Form */}
        <main className="mt-8">
          <ContactForm />
        </main>

        {/* Direct Email fallback */}
        <footer className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <div className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <span>Prefer direct email? Reach out to us at </span>
            <a
              href="mailto:support@trustlink.example"
              className="font-medium text-brand-primary underline hover:text-brand-primary-hover dark:text-brand-primary-light"
            >
              support@trustlink.example
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
