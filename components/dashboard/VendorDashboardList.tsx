"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import ShipTrackingModal from "@/components/dashboard/ShipTrackingModal";

interface VendorItem {
  escrowId: string;
  vendor: string;
  orders: number;
  status: string;
}

async function fetchVendorItems() {
  const response = await fetch("/escrow", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load escrow list.");
  }

  return response.json();
}

export default function VendorDashboardList({ loading = false }: { loading?: boolean }) {
  const [items, setItems] = useState<VendorItem[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<VendorItem | null>(null);

  const loadItems = async () => {
    try {
      const data = await fetchVendorItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load vendor items."));
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleShipmentSuccess = (escrowId: string) => {
    setItems((current) =>
      current?.map((item) =>
        item.escrowId === escrowId ? { ...item, status: "Shipped" } : item
      ) ?? current
    );
  };

  if (error) throw error;

  if (loading || !items) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((index) => (
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

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.escrowId} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{item.vendor}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.orders} active orders</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEscrow(item)}
                  className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
                >
                  Mark Shipped
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEscrow && (
        <ShipTrackingModal
          escrowId={selectedEscrow.escrowId}
          vendorName={selectedEscrow.vendor}
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
