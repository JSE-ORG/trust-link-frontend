import { DisputesListClient } from "./DisputesListClient";

export default function AdminDisputesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <DisputesListClient />
      </div>
    </main>
  );
}
