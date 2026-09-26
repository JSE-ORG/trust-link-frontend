import { Suspense } from "react";

import VendorAnalyticsSection from "@/components/dashboard/VendorAnalyticsSection";
import translation from "@/locales/en/translation.json";

export const metadata = {
  title: translation.dashboard.metadata.analyticsTitle,
  description: translation.dashboard.metadata.analyticsDescription,
};

export default function VendorAnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <VendorAnalyticsSection />
    </Suspense>
  );
}
