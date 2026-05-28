import { getEscrow } from "@/lib/api";
import { PaymentEscrowClient } from "./PaymentEscrowClient";

interface PayPageProps {
  params: Promise<{ escrowId: string }>;
}

export default async function PayPage({ params }: PayPageProps) {
  const { escrowId } = await params;

  try {
    const escrow = await getEscrow(escrowId);

    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <PaymentEscrowClient escrow={escrow} escrowId={escrowId} />
        </div>
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-3xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
            <h1 className="text-2xl font-semibold text-red-800 dark:text-red-200">Escrow Not Found</h1>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              We could not find an escrow with ID: <span className="font-mono">{escrowId}</span>
            </p>
          </section>
        </div>
      </main>
    );
  }
}
