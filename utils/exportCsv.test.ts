import { describe, it, expect, vi, beforeEach } from "vitest";
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

    // Capture Blob content
    let blobContent = "";
    const BlobSpy = vi.fn((parts: BlobPart[]) => {
      blobContent = parts.join("");
      return new Blob(parts);
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

  it("handles undefined/null values gracefully", () => {
    const rows = [{ id: "1", value: undefined }, { id: "2", value: null }];
    const columns: { key: keyof (typeof rows)[0]; header: string }[] = [
      { key: "id", header: "ID" },
      { key: "value", header: "Value" },
    ];

    let blobContent = "";
    const BlobSpy = vi.fn((parts: BlobPart[]) => {
      blobContent = parts.join("");
      return new Blob(parts);
    });
    vi.stubGlobal("Blob", BlobSpy);

    downloadCsv(rows, columns, "test.csv");

    const lines = blobContent.split("\n");
    expect(lines[1]).toBe("1,");
    expect(lines[2]).toBe("2,");
  });
});
