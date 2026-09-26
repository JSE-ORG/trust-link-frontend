"use client";

import { FileDown } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { generateSummaryPDF } from "@/lib/pdf";
import type { Escrow } from "@/types";

/**
 * Props for the TransactionHistoryExport component.
 */
export interface TransactionHistoryExportProps {
  /**
   * The list of escrow transactions to export.
   */
  escrows: Escrow[];
  /**
   * The ID of the vendor associated with the transactions.
   * @default "vendor"
   */
  vendorId?: string;
}

/**
 * A button component that exports the provided escrow transactions as a PDF summary.
 * It handles the export process, displays toast notifications for success/error,
 * and maintains loading state during the export.
 *
 * @param props - The component props.
 * @returns The rendered export button.
 */
export default function TransactionHistoryExport({
  escrows,
  vendorId = "vendor",
}: TransactionHistoryExportProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handles the PDF export generation process.
   */
  const handleExportPDF = async (): Promise<void> => {
    if (escrows.length === 0) {
      toast.error(t("dashboard.pdfExport.noTransactions"));
      return;
    }

    try {
      setIsExporting(true);
      const filename = `trustlink-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
      await generateSummaryPDF(escrows, vendorId, filename);
      toast.success(t("dashboard.pdfExport.success"));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("dashboard.pdfExport.error"));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Keyboard event handler to trigger export on Enter or Space.
   * @param e - The keyboard event.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleExportPDF();
    }
  };

  return (
    <button
      onClick={() => void handleExportPDF()}
      onKeyDown={handleKeyDown}
      disabled={isExporting || escrows.length === 0}
      tabIndex={0}
      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      title={t("dashboard.pdfExport.title")}
    >
      <FileDown size={16} />
      {isExporting ? t("dashboard.pdfExport.exporting") : t("dashboard.pdfExport.button")}
    </button>
  );
}
