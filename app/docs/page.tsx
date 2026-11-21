import type { Metadata } from "next";

import DocsClient from "./DocsClient";

export const metadata: Metadata = {
  title: "User Guides & Documentation | TrustLink",
  description:
    "Comprehensive guides for creating escrow links, funding payments, tracking shipments, and resolving disputes on TrustLink.",
};

export default function DocsPage() {
  return <DocsClient />;
}
