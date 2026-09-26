import type { Metadata } from "next";

const title = "Pricing | TrustLink";
const description =
  "Compare TrustLink Free and Pro plans for secure escrow payments, unlimited escrows, analytics, advanced exports, and priority support.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/pricing",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
