import type { Metadata } from "next";

import DisputePageClient from "./DisputePageClient";

export const metadata: Metadata = {
  title: "Raise a Dispute | TrustLink",
  description:
    "Raise a dispute for your escrow transaction and get help resolving it on TrustLink.",
};

export default async function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisputePageClient id={id} />;
}
