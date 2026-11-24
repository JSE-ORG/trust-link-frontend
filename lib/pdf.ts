import type { Escrow } from '@/types';
import { formatUSDC } from '@/utils/currency';
import { truncateAddress } from "@/utils/truncateAddress";

// `jspdf` and `html2canvas` are large (~100kb+ combined) and only needed when a
// user actually triggers a PDF export, so they're dynamically imported inside
// each function below rather than imported statically at module scope. This
// keeps them out of the initial JS payload and lets bundlers split them into
// their own on-demand chunk. See #653.

/** A4 dimensions in millimetres. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Locale and time-zone used for every date printed in an export. Pinning both
 * makes the output deterministic across the server, CI and the user's browser
 * (an unpinned `toLocaleString()` renders differently in each environment).
 */
const PDF_LOCALE = 'en-US';
const PDF_TIMEZONE = 'UTC';

export interface PDFExportOptions {
  filename?: string;
  title?: string;
}

/**
 * Formats a timestamp for a PDF export using a pinned locale and time zone.
 *
 * @param value - A `Date`, ISO string, epoch millis, or nothing.
 * @param fallback - Returned when the value is missing or unparseable.
 * @returns A stable, human-readable timestamp, never `"Invalid Date"`.
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = 'N/A'
): string {
  if (value === null || value === undefined || value === '') return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(PDF_LOCALE, { timeZone: PDF_TIMEZONE });
}

/**
 * Truncates an identifier to `start…end` characters for display, leaving short
 * values untouched so an id like `abc` is never rendered as `abc...abc`.
 *
 * Kept as the PDF-facing name for {@link truncateAddress}, which owns the
 * slicing logic used elsewhere in the app.
 */
export function truncateForDisplay(value: string, start = 6, end = 6): string {
  return truncateAddress(value, start, end);
}

/**
 * Sanitises a filename destined for `pdf.save()`. Strips directory traversal,
 * control/unsafe characters and guarantees a `.pdf` extension so a malicious
 * escrow id cannot influence the saved path.
 */
export function sanitizePdfFilename(
  filename: string,
  fallback = 'export.pdf'
): string {
  const base = String(filename ?? '').trim();
  if (!base) return fallback;

  const lastSegment = base.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? '';
  const sanitized = lastSegment
    // Keep word chars, dots and dashes; replace everything else.
    .replace(/[^\w.\-]+/g, '_')
    // No leading dots (hidden files / traversal remnants).
    .replace(/^\.+/, '')
    .trim();

  if (!sanitized) return fallback;
  return /\.pdf$/i.test(sanitized) ? sanitized : `${sanitized}.pdf`;
}

/** Throws when a receipt total is not a finite, non-negative number. */
function assertValidTotal(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid receipt ${label}: expected a finite, non-negative number.`);
  }
}

/**
 * Renders an HTML element to a multi-page A4 PDF and triggers a browser download.
 *
 * Uses `html2canvas` to rasterise the element at 2× resolution, then slices the
 * resulting bitmap vertically so each page receives a distinct region at the top
 * of the page. Slicing (rather than drawing the whole image at a shifting
 * negative offset) avoids re-rasterising the same bitmap and keeps page breaks
 * aligned to the source pixels.
 *
 * @param element - The DOM node to render (must be present in the document).
 * @param options - Optional filename and title overrides.
 * @returns Promise that resolves when the PDF has been saved.
 * @throws {Error} When `html2canvas` or jsPDF cannot process the element.
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'export.pdf',
  } = options;

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgWidth = A4_WIDTH_MM; // A4 width in mm
    const pageHeight = A4_HEIGHT_MM; // A4 height in mm

    const pdf = new jsPDF('p', 'mm', 'a4');

    // Total rendered height once scaled to the page width.
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const scale = canvas.width / imgWidth; // px per mm

    if (!(imgHeight > 0) || !(scale > 0)) {
      // Degenerate (zero-size) canvas — nothing meaningful to render.
      pdf.save(sanitizePdfFilename(filename));
      return;
    }

    const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));

    for (let page = 0; page < totalPages; page += 1) {
      if (page > 0) pdf.addPage();

      const offsetMm = page * pageHeight;
      const remainingMm = imgHeight - offsetMm;
      const sliceHeightMm = Math.min(pageHeight, remainingMm);

      // Source pixel region for this page.
      const sourceY = Math.round(offsetMm * scale);
      const sourceHeight = Math.max(
        1,
        Math.min(canvas.height - sourceY, Math.round(sliceHeightMm * scale))
      );

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sourceHeight;
      const context = sliceCanvas.getContext('2d');
      if (context) {
        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );
      }

      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        sliceHeightMm
      );
    }

    pdf.save(sanitizePdfFilename(filename));
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Derives summary statistics and a normalised transaction list from an array of
 * escrow records, ready for inclusion in a PDF export.
 *
 * @param escrows - Full list of escrow records belonging to the vendor.
 * @returns Object containing total counts, cumulative amount, a status frequency
 *   map, and an array of simplified transaction rows.
 */
export function formatTransactionHistoryData(escrows: Escrow[]): {
  totalTransactions: number;
  totalAmount: number;
  statusBreakdown: Record<string, number>;
  transactions: Array<{
    id: string;
    item: string;
    amount: number;
    status: string;
    createdAt: string;
    buyerId: string;
  }>;
} {
  const transactions = escrows.map((escrow) => {
    // Guard against non-finite amounts so the report never prints "NaN".
    const amount = Number.isFinite(escrow.amount) ? escrow.amount : 0;
    return {
      id: escrow.id,
      item: escrow.item,
      amount,
      status: escrow.status,
      createdAt: formatDateTime(escrow.createdAt),
      buyerId: escrow.buyerId ? truncateForDisplay(escrow.buyerId, 6, 6) : 'N/A',
    };
  });

  const statusBreakdown: Record<string, number> = {};
  let totalAmount = 0;

  escrows.forEach((escrow) => {
    if (Number.isFinite(escrow.amount)) {
      totalAmount += escrow.amount;
    }
    statusBreakdown[escrow.status] = (statusBreakdown[escrow.status] || 0) + 1;
  });

  return {
    totalTransactions: escrows.length,
    totalAmount,
    statusBreakdown,
    transactions,
  };
}

/**
 * Generates and immediately downloads a transaction-history PDF using only
 * jsPDF (no `html2canvas`), making it suitable for server-compatible or
 * lightweight client-side use.
 *
 * Renders a header, summary section, status breakdown, and a tabular list of
 * transactions. Automatically adds new pages when content overflows.
 *
 * @param escrows - Full list of escrow records to summarise.
 * @param vendorId - The vendor's public identifier, printed in the report header.
 * @param filename - Output filename (defaults to `"transaction-history.pdf"`).
 */
export async function generateSummaryPDF(
  escrows: Escrow[],
  vendorId: string,
  filename = 'transaction-history.pdf'
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const data = formatTransactionHistoryData(escrows);
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Transaction History Report', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const generatedDate = formatDateTime(new Date());
  pdf.text(`Generated on: ${generatedDate}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Vendor ID: ${vendorId}`, margin, yPosition);
  yPosition += 12;

  // Summary Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Summary', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Total Transactions: ${data.totalTransactions}`, margin + 5, yPosition);
  yPosition += 6;
  pdf.text(`Total Amount: $${data.totalAmount.toFixed(2)} USDC`, margin + 5, yPosition);
  yPosition += 12;

  // Status Breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Status Breakdown', margin, yPosition);
  yPosition += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  Object.entries(data.statusBreakdown).forEach(([status, count]) => {
    pdf.text(`${status}: ${count}`, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // Transactions Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Transaction Details', margin, yPosition);
  yPosition += 8;

  // Table header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setFillColor(240, 240, 240);
  // Column widths MUST sum to contentWidth (180mm) so the table spans the page.
  const colWidths = [30, 40, 25, 20, 35, 30];
  const headers = ['Item', 'Buyer ID', 'Amount', 'Status', 'Date', 'Transaction ID'];

  let xPosition = margin;
  headers.forEach((header, i) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });

  yPosition += 7;
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition - 1, pageWidth - margin, yPosition - 1);
  yPosition += 2;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  data.transactions.forEach((transaction, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;
    }

    // Alternating row background is painted BEFORE the text so the glyphs are
    // never covered by a later `rect('F')`.
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPosition - 5, contentWidth, 5, 'F');
    }

    const rowData = [
      transaction.item.substring(0, 20),
      transaction.buyerId,
      `$${transaction.amount.toFixed(2)}`,
      transaction.status,
      transaction.createdAt.substring(0, 10),
      transaction.id.substring(0, 8),
    ];

    xPosition = margin;
    rowData.forEach((cell, i) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += colWidths[i];
    });

    yPosition += 6;
  });

  // Footer — paginate first so it never prints over the final table row.
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  if (yPosition > pageHeight - margin - 10) {
    pdf.addPage();
    yPosition = margin;
  }
  pdf.text(
    'This is an automatically generated report from TrustLink.',
    margin,
    pageHeight - 10
  );

  pdf.save(sanitizePdfFilename(filename, 'transaction-history.pdf'));
}

/** TrustLink brand primary (`#1B2A6B`) as jsPDF RGB components. */
const BRAND_PRIMARY_RGB: [number, number, number] = [27, 42, 107];

/** Details printed on a buyer's payment receipt. */
export interface ReceiptData {
  /** Escrow the payment funded. */
  escrowId: string;
  /** Human-readable item name. */
  itemName: string;
  /** Escrow item amount in USDC, before fees. */
  amount: number;
  /** Protocol fee in USDC charged on top of `amount`. */
  protocolFee?: number;
  /** USDC amount actually paid; defaults to `amount + protocolFee`. */
  total?: number;
  /** Buyer email and/or phone number supplied for the escrow. */
  buyerContact?: string;
  /** On-chain transaction hash for the funding payment. */
  txHash: string;
  /** When the payment settled; defaults to now. */
  timestamp?: string | Date;
}

/**
 * Generates and downloads a single-page, TrustLink-branded payment receipt for
 * a buyer.
 *
 * Uses jsPDF only (no `html2canvas`) so the receipt can be produced straight
 * from transaction data rather than by rasterising the page. Like the other
 * exports here, jsPDF is imported on demand to keep it out of the initial
 * bundle.
 *
 * @param receipt - Escrow, item, amount, transaction hash, and timestamp.
 * @param filename - Output filename (defaults to `trustlink-receipt-{escrowId}.pdf`).
 * @throws {Error} When `amount`, `protocolFee` or `total` is negative or not a
 *   finite number.
 */
export async function generateReceiptPDF(
  receipt: ReceiptData,
  filename = `trustlink-receipt-${receipt.escrowId}.pdf`
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const protocolFee = receipt.protocolFee ?? 0;
  const total = receipt.total ?? receipt.amount + protocolFee;

  // Reject negative / NaN totals before any rendering happens.
  assertValidTotal(receipt.amount, 'amount');
  assertValidTotal(protocolFee, 'protocol fee');
  assertValidTotal(total, 'total');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  const paidAt = receipt.timestamp ? new Date(receipt.timestamp) : new Date();

  const [brandR, brandG, brandB] = BRAND_PRIMARY_RGB;

  // Branded header band
  pdf.setFillColor(brandR, brandG, brandB);
  pdf.rect(0, 0, pageWidth, 32, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('TrustLink', margin, 15);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('Payment Receipt', margin, 24);

  pdf.setTextColor(0, 0, 0);
  let yPosition = 48;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Issued: ${formatDateTime(new Date())}`, margin, yPosition);
  yPosition += 12;

  // Transaction details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Transaction Details', margin, yPosition);
  yPosition += 3;
  pdf.setDrawColor(brandR, brandG, brandB);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 9;

  const labelWidth = 45;
  const rows: Array<[string, string]> = [
    ['Escrow ID', receipt.escrowId],
    ['Item', receipt.itemName],
    ...(receipt.buyerContact ? [['Buyer Contact', receipt.buyerContact] as [string, string]] : []),
    ['Paid At', formatDateTime(paidAt)],
    ['Transaction Hash', receipt.txHash],
  ];

  pdf.setFontSize(10);
  rows.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    // Hashes and long item names wrap rather than run off the page.
    const lines = pdf.splitTextToSize(
      value,
      pageWidth - margin * 2 - labelWidth
    ) as string[];
    pdf.text(lines, margin + labelWidth, yPosition);
    yPosition += 7 * lines.length;
  });

  yPosition += 5;

  // Amount summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Amount', margin, yPosition);
  yPosition += 3;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 9;

  const amountRows: Array<[string, number]> = [['Item Amount', receipt.amount]];
  if (protocolFee > 0) {
    amountRows.push(['Protocol Fee', protocolFee]);
  }

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  amountRows.forEach(([label, value]) => {
    pdf.text(label, margin, yPosition);
    pdf.text(formatUSDC(value), pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;
  });

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
  yPosition += 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Total Paid', margin, yPosition);
  pdf.text(formatUSDC(total), pageWidth - margin, yPosition, { align: 'right' });

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    'Funds are held in a Stellar smart contract until the order is completed.',
    margin,
    pageHeight - 14
  );
  pdf.text(
    'This receipt was generated automatically by TrustLink.',
    margin,
    pageHeight - 10
  );

  pdf.save(sanitizePdfFilename(filename, `trustlink-receipt-${receipt.escrowId}.pdf`));
}
