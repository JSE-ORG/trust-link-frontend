"use client";

import { FileDown } from "lucide-react";
import type { Escrow } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

export interface TransactionHistoryExportProps {
  escrows: Escrow[];
  vendorId?: string;
}

export default function TransactionHistoryExport({
  escrows,
  vendorId = "vendor",
}: TransactionHistoryExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (escrows.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    try {
      setIsExporting(true);
      const { generateSummaryPDF } = await import("@/lib/pdf");
      const filename = `trustlink-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
      generateSummaryPDF(escrows, vendorId, filename);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting || escrows.length === 0}
      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      title="Export transaction history as PDF"
    >
      <FileDown size={16} />
      {isExporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
