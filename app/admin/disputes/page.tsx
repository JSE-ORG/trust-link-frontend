import { Suspense } from "react";
import { DisputesListClient } from "./DisputesListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Disputes | TrustLink Admin",
  description: "Manage and resolve escrow disputes. Review evidence, communicate with parties, and make fair decisions.",
};

export default function AdminDisputesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={null}>
          <DisputesListClient />
        </Suspense>
      </div>
    </main>
  );
}
