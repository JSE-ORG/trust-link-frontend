import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export const metadata = {
  title: "Page Not Found | TrustLink",
  description: "The page you're looking for doesn't exist. Return to TrustLink's secure escrow platform.",
};

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundClient />
    </Suspense>
  );
}
