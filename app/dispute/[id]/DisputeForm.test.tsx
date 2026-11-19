import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { createDispute } from "@/lib/api";
import { DisputeStatusConst } from "@/types";

import DisputeForm from "./DisputeForm";

// Mock the API client and analytics
vi.mock("@/lib/api", () => ({
  createDispute: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

// Helper to set files on input
function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: files,
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

// jsdom refuses non-empty values on file inputs, so emulate a browser that
// remembers the picked file's path until the app clears it.
function selectFiles(input: HTMLInputElement, files: File[]) {
  let value = files.length ? `C:\\fakepath\\${files[0].name}` : "";
  Object.defineProperty(input, "value", {
    get: () => value,
    set: (next: string) => {
      value = next;
    },
    configurable: true,
  });
  setFiles(input, files);
}

describe("Production DisputeForm - app/dispute/[id]/DisputeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form elements correctly", () => {
    render(<DisputeForm escrowId="123" />);

    expect(screen.getByLabelText(/reason for dispute/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload images or pdfs/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit dispute/i })).toBeInTheDocument();
  });

  it("restricts the file input selection using the accept attribute", () => {
    render(<DisputeForm escrowId="123" />);

    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;
    expect(fileInput.getAttribute("accept")).toBe(
      "image/jpeg,image/png,image/webp,application/pdf"
    );
  });

  it("rejects files with unsupported MIME types and shows an inline error", async () => {
    render(<DisputeForm escrowId="123" />);

    const invalidFile = new File(["test content"], "danger.exe", { type: "application/x-msdownload" });
    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;

    setFiles(fileInput, [invalidFile]);

    // Check that we display the correct inline validation error message
    expect(
      screen.getByText(/Please upload an image \(JPG, PNG, WebP\) or PDF\./i)
    ).toBeInTheDocument();

    // Check that the file was not added to the display list
    expect(screen.queryByText("danger.exe")).not.toBeInTheDocument();
  });

  it("rejects files exceeding 10MB size and shows an inline error", async () => {
    render(<DisputeForm escrowId="123" />);

    const oversizedFile = new File(
      ["x".repeat(11 * 1024 * 1024)],
      "huge.pdf",
      { type: "application/pdf" }
    );
    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;

    setFiles(fileInput, [oversizedFile]);

    // Check that we show the inline file size error message
    expect(
      screen.getByText(/Each file must be 10 MB or smaller\./i)
    ).toBeInTheDocument();

    // Check that the file was not added to the display list
    expect(screen.queryByText("huge.pdf")).not.toBeInTheDocument();
  });

  it("accepts valid files (JPG, PNG, WebP, PDF) up to 10MB and shows them in the list", async () => {
    render(<DisputeForm escrowId="123" />);

    const validFiles = [
      new File(["img1"], "photo.jpg", { type: "image/jpeg" }),
      new File(["img2"], "pic.png", { type: "image/png" }),
      new File(["img3"], "graphic.webp", { type: "image/webp" }),
      new File(["doc1"], "statement.pdf", { type: "application/pdf" }),
    ];

    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;
    setFiles(fileInput, validFiles);

    // No error should be shown
    expect(
      screen.queryByText(/Please upload an image/i)
    ).not.toBeInTheDocument();

    // Files should be displayed in the list
    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    expect(screen.getByText("pic.png")).toBeInTheDocument();
    expect(screen.getByText("graphic.webp")).toBeInTheDocument();
    expect(screen.getByText("statement.pdf")).toBeInTheDocument();
  });

  it("removes a file from the list when X/remove is clicked", async () => {
    render(<DisputeForm escrowId="123" />);

    const file = new File(["test"], "receipt.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;

    setFiles(fileInput, [file]);
    expect(screen.getByText("receipt.pdf")).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: /remove receipt.pdf/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText("receipt.pdf")).not.toBeInTheDocument();
  });

  it("prevents uploading more than 5 files total and shows an error", async () => {
    render(<DisputeForm escrowId="123" />);

    const filesSet1 = [
      new File(["f1"], "1.jpg", { type: "image/jpeg" }),
      new File(["f2"], "2.jpg", { type: "image/jpeg" }),
      new File(["f3"], "3.jpg", { type: "image/jpeg" }),
    ];
    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;

    setFiles(fileInput, filesSet1);

    const filesSet2 = [
      new File(["f4"], "4.jpg", { type: "image/jpeg" }),
      new File(["f5"], "5.jpg", { type: "image/jpeg" }),
      new File(["f6"], "6.jpg", { type: "image/jpeg" }),
    ];
    setFiles(fileInput, filesSet2);

    expect(
      screen.getByText(/You can upload a maximum of 5 files\./i)
    ).toBeInTheDocument();
  });

  it("submits the form successfully when all inputs and files are valid", async () => {
    vi.mocked(createDispute).mockResolvedValueOnce({
      id: "DISP-SUCCESS",
      status: DisputeStatusConst.OPEN,
    } as unknown as Awaited<ReturnType<typeof createDispute>>);

    render(<DisputeForm escrowId="ESC-777" />);

    // Fill out reason
    const reasonTextarea = screen.getByLabelText(/reason for dispute/i);
    fireEvent.change(reasonTextarea, {
      target: { value: "The package was never delivered after 30 days of waiting." },
    });

    // Upload a file
    const file = new File(["test content"], "invoice.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;
    setFiles(fileInput, [file]);

    // Submit
    const submitBtn = screen.getByRole("button", { name: /submit dispute/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createDispute).toHaveBeenCalledTimes(1);
      expect(createDispute).toHaveBeenCalledWith("ESC-777", {
        reason: "The package was never delivered after 30 days of waiting.",
        description: "The package was never delivered after 30 days of waiting.",
        evidence: ["invoice.pdf"],
      });
      expect(screen.getByText(/dispute submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/reference id: disp-success/i)).toBeInTheDocument();
    });
  });

  describe("reselecting evidence files", () => {
    function fileInput() {
      return screen.getByLabelText(/upload images or pdfs/i) as HTMLInputElement;
    }

    it("clears the native input so a removed file can be selected again", () => {
      render(<DisputeForm escrowId="123" />);
      const file = new File(["test"], "receipt.pdf", { type: "application/pdf" });

      selectFiles(fileInput(), [file]);
      expect(fileInput().value).toBe("");
      expect(screen.getByText("receipt.pdf")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /remove receipt.pdf/i }));
      expect(screen.queryByText("receipt.pdf")).not.toBeInTheDocument();

      selectFiles(fileInput(), [file]);
      expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
    });

    it("clears the native input after a rejected selection so it can be retried", () => {
      render(<DisputeForm escrowId="123" />);
      const huge = new File(["x".repeat(11 * 1024 * 1024)], "huge.pdf", {
        type: "application/pdf",
      });

      selectFiles(fileInput(), [huge]);
      expect(fileInput().value).toBe("");
      expect(screen.getByText(/Each file must be 10 MB or smaller\./i)).toBeInTheDocument();

      selectFiles(fileInput(), [huge]);
      expect(screen.getByText(/Each file must be 10 MB or smaller\./i)).toBeInTheDocument();
    });

    it("keeps accepted files listed after the native input is reset", () => {
      render(<DisputeForm escrowId="123" />);

      selectFiles(fileInput(), [new File(["a"], "a.pdf", { type: "application/pdf" })]);
      selectFiles(fileInput(), [new File(["b"], "b.png", { type: "image/png" })]);

      expect(fileInput().value).toBe("");
      expect(screen.getByText("a.pdf")).toBeInTheDocument();
      expect(screen.getByText("b.png")).toBeInTheDocument();
    });

    it("makes the evidence picker keyboard focusable with sr-only class and associated hints", () => {
      render(<DisputeForm escrowId="123" />);
      const input = fileInput();

      expect(input).not.toHaveClass("hidden");
      expect(input).toHaveClass("sr-only");
      expect(input).toHaveAttribute("aria-describedby", "evidence-hint");
      expect(screen.getByText(/accepted formats/i)).toHaveAttribute("id", "evidence-hint");

      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it("associates error message with the input via aria-describedby and aria-invalid when invalid", () => {
      render(<DisputeForm escrowId="123" />);
      const input = fileInput();
      const invalidFile = new File(["bad"], "bad.exe", { type: "application/x-msdownload" });

      setFiles(input, [invalidFile]);

      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "evidence-hint dispute-error");
      const errorMsg = screen.getByRole("alert");
      expect(errorMsg).toHaveAttribute("id", "dispute-error");
    });
  });
});
