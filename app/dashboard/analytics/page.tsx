import { Suspense } from "react";
import VendorAnalyticsSection from "@/components/dashboard/VendorAnalyticsSection";

export const metadata = {
  title: "Vendor Analytics | TrustLink",
  description: "Track transaction volume, average order value, completion rate, and dispute rate.",
};

export default function VendorAnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <VendorAnalyticsSection />
    </Suspense>
  );
}
