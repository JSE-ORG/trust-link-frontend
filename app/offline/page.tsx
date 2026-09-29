import { Suspense } from "react";

import OfflineClient from "./OfflineClient";

export const metadata = {
  title: "Offline | TrustLink",
  description: "You're offline. Check your internet connection and try again to access TrustLink's escrow platform.",
};

export default function OfflinePage() {
  return (
    <Suspense fallback={null}>
      <OfflineClient />
    </Suspense>
  );
}
