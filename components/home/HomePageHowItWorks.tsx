export default function HomePageHowItWorks() {
  return (
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
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-[var(--primary)]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                Vendor Creates Link
              </h3>
              <p className="text-[var(--muted)]">
                The vendor generates a unique escrow link with payment details and
                delivery terms.
              </p>
            </div>
            <div
              className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-[var(--border)]"
              aria-hidden="true"
            />
          </div>
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-[var(--accent)]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                Buyer Pays
              </h3>
              <p className="text-[var(--muted)]">
                Buyer sends payment to the smart contract. Funds are locked until
                delivery is confirmed.
              </p>
            </div>
            <div
              className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-[var(--border)]"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--success)]/10 flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-[var(--success)]">3</span>
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
              Funds Released
            </h3>
            <p className="text-[var(--muted)]">
              Upon delivery confirmation, the smart contract automatically releases
              funds to the vendor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
