import { Suspense } from "react";
import NotificationsPageContent from "@/components/notifications/NotificationsPageContent";

export const metadata = {
  title: "Notifications | TrustLink",
  description: "View escrow status updates, shipping alerts, and dispute notifications.",
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsPageContent />
    </Suspense>
  );
}
