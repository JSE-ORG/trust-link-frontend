import DisputeForm from "@/components/escrow/DisputeForm";

/**
 * Test page that renders the 4-step DisputeForm wizard for the complete
 * dispute filing flow e2e test (tests/e2e/dispute-flow.spec.ts).
 * This page is only used by Playwright and is not linked from the main app.
 */
export default function DisputeFormTestPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white mb-3">
            Raise a Dispute
          </h1>
        </header>
        <DisputeForm />
      </div>
    </main>
  );
}