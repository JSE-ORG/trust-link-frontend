import { beforeEach,describe, expect, it, vi } from "vitest";

import { downloadCsv } from "./exportCsv";

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

  it("generates a header-only CSV when rows is empty", () => {
    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv([], [{ key: "a", header: "A" }, { key: "b", header: "B" }], "test.csv");

    const lines = blobContent.split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe("A,B");
    expect(appendedLink).not.toBeNull();
    expect(appendedLink!.download).toBe("test.csv");
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

    // Capture Blob content
    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv(rows, columns, "export.csv");

    // Verify CSV content
    const lines = blobContent.split("\n");
    expect(lines[0]).toBe("ID,Name,Amount");
    expect(lines[1]).toBe('1,"Alice, Jr.",100');
    expect(lines[2]).toBe('2,"Bob ""B""",200');

    // Verify download was triggered
    expect(appendedLink).not.toBeNull();
    expect(appendedLink!.download).toBe("export.csv");

    // Verify cleanup
    expect(revokedUrl).toBe("blob:http://localhost/fake");
  });

  it("escapes fields with newlines properly", () => {
    const rows = [
      { id: "1", note: "Line 1\nLine 2" },
    ];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "note", header: "Note" },
    ];

    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv(rows, columns, "newlines.csv");

    const lines = blobContent.split("\n");
    expect(lines[0]).toBe("ID,Note");
    expect(lines[1]).toBe('1,"Line 1');
    expect(lines[2]).toBe('Line 2"');
  });

  it("handles missing column keys gracefully", () => {
    const rows: Record<string, unknown>[] = [{ id: "1" }]; // missing 'missingKey'
    const columns = [
      { key: "id", header: "ID" },
      { key: "missingKey", header: "Missing Key" },
    ];

    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv(rows, columns, "missing.csv");

    const lines = blobContent.split("\n");
    expect(lines[1]).toBe("1,");
  });

  it("handles undefined/null values gracefully", () => {
    const rows = [{ id: "1", value: undefined }, { id: "2", value: null }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "value", header: "Value" },
    ];

    let blobContent = "";
    const OrigBlob = globalThis.Blob;
    const BlobSpy = vi.fn(function (this: Blob, parts: BlobPart[]) {
      blobContent = parts.join("");
      return new OrigBlob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv(rows, columns, "test.csv");

    const lines = blobContent.split("\n");
    expect(lines[1]).toBe("1,");
    expect(lines[2]).toBe("2,");
  });
});
