import type { Metadata } from "next";

import ProfileSettingsClient from "./ProfileSettingsClient";

export const metadata: Metadata = {
  title: "Profile Settings | TrustLink",
  description:
    "Update your business profile, contact email, and bio on TrustLink.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsClient />;
}
