"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import ShipTrackingModal from "@/components/dashboard/ShipTrackingModal";
import { getVendorEscrows } from "@/lib/api";
import type { Escrow } from "@/types";

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
          <div key={index} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
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
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
        <p className="text-muted">No escrows found.</p>
        <Link 
          href="/" 
          className="mt-4 rounded-full bg-muted-bg px-4 py-2 text-sm font-semibold text-foreground transition hover:opacity-80"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {escrows.map((escrow) => (
          <div key={escrow.id} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">{escrow.item}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                  <span>Buyer: {escrow.buyerId ? `${escrow.buyerId.slice(0, 4)}...${escrow.buyerId.slice(-4)}` : 'Unknown'}</span>
                  <span>•</span>
                  <span>Amount: {escrow.amount} USDC</span>
                  <span>•</span>
                  <span>Created: {new Date(escrow.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-muted-bg px-3 py-1 text-xs font-medium text-foreground">
                  {escrow.status}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/escrow/${escrow.id}`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted-bg"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedEscrow(escrow)}
                    disabled={escrow.status !== "FUNDED"}
                    className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
