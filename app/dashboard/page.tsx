import type { Metadata } from "next";
import { Suspense } from "react";

import translation from "@/locales/en/translation.json";

import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: translation.dashboard.metadata.pageTitle,
  description: translation.dashboard.metadata.pageDescription,
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardClient />
    </Suspense>
  );
}
