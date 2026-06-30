import type { Metadata } from "next";
import { getEscrow } from "@/lib/api";
import { formatUSDC } from "@/utils/currency";

interface DisputeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DisputeLayoutProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const escrow = await getEscrow(id);
    const title = `Raise a Dispute for ${escrow.item} | TrustLink`;
    const description = `Open a secure TrustLink dispute for ${escrow.item}, ${formatUSDC(
      escrow.amount
    )}, and submit evidence for escrow resolution.`;

    return {
      title,
      description,
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Raise an Escrow Dispute | TrustLink",
      description:
        "Open a secure TrustLink dispute and submit evidence for escrow resolution.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function DisputeLayout({ children }: DisputeLayoutProps) {
  return children;
}
