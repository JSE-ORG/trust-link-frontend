import type { Metadata } from "next";

interface VendorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ address: string }>;
}

function formatAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export async function generateMetadata({
  params,
}: VendorLayoutProps): Promise<Metadata> {
  const { address } = await params;
  const shortAddress = formatAddress(address);
  const title = `Vendor ${shortAddress} | TrustLink`;
  const description = `Review TrustLink vendor ${shortAddress}, including escrow history, reputation signals, transaction stats, and recent activity.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/vendor/${address}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/vendor/${address}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return children;
}
