import { sanitizeCsvCell } from "@/lib/sanitize";

const CSV_EXTENSION = ".csv";
// UTF-8 byte-order mark. Excel needs this to sniff the encoding; without it it
// assumes the system codepage and mangles non-ASCII characters.
const UTF8_BOM = "\uFEFF";

/**
 * Ensure a download name ends in `.csv`. The generic helper should never hand
 * the browser a file it cannot infer the format of, so the extension is forced
 * even when the caller omits it.
 */
export function ensureCsvExtension(filename: string): string {
  return filename.toLowerCase().endsWith(CSV_EXTENSION)
    ? filename
    : `${filename}${CSV_EXTENSION}`;
}

/** Ordered field specification for CSV generation. */
export interface CsvColumn<T> {
  readonly key: keyof T;
  readonly header: string;
}

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 *
 * The output is RFC 4180-compliant: rows are joined with CRLF, cells containing
 * a comma, quote, LF or CR are quoted, embedded quotes are doubled, and a UTF-8
 * BOM is prepended so Excel reads non-ASCII text correctly.
 *
 * @param rows    - Array of plain objects to serialise.
 * @param columns - Ordered list of { key, header } pairs that control which
 *                  fields appear and what the column headers are called.
 * @param filename - Name of the downloaded file (`.csv` is appended if missing).
 * @returns Nothing. No-op (rather than throwing) when called during SSR, where
 *          there is no DOM to attach the download to.
 */
export function downloadCsv<T extends object>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
  filename: string
): void {
  if (rows.length === 0) return;

  const escape = (value: unknown): string => {
    // Neutralise spreadsheet formula injection before quoting.
    const str = sanitizeCsvCell(value);
    // Quote when the value contains a comma, quote, or any line break. A bare
    // CR must be quoted too, otherwise Excel splits the row on it.
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.map((c) => escape(c.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((c) => escape(row[c.key])).join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");

  // Browser-only from here on: creating a blob URL and clicking an anchor has
  // no meaning during server rendering, so bail out instead of throwing.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([UTF8_BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = ensureCsvExtension(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Alias for downloadCsv for backward-compatibility and standardized naming.
 */
export const exportToCsv = downloadCsv;
