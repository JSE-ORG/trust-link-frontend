import type { AccordionItem } from "@/components/ui/Accordion";

/**
 * Shared FAQ content for payment and escrow routes.
 *
 * Both generic payment pages and escrow-specific payment routes display this
 * set of questions covering security, disputes, fees, and timing.
 */
export const PAYMENT_FAQ_ITEMS: readonly AccordionItem[] = [
  {
    question: "How does escrow protect my payment?",
    answer:
      "Your funds are held in a smart contract on the Stellar blockchain until the transaction is completed. Neither party can access the funds unilaterally, ensuring both buyer and seller are protected.",
  },
  {
    question: "What happens if there's a dispute?",
    answer:
      "If a dispute arises, our resolution process is triggered. The escrow funds remain locked in the smart contract while both parties submit evidence. A resolution is reached based on the terms agreed upon at the start.",
  },
  {
    question: "Are there any platform fees?",
    answer:
      "A small platform fee of 1.5% is charged on each transaction to maintain the infrastructure and support dispute resolution. This fee is clearly displayed before you confirm payment.",
  },
  {
    question: "How long does the escrow process take?",
    answer:
      "Once payment is confirmed on the Stellar network (typically 3-5 seconds), the escrow is active. Funds are released to the seller once the buyer confirms receipt of goods or services.",
  },
] as const;
