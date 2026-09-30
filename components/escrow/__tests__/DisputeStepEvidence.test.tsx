import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import type { DisputeFormValues } from "@/lib/validations/dispute";

import { DisputeStepEvidence, type DisputeStepEvidenceProps } from "../DisputeStepEvidence";

const baseFormData: DisputeFormValues = {
  name: "Jane Doe",
  email: "jane@example.com",
  orderNumber: "ORD-1",
  reason: "damaged_product",
  description: "The item arrived broken in several places.",
  files: [],
  agreeToTerms: false,
};

function makeFile(name: string, type: string, sizeInBytes = 2048): File {
  return new File([new Uint8Array(sizeInBytes)], name, { type });
}

function renderStep(overrides: Partial<DisputeStepEvidenceProps> = {}) {
  const props: DisputeStepEvidenceProps = {
    formData: baseFormData,
    errors: {},
    handleFileUpload: vi.fn(),
    removeFile: vi.fn(),
    ...overrides,
  };
  const utils = render(<DisputeStepEvidence {...props} />);
  return { ...utils, props };
}

describe("DisputeStepEvidence", () => {
  let urlCounter: number;
  let createObjectURL: ReturnType<typeof vi.fn<(obj: Blob | MediaSource) => string>>;
  let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    // jsdom does not implement the blob URL APIs.
    urlCounter = 0;
    createObjectURL = vi.fn(() => `blob:mock/${++urlCounter}`);
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true, writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true, writable: true });
    consoleError = vi.spyOn(console, "error");
  });

  afterEach(() => {
    // Guards against act() warnings and other React errors leaking into test output.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe("rendering", () => {
    it("renders the step heading and a multi-file input restricted to supported types", () => {
      renderStep();

      expect(screen.getByTestId("step-3")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /step 3: upload evidence/i })).toBeInTheDocument();

      const input = screen.getByTestId("file-input");
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("multiple");
      expect(input).toHaveAttribute(
        "accept",
        "image/jpeg,image/png,image/jpg,image/webp,application/pdf",
      );
      expect(screen.getByLabelText("Upload Supporting Documents *")).toBe(input);
    });

    it("shows the accepted-formats hint when there is no error", () => {
      renderStep();

      expect(screen.getByText(/accepted formats: jpeg, png, webp, pdf/i)).toBeInTheDocument();
      expect(screen.getByTestId("file-input")).toHaveAttribute("aria-invalid", "false");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("does not render the uploaded files list when no files are attached", () => {
      renderStep();

      expect(screen.queryByText(/uploaded files:/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("error state", () => {
    it("shows the files error in place of the hint and marks the input invalid", () => {
      renderStep({ errors: { files: "Please upload at least one file as evidence" } });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Please upload at least one file as evidence");
      expect(screen.queryByText(/accepted formats/i)).not.toBeInTheDocument();

      const input = screen.getByTestId("file-input");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("Please upload at least one file as evidence");
    });

    it("ignores errors for fields that belong to other steps", () => {
      renderStep({ errors: { description: "Description is required" } });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("file list", () => {
    it("lists each file with its name and size in KB", () => {
      const files = [makeFile("receipt.pdf", "application/pdf", 1536), makeFile("photo.png", "image/png", 2048)];
      renderStep({ formData: { ...baseFormData, files } });

      expect(screen.getByText(/uploaded files:/i)).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByTestId("file-0")).toHaveTextContent("receipt.pdf (1.5 KB)");
      expect(screen.getByTestId("file-1")).toHaveTextContent("photo.png (2.0 KB)");
    });

    it("renders a thumbnail for image files only", () => {
      const files = [
        makeFile("photo.jpg", "image/jpeg"),
        makeFile("receipt.pdf", "application/pdf"),
        makeFile("shot.webp", "image/webp"),
      ];
      renderStep({ formData: { ...baseFormData, files } });

      const first = screen.getByTestId("preview-0");
      expect(first).toHaveAttribute("src", "blob:mock/1");
      expect(first).toHaveAttribute("alt", "Preview of photo.jpg");

      expect(within(screen.getByTestId("file-1")).queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByTestId("preview-1")).not.toBeInTheDocument();

      expect(screen.getByTestId("preview-2")).toHaveAttribute("src", "blob:mock/2");
      expect(createObjectURL).toHaveBeenCalledTimes(2);
      expect(createObjectURL).toHaveBeenNthCalledWith(1, files[0]);
      expect(createObjectURL).toHaveBeenNthCalledWith(2, files[2]);
    });
  });

  describe("interactions", () => {
    it("forwards file input changes to handleFileUpload", () => {
      const { props } = renderStep();
      const file = makeFile("photo.png", "image/png");

      fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });

      expect(props.handleFileUpload).toHaveBeenCalledTimes(1);
    });

    it("calls removeFile with the file's index when Remove is clicked", async () => {
      const user = userEvent.setup();
      const files = [makeFile("a.pdf", "application/pdf"), makeFile("b.pdf", "application/pdf")];
      const { props } = renderStep({ formData: { ...baseFormData, files } });

      await user.click(screen.getByRole("button", { name: "Delete b.pdf" }));

      expect(props.removeFile).toHaveBeenCalledTimes(1);
      expect(props.removeFile).toHaveBeenCalledWith(1);
    });

    it.each(["Enter", " "])("calls removeFile once when %j is pressed on Remove", (key) => {
      const files = [makeFile("a.pdf", "application/pdf")];
      const { props } = renderStep({ formData: { ...baseFormData, files } });

      fireEvent.keyDown(screen.getByTestId("delete-file-0"), { key });

      expect(props.removeFile).toHaveBeenCalledTimes(1);
      expect(props.removeFile).toHaveBeenCalledWith(0);
    });

    it("ignores other keys on Remove", () => {
      const files = [makeFile("a.pdf", "application/pdf")];
      const { props } = renderStep({ formData: { ...baseFormData, files } });

      fireEvent.keyDown(screen.getByTestId("delete-file-0"), { key: "Tab" });
      fireEvent.keyDown(screen.getByTestId("delete-file-0"), { key: "a" });

      expect(props.removeFile).not.toHaveBeenCalled();
    });
  });

  describe("preview URL lifecycle", () => {
    it("revokes every object URL on unmount", () => {
      const files = [makeFile("a.png", "image/png"), makeFile("b.jpg", "image/jpeg")];
      const { unmount } = renderStep({ formData: { ...baseFormData, files } });

      expect(revokeObjectURL).not.toHaveBeenCalled();
      unmount();

      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock/1");
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock/2");
    });

    it("does not recreate URLs when re-rendered with the same files", () => {
      const files = [makeFile("a.png", "image/png"), makeFile("b.png", "image/png")];
      const { rerender, props } = renderStep({ formData: { ...baseFormData, files } });

      rerender(<DisputeStepEvidence {...props} formData={{ ...baseFormData, files: [...files] }} errors={{}} />);

      expect(createObjectURL).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).not.toHaveBeenCalled();
      expect(screen.getByTestId("preview-0")).toHaveAttribute("src", "blob:mock/1");
    });

    it("revokes only the removed file's URL when the last file is removed", () => {
      const a = makeFile("a.png", "image/png");
      const b = makeFile("b.png", "image/png");
      const { rerender, props } = renderStep({ formData: { ...baseFormData, files: [a, b] } });

      rerender(<DisputeStepEvidence {...props} formData={{ ...baseFormData, files: [a] }} />);

      expect(revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock/2");
      expect(screen.getByTestId("preview-0")).toHaveAttribute("src", "blob:mock/1");
      expect(createObjectURL).toHaveBeenCalledTimes(2);
    });

    it("swaps in a fresh URL and revokes the old one when a slot's file changes", () => {
      const a = makeFile("a.png", "image/png");
      const b = makeFile("b.png", "image/png");
      const { rerender, props } = renderStep({ formData: { ...baseFormData, files: [a, b] } });

      // Removing `a` shifts `b` into slot 0.
      rerender(<DisputeStepEvidence {...props} formData={{ ...baseFormData, files: [b] }} />);

      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("preview-0")).toHaveAttribute("src", "blob:mock/3");
      expect(screen.getByTestId("preview-0")).toHaveAttribute("alt", "Preview of b.png");
      expect(screen.queryByTestId("preview-1")).not.toBeInTheDocument();
    });

    it("shows a live URL and leaks nothing under Strict Mode", () => {
      const files = [makeFile("a.png", "image/png")];
      const { unmount } = render(
        <StrictMode>
          <DisputeStepEvidence
            formData={{ ...baseFormData, files }}
            errors={{}}
            handleFileUpload={vi.fn()}
            removeFile={vi.fn()}
          />
        </StrictMode>,
      );

      // Strict Mode mounts, unmounts and remounts effects; the rendered src must
      // be the URL from the surviving effect, not one that was already revoked.
      const src = screen.getByTestId("preview-0").getAttribute("src");
      const revoked = revokeObjectURL.mock.calls.map(([url]) => url);
      expect(src).toMatch(/^blob:mock\//);
      expect(revoked).not.toContain(src);

      unmount();
      expect(revokeObjectURL).toHaveBeenCalledTimes(createObjectURL.mock.calls.length);
    });
  });
});
