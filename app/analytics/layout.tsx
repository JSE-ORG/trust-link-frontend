import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escrow Analytics | TrustLink",
  description:
    "Analyze TrustLink escrow performance, completion rates, dispute rates, active orders, and transaction value over time.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Escrow Analytics | TrustLink",
    description:
      "Analyze TrustLink escrow performance, completion rates, dispute rates, active orders, and transaction value over time.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Escrow Analytics | TrustLink",
    description:
      "Analyze TrustLink escrow performance, completion rates, dispute rates, active orders, and transaction value over time.",
  },
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
