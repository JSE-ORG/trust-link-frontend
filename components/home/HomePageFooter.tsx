import Link from "next/link";

export default function HomePageFooter() {
  return (
    <footer className="bg-[var(--foreground)] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">TrustLink</h3>
            <p className="text-white/70 max-w-md">
              Secure escrow payments powered by the Stellar network. Protecting
              buyers and vendors worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <Link href="/vendor/signup" className="hover:text-white transition-colors">
                  For Vendors
                </Link>
              </li>
              <li>
                <a href="/verify" className="hover:text-white transition-colors">
                  Verify Link
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
          © 2025 TrustLink. Built on Stellar.
        </div>
      </div>
    </footer>
  );
}
