import { sanitizeCsvCell } from "@/lib/sanitize";

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 *
 * @param rows    - Array of plain objects to serialise.
 * @param columns - Ordered list of { key, header } pairs that control which
 *                  fields appear and what the column headers are called.
 * @param filename - Name of the downloaded file (should end with `.csv`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadCsv<T extends Record<string, any>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  // Enforce .csv extension
  const csvFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  const escape = (value: unknown): string => {
    // Neutralise spreadsheet formula injection before quoting.
    const str = sanitizeCsvCell(value);
    // Wrap in quotes if the value contains a comma, quote, newline, or carriage return
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.map((c) => escape(c.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((c) => escape(row[c.key])).join(",")
  );

  // Use CRLF line endings for proper Excel compatibility and add UTF-8 BOM
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

  // Guard against SSR context where document/URL may not be available
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("downloadCsv can only be called in a browser environment");
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
