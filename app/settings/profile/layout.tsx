import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings | TrustLink",
  description:
    "Manage your business name, display name, contact email, and profile bio on TrustLink.",
};

export default function SettingsProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
