import { sanitizeCsvCell } from "@/lib/sanitize";

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 *
 * @param rows    - Array of plain objects to serialise.
 * @param columns - Ordered list of { key, header } pairs that control which
 *                  fields appear and what the column headers are called.
 * @param filename - Name of the downloaded file (should end with `.csv`).
 */
export function downloadCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  if (rows.length === 0) return;

  const escape = (value: unknown): string => {
    // Neutralise spreadsheet formula injection before quoting.
    const str = sanitizeCsvCell(value);
    // Wrap in quotes if the value contains a comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.map((c) => escape(c.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((c) => escape(row[c.key])).join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
