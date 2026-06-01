import { getEscrow } from "@/lib/api";
import { Escrow } from "@/types";
import DisputeForm from "./DisputeForm";

interface DisputePageProps {
  params: {
    escrowId: string;
  };
}

export default async function DisputePage({ params }: DisputePageProps) {
  const escrow = await getEscrow(params.escrowId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Order Summary
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Item</p>
            <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{escrow.item}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount</p>
            <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{escrow.amount} USDC</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Order ID</p>
            <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-200">{escrow.id}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Status</p>
            <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{escrow.status}</p>
          </div>
        </div>
      </div>

      <DisputeForm escrow={escrow} />
    </div>
  );
}
