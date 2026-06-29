import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToast } from "./useToast";

const sonnerSuccess = vi.fn();
const sonnerError = vi.fn();
const sonnerLoading = vi.fn();
const sonnerDismiss = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string, options?: unknown) => sonnerSuccess(msg, options),
    error: (msg: string, options?: unknown) => sonnerError(msg, options),
    loading: (msg: string, options?: unknown) => sonnerLoading(msg, options),
    dismiss: (id?: string | number) => sonnerDismiss(id),
  },
  Toaster: () => null,
}));

describe("useToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a toast object with success, error, loading, and dismiss methods", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty("success");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("dismiss");

    expect(typeof result.current.success).toBe("function");
    expect(typeof result.current.error).toBe("function");
    expect(typeof result.current.loading).toBe("function");
    expect(typeof result.current.dismiss).toBe("function");
  });

  it("calls sonner toast.success with the message and default duration", () => {
    const { result } = renderHook(() => useToast());

    result.current.success("Operation completed");

    expect(sonnerSuccess).toHaveBeenCalledWith("Operation completed", {
      duration: 4000,
    });
  });

  it("calls sonner toast.error with the message and default duration", () => {
    const { result } = renderHook(() => useToast());

    result.current.error("Something went wrong");

    expect(sonnerError).toHaveBeenCalledWith("Something went wrong", {
      duration: 4000,
    });
  });

  it("calls sonner toast.loading with the message and default duration", () => {
    const { result } = renderHook(() => useToast());

    result.current.loading("Processing...");

    expect(sonnerLoading).toHaveBeenCalledWith("Processing...", {
      duration: 4000,
    });
  });

  it("merges custom options with defaults", () => {
    const { result } = renderHook(() => useToast());

    result.current.success("Done", { duration: 2000 });

    expect(sonnerSuccess).toHaveBeenCalledWith("Done", {
      duration: 2000,
      important: true,
    });
  });

  it("calls sonner toast.dismiss with the given id", () => {
    const { result } = renderHook(() => useToast());

    result.current.dismiss("test-id");

    expect(sonnerDismiss).toHaveBeenCalledWith("test-id");
  });

  it("calls sonner toast.dismiss without id when no id is provided", () => {
    const { result } = renderHook(() => useToast());

    result.current.dismiss();

    expect(sonnerDismiss).toHaveBeenCalledWith(undefined);
  });
});
