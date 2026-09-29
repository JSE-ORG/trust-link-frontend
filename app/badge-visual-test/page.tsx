import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";

/**
 * Test page that renders all EscrowStatusBadge variants for visual regression testing.
 * This page is only used by Playwright and is not linked from the main app.
 */
export default function BadgeVisualTestPage() {
  const statuses = [
    "Pending",
    "Funded",
    "Shipped",
    "Completed",
    "Disputed",
    "Released",
    "Refunded",
    "Expired",
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="mb-8 text-2xl font-bold">EscrowStatusBadge Variants</h1>
      <div className="flex flex-col gap-4">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium text-zinc-600">{status}</span>
            <EscrowStatusBadge status={status} />
          </div>
        ))}
      </div>
    </div>
  );
}