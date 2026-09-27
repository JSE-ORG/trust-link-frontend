import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePageCta() {
  return (
    <section className="bg-gradient-to-br from-brand-primary to-brand-accent py-20 text-white sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to Trade with Confidence?
        </h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
          Join thousands of vendors and buyers who trust TrustLink for secure
          transactions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/vendor/signup"
            className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
          >
            Start as a Vendor
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href="/verify"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-brand-primary transition-all hover:bg-white/90"
          >
            Verify a Link
          </a>
        </div>
      </div>
    </section>
  );
}
