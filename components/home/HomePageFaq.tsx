import FaqAccordion from "@/components/ui/FaqAccordion";

const FAQ_ITEMS = [
  {
    question: "How does TrustLink protect my money?",
    answer:
      "TrustLink uses smart contracts on the Stellar network to hold funds in escrow. Your money is only released to the vendor after you confirm delivery, ensuring complete protection against fraud.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support Stellar (XLM) and various Stellar-based assets. The Stellar network enables fast, low-cost transactions globally, making it perfect for cross-border trade.",
  },
  {
    question: "How long does the escrow process take?",
    answer:
      "Most transactions complete within 2-5 business days depending on shipping. The escrow period automatically releases funds 7 days after delivery confirmation if no disputes are raised.",
  },
  {
    question: "What happens if there's a dispute?",
    answer:
      "If you don't receive your order or it's not as described, you can raise a dispute within the escrow period. Our team will review the evidence and make a fair decision based on the terms.",
  },
  {
    question: "Are there any hidden fees?",
    answer:
      "TrustLink charges a transparent 1.5% fee on successful transactions. There are no hidden charges, setup fees, or monthly costs. You only pay when you complete a sale.",
  },
  {
    question: "Is TrustLink available internationally?",
    answer:
      "Yes! Built on the Stellar network, TrustLink works globally. Vendors and buyers from any country can participate, with automatic currency conversion at competitive rates.",
  },
];

export default function HomePageFaq() {
  return (
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
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}
