import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile | TrustLink",
  description:
    "View your connected wallet, manage profile settings, and review your TrustLink subscription plan.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
