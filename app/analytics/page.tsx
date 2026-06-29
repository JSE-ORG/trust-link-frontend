import type { Metadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics | TrustLink",
  description:
    "Track your escrow performance — transaction volume, completion rate, dispute rate, and monthly trends.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
