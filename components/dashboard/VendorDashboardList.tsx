"use client";

import { useEffect, useState, useMemo } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ShipTrackingModal from "@/components/dashboard/ShipTrackingModal";
import TransactionHistoryExport from "@/components/dashboard/TransactionHistoryExport";
import { getVendorEscrows } from "@/lib/api";
import { downloadCsv } from "@/utils/exportCsv";
import type { Escrow } from "@/types";
import EmptyVendorState from "./EmptyVendorState";
import { formatUSDC } from "@/utils/currency";
export default function VendorDashboardList({ loading = false }: { loading?: boolean }) {
  const [escrows, setEscrows] = useState<Escrow[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredEscrows = useMemo(() => {
    if (!escrows) return null;
    
    return escrows.filter((escrow) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        escrow.id.toLowerCase().includes(query) ||
        (escrow.vendorId && escrow.vendorId.toLowerCase().includes(query)) ||
        (escrow.buyerId && escrow.buyerId.toLowerCase().includes(query)) ||
        (escrow.item && escrow.item.toLowerCase().includes(query));
        
      const matchesStatus = statusFilter === "ALL" || escrow.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [escrows, searchQuery, statusFilter]);

  const availableStatuses = useMemo(() => {
    if (!escrows) return [];
    const statuses = new Set(escrows.map((e) => e.status));
    return Array.from(statuses).sort();
  }, [escrows]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  // Filter escrows by the selected createdAt date range. An empty bound means
  // "unbounded" on that side. The `to` bound is inclusive to the end of the day.
  const filteredEscrows = useMemo(() => {
    if (!escrows) return [];
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const end = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
    return escrows.filter((escrow) => {
      const created = new Date(escrow.createdAt).getTime();
      if (start !== null && created < start) return false;
      if (end !== null && created > end) return false;
      return true;
    });
  }, [escrows, fromDate, toDate]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const handleExportCsv = () => {
    if (filteredEscrows.length === 0) return;
    downloadCsv(
      filteredEscrows,
      [
        { key: "id", header: "Escrow ID" },
        { key: "item", header: "Item" },
        { key: "buyerId", header: "Buyer" },
        { key: "amount", header: "Amount (USDC)" },
        { key: "status", header: "Status" },
        { key: "createdAt", header: "Created At" },
      ],
      `trustlink-escrows-${new Date().toISOString().slice(0, 10)}.csv`
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search escrows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-8 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white"
            >
              <option value="ALL">All Statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TransactionHistoryExport
            escrows={escrows}
            vendorId={escrows[0]?.vendorId || "vendor"}
          />
          <button
            id="export-csv-button"
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {filteredEscrows!.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">No escrows found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
            className="mt-4 text-sm font-medium text-black hover:underline dark:text-white"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEscrows!.map((escrow) => (
      {/* Date range filter — narrows the list by escrow creation date. */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="escrow-from-date" className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            From
          </label>
          <input
            id="escrow-from-date"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="escrow-to-date" className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            To
          </label>
          <input
            id="escrow-to-date"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={clearDateFilter}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
        )}
      </div>

      {filteredEscrows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          No escrows match the selected date range.
        </p>
      ) : (
      <div className="space-y-4">
        {filteredEscrows.map((escrow) => (
          <div key={escrow.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                {/* Optional Escrow Item Thumbnail */}
                {escrow.imageUrl && (
                  <div className="flex-shrink-0 overflow-hidden rounded-xl">
                    <OptimizedImage
                      src={escrow.imageUrl}
                      alt={`${escrow.item} thumbnail`}
                      width={80}
                      height={80}
                      className="h-20 w-20 object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{escrow.item}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>Buyer: {escrow.buyerId ? `${escrow.buyerId.slice(0, 4)}...${escrow.buyerId.slice(-4)}` : 'Unknown'}</span>
                    <span>•</span>
                    <span>Amount: {formatUSDC(escrow.amount)}</span>
                    <span>•</span>
                    <span>Created: {new Date(escrow.createdAt).toLocaleDateString()}</span>
                  </div>
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
        ))}
      </div>
      )}

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
