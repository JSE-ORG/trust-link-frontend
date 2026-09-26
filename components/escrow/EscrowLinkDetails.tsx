import { formatUSDC } from "@/utils/currency";

interface EscrowLinkDetailsProps {
  amount: number;
  escrowId: string;
}

export default function EscrowLinkDetails({
  amount,
  escrowId,
}: EscrowLinkDetailsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount</p>
        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
          {formatUSDC(amount)}
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Shareable link ready
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Escrow ID: {escrowId}
        </p>
      </div>
    </div>
  );
}
