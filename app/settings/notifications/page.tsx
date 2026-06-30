import type { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notification Settings | TrustLink",
  description: "Manage your notification preferences for escrow events.",
};

export default function NotificationSettingsPage() {
  return <NotificationsClient />;
}
