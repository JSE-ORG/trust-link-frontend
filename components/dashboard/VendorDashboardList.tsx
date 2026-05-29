"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import ShipTrackingModal from "@/components/dashboard/ShipTrackingModal";
import { getVendorEscrows } from "@/lib/api";
import type { Escrow } from "@/types";
import EmptyVendorState from "./EmptyVendorState";
export default function VendorDashboardList({ loading = false }: { loading?: boolean }) {
  const [escrows, setEscrows] = useState<Escrow[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);

  const loadItems = async () => {
    try {
      const token = window.localStorage.getItem("wallet.jwt") || undefined;
      const data = await getVendorEscrows(token);
      setEscrows(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load vendor escrows."));
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleShipmentSuccess = (escrowId: string) => {
    setEscrows((current) =>
      current?.map((item) =>
        item.id === escrowId ? { ...item, status: "SHIPPED" } : item
      ) ?? current
    );
  };

  if (error) throw error;

  if (loading || !escrows) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Skeleton className="mb-4 h-5 w-1/3" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return <EmptyVendorState />;
  }

  return (
    <>
      <div className="space-y-4">
        {escrows.map((escrow) => (
          <div key={escrow.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{escrow.item}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Buyer: {escrow.buyerId ? `${escrow.buyerId.slice(0, 4)}...${escrow.buyerId.slice(-4)}` : 'Unknown'}</span>
                  <span>•</span>
                  <span>Amount: {escrow.amount} USDC</span>
                  <span>•</span>
                  <span>Created: {new Date(escrow.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {escrow.status}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/escrow/${escrow.id}`}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedEscrow(escrow)}
                    disabled={escrow.status !== "FUNDED"}
                    className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Mark Shipped
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEscrow && (
        <ShipTrackingModal
          escrowId={selectedEscrow.id}
          vendorName={selectedEscrow.item}
          open={Boolean(selectedEscrow)}
          onClose={() => setSelectedEscrow(null)}
          onSuccess={(escrowId) => {
            handleShipmentSuccess(escrowId);
            loadItems();
          }}
        />
      )}
    </>
  );
}
