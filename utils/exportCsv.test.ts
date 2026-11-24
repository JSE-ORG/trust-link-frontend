import { afterEach, beforeEach,describe, expect, it, vi } from "vitest";

import { type CsvColumn, downloadCsv, ensureCsvExtension, exportToCsv } from "./exportCsv";

const UTF8_BOM = "\uFEFF";

describe("downloadCsv", () => {
  let appendedLink: HTMLAnchorElement | null;
  let revokedUrl: string | null;

  beforeEach(() => {
    appendedLink = null;
    revokedUrl = null;

    // Stub URL.createObjectURL / revokeObjectURL
    vi.stubGlobal(
      "URL",
      Object.assign({}, globalThis.URL, {
        createObjectURL: vi.fn(() => "blob:http://localhost/fake"),
        revokeObjectURL: vi.fn((url: string) => {
          revokedUrl = url;
        }),
      })
    );

    // Intercept anchor creation and click
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      appendedLink = node as HTMLAnchorElement;
      return node;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Capture the string parts handed to the Blob constructor. */
  function captureBlob(): () => string {
    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);
    return () => blobContent;
  }

  it("does nothing when rows is empty", () => {
    downloadCsv([], [{ key: "a", header: "A" }], "test.csv");
    expect(appendedLink).toBeNull();
  });

  it("generates correct CSV content and triggers download", () => {
    const rows = [
      { id: "1", name: "Alice, Jr.", amount: 100 },
      { id: "2", name: 'Bob "B"', amount: 200 },
    ];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "amount", header: "Amount" },
    ];

    const getContent = captureBlob();
    downloadCsv(rows, columns, "export.csv");
    const blobContent = getContent();

    // BOM prefix tells Excel the file is UTF-8.
    expect(blobContent.startsWith(UTF8_BOM)).toBe(true);

    // Rows are CRLF-joined per RFC 4180.
    const lines = blobContent.slice(UTF8_BOM.length).split("\r\n");
    expect(lines[0]).toBe("ID,Name,Amount");
    expect(lines[1]).toBe('1,"Alice, Jr.",100');
    expect(lines[2]).toBe('2,"Bob ""B""",200');

    // Verify download was triggered
    expect(appendedLink).not.toBeNull();
    expect(appendedLink!.download).toBe("export.csv");

    // Verify cleanup
    expect(revokedUrl).toBe("blob:http://localhost/fake");
  });

  it("quotes cells containing a bare carriage return", () => {
    const rows = [{ id: "1", note: "line1\rline2" }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "note", header: "Note" },
    ];

    const getContent = captureBlob();
    downloadCsv(rows, columns, "cr.csv");

    const dataLine = getContent().slice(UTF8_BOM.length).split("\r\n")[1];
    expect(dataLine).toBe('1,"line1\rline2"');
  });

  it("quotes cells containing a newline", () => {
    const rows = [{ id: "1", note: "line1\nline2" }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "note", header: "Note" },
    ];

    const getContent = captureBlob();
    downloadCsv(rows, columns, "lf.csv");

    const dataLine = getContent().slice(UTF8_BOM.length).split("\r\n")[1];
    expect(dataLine).toBe('1,"line1\nline2"');
  });

  it("prefixes a UTF-8 BOM so unicode round-trips", () => {
    const rows = [{ id: "1", name: "Café ☕ — 日本語" }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
    ];

    const getContent = captureBlob();
    downloadCsv(rows, columns, "unicode.csv");

    const content = getContent();
    expect(content.startsWith(UTF8_BOM)).toBe(true);
    expect(content).toContain("Café ☕ — 日本語");
  });

  it("handles undefined/null values gracefully", () => {
    const rows = [{ id: "1", value: undefined }, { id: "2", value: null }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "value", header: "Value" },
    ];

    const getContent = captureBlob();
    downloadCsv(rows, columns, "test.csv");

    const lines = getContent().slice(UTF8_BOM.length).split("\r\n");
    expect(lines[1]).toBe("1,");
    expect(lines[2]).toBe("2,");
  });

  it("forces a .csv extension onto the download name", () => {
    const rows = [{ id: "1" }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
    ];

    downloadCsv(rows, columns, "report");

    expect(appendedLink!.download).toBe("report.csv");
  });

  it("preserves an existing .csv extension (case-insensitive)", () => {
    expect(ensureCsvExtension("report.CSV")).toBe("report.CSV");
    expect(ensureCsvExtension("report")).toBe("report.csv");
  });

  it("does not throw when imported/called during SSR (no window or document)", () => {
    // Simulate a server environment where the DOM globals are absent.
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    expect(() => {
      downloadCsv([{ id: "1" }], [{ key: "id", header: "ID" }], "ssr.csv");
    }).not.toThrow();
  });

  it("exports typed records directly without casts and preserves column types", () => {
    interface TestItem {
      id: string;
      title: string;
      price: number;
    }
    const items: TestItem[] = [
      { id: "item-1", title: "Vintage Lens", price: 450 },
    ];
    const columns: readonly CsvColumn<TestItem>[] = [
      { key: "id", header: "Item ID" },
      { key: "title", header: "Title" },
      { key: "price", header: "Price" },
    ];

    const getContent = captureBlob();
    downloadCsv(items, columns, "items.csv");
    const blobContent = getContent();

    const lines = blobContent.slice(UTF8_BOM.length).split("\r\n");
    expect(lines[0]).toBe("Item ID,Title,Price");
    expect(lines[1]).toBe("item-1,Vintage Lens,450");
  });

  it("enforces type-safety on column keys against row keys", () => {
    interface SampleData {
      sku: string;
      stock: number;
    }
    const data: SampleData[] = [{ sku: "SKU-99", stock: 12 }];
    const validColumns: readonly CsvColumn<SampleData>[] = [
      { key: "sku", header: "SKU" },
      { key: "stock", header: "In Stock" },
    ];
    downloadCsv(data, validColumns, "stock.csv");

    // Invalid column key should be rejected at compile time:
    // @ts-expect-error - 'nonExistentField' is not assignable to keyof SampleData
    const invalidCols: readonly CsvColumn<SampleData>[] = [{ key: "nonExistentField", header: "Bad" }];
    expect(invalidCols).toHaveLength(1);
  });

  it("exports exportToCsv as an alias to downloadCsv", () => {
    expect(exportToCsv).toBe(downloadCsv);
  });
});
