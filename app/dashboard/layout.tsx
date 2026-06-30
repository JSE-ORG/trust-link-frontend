import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escrow Dashboard | TrustLink",
  description:
    "Manage TrustLink escrows, review transaction status, track shipments, export history, and monitor active buyer payments.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Escrow Dashboard | TrustLink",
    description:
      "Manage TrustLink escrows, review transaction status, track shipments, export history, and monitor active buyer payments.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Escrow Dashboard | TrustLink",
    description:
      "Manage TrustLink escrows, review transaction status, track shipments, export history, and monitor active buyer payments.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
