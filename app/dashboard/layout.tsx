import type { Metadata } from "next";

import translation from "@/locales/en/translation.json";

export const metadata: Metadata = {
  title: translation.dashboard.metadata.title,
  description: translation.dashboard.metadata.description,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: translation.dashboard.metadata.title,
    description: translation.dashboard.metadata.description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: translation.dashboard.metadata.title,
    description: translation.dashboard.metadata.description,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
