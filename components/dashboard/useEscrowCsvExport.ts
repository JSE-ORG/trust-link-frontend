"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type { Escrow } from "@/types";
import { type CsvColumn, downloadCsv } from "@/utils/exportCsv";

import type { TranslateFn } from "./vendorListShared";

interface UseEscrowCsvExportOptions {
  filteredEscrows: Escrow[] | null;
  selectedEscrows: Escrow[];
  selectedCount: number;
  translate: TranslateFn;
}

function csvFilename() {
  return `trustlink-escrows-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * Builds the escrow CSV column definitions and the "export all filtered" /
 * "export selected" download handlers.
 */
export function useEscrowCsvExport({
  filteredEscrows,
  selectedEscrows,
  selectedCount,
  translate,
}: UseEscrowCsvExportOptions) {
  const getCsvColumns = useCallback(
    (): readonly CsvColumn<Escrow>[] =>
      [
        { key: "id", header: translate("dashboard.csvHeaders.escrowId") },
        { key: "item", header: translate("dashboard.csvHeaders.item") },
        { key: "buyerId", header: translate("dashboard.csvHeaders.buyer") },
        { key: "amount", header: translate("dashboard.csvHeaders.amount") },
        { key: "status", header: translate("dashboard.csvHeaders.status") },
        { key: "createdAt", header: translate("dashboard.csvHeaders.createdAt") },
      ] as const,
    [translate]
  );

  const handleExportCsv = useCallback(() => {
    if (!filteredEscrows || filteredEscrows.length === 0) return;
    downloadCsv(
      filteredEscrows,
      getCsvColumns(),
      csvFilename()
    );
  }, [filteredEscrows, getCsvColumns]);

  const handleExportSelected = useCallback(() => {
    if (selectedCount === 0) return;
    downloadCsv(
      selectedEscrows,
      getCsvColumns(),
      csvFilename()
    );
    toast.success(
      translate("dashboard.exportSelectedSuccess", { count: selectedCount })
    );
  }, [selectedCount, selectedEscrows, getCsvColumns, translate]);

  return { handleExportCsv, handleExportSelected };
}
