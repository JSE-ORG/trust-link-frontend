import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, type Mock,vi } from "vitest";

import useWallet from "@/hooks/useWallet";
import { createApiClient } from "@/lib/api-client";

import { ConfirmDeliveryButton } from "../ConfirmDeliveryButton";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useWallet", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  createApiClient: vi.fn(),
}));

const ESCROW_ID = "escrow-42";
const CONFIRM_ENDPOINT = `/escrows/${ESCROW_ID}/confirm`;

function mockClientPost(post: Mock) {
  (createApiClient as unknown as Mock).mockReturnValue({ post });
}

describe("ConfirmDeliveryButton", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as unknown as Mock).mockReturnValue({ token: "jwt-token" });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the trigger button and keeps the dialog closed initially", () => {
    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /confirm delivery/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the confirmation dialog when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText(/release funds to the vendor/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("closes the dialog from the Cancel button without confirming", async () => {
    const user = userEvent.setup();
    const post = vi.fn().mockResolvedValue({});
    mockClientPost(post);
    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(await screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirms delivery, releases funds and calls onSuccess on success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const post = vi.fn().mockResolvedValue({});
    mockClientPost(post);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Delivery confirmed — funds released."
      );
    });

    expect(createApiClient).toHaveBeenCalledWith({ token: "jwt-token" });
    expect(post).toHaveBeenCalledWith(CONFIRM_ENDPOINT);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(CONFIRM_ENDPOINT),
      expect.objectContaining({ method: "POST" })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends the wallet bearer token in the confirm request headers", async () => {
    const user = userEvent.setup();
    mockClientPost(vi.fn().mockResolvedValue({}));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer jwt-token");
  });

  it("shows a pending state and blocks the buttons while confirming", async () => {
    const user = userEvent.setup();
    let resolvePost: (value: unknown) => void = () => {};
    mockClientPost(
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        })
      )
    );
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));

    expect(screen.getByText(/confirming…/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirming…/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolvePost({});
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("surfaces the server error message and keeps the dialog open on failure", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockClientPost(vi.fn().mockResolvedValue({}));
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Escrow already released" }),
    });

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Escrow already released");
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("falls back to a generic error when the error response has no message", async () => {
    const user = userEvent.setup();
    mockClientPost(vi.fn().mockResolvedValue({}));
    fetchMock.mockResolvedValue({ ok: false, json: async () => null });

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to confirm delivery");
    });
  });
});
