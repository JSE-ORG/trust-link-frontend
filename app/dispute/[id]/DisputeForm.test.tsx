import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import DisputeForm from "./DisputeForm";
import { createDispute } from "@/lib/api";

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
      status: "OPEN",
    } as any);

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
});
