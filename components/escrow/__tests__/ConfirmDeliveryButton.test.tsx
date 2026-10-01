import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import useWallet from "@/hooks/useWallet";
import { confirmDelivery } from "@/lib/api";

import { ConfirmDeliveryButton } from "../ConfirmDeliveryButton";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useWallet", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  confirmDelivery: vi.fn(),
}));

const ESCROW_ID = "escrow-42";
const TOKEN = "jwt-token";

const confirmDeliveryMock = confirmDelivery as unknown as Mock;

/** Opens the dialog and clicks the primary action. */
async function confirmFromDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
  await user.click(await screen.findByRole("button", { name: /yes, confirm/i }));
}

describe("ConfirmDeliveryButton", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as unknown as Mock).mockReturnValue({ token: TOKEN });
    confirmDeliveryMock.mockResolvedValue({ escrowId: ESCROW_ID });
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
    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /confirm delivery/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(await screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(confirmDeliveryMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the confirmation exactly once through the shared API client", async () => {
    const user = userEvent.setup();
    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await confirmFromDialog(user);

    await waitFor(() => expect(confirmDeliveryMock).toHaveBeenCalledTimes(1));
    expect(confirmDeliveryMock).toHaveBeenCalledWith(ESCROW_ID, TOKEN);
    // Issue #878: the component must not bypass the client with its own fetch,
    // otherwise the confirm endpoint is hit twice and a single success can be
    // reported to the user as a failure.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the success toast, closes the dialog and calls onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={onSuccess} />
    );

    await confirmFromDialog(user);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Delivery confirmed — funds released."
      );
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a pending state and blocks the buttons while confirming", async () => {
    const user = userEvent.setup();
    let resolveConfirm: (value: unknown) => void = () => {};
    confirmDeliveryMock.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      })
    );

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await confirmFromDialog(user);

    expect(screen.getByText(/confirming…/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirming…/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolveConfirm({ escrowId: ESCROW_ID });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("surfaces the server message and keeps the dialog open on failure", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    confirmDeliveryMock.mockRejectedValue(new Error("Escrow already released"));

    render(
      <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={onSuccess} />
    );

    await confirmFromDialog(user);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Escrow already released");
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("falls back to a generic error when the failure carries no message", async () => {
    const user = userEvent.setup();
    confirmDeliveryMock.mockRejectedValue("network down");

    render(<ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />);

    await confirmFromDialog(user);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not confirm delivery");
    });
  });

  describe("keyboard accessibility", () => {
    it("exposes the trigger as a dialog opener and reflects its state", async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      const trigger = screen.getByRole("button", { name: /confirm delivery/i });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);
      await screen.findByRole("dialog");

      expect(
        screen.getByRole("button", { name: /confirm delivery/i })
      ).toHaveAttribute("aria-expanded", "true");
    });

    it("opens the dialog with Enter on the trigger", () => {
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      fireEvent.keyDown(
        screen.getByRole("button", { name: /confirm delivery/i }),
        { key: "Enter" }
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens the dialog with Space on the trigger", () => {
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      fireEvent.keyDown(
        screen.getByRole("button", { name: /confirm delivery/i }),
        { key: " " }
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the dialog with Enter on Cancel", async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      await user.click(
        screen.getByRole("button", { name: /confirm delivery/i })
      );
      const cancel = await screen.findByRole("button", { name: /cancel/i });

      fireEvent.keyDown(cancel, { key: "Enter" });

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("confirms the delivery with Space on the primary action", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={onSuccess} />
      );

      await user.click(
        screen.getByRole("button", { name: /confirm delivery/i })
      );
      const confirm = await screen.findByRole("button", {
        name: /yes, confirm/i,
      });

      fireEvent.keyDown(confirm, { key: " " });

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(confirmDeliveryMock).toHaveBeenCalledWith(ESCROW_ID, TOKEN);
    });

    it("runs the confirm action exactly once per keyboard activation", async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      await user.click(
        screen.getByRole("button", { name: /confirm delivery/i })
      );
      const cancel = await screen.findByRole("button", { name: /cancel/i });

      // The trap moves focus into the dialog on the next frame; wait for it
      // before tabbing so the sequence below is deterministic.
      await waitFor(() => expect(cancel).toHaveFocus());

      await user.tab();
      const confirm = screen.getByRole("button", { name: /yes, confirm/i });
      expect(confirm).toHaveFocus();

      await user.keyboard("{Enter}");

      await waitFor(() => expect(confirmDeliveryMock).toHaveBeenCalledTimes(1));
    });

    it("cycles focus between the dialog controls with Tab", async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      await user.click(
        screen.getByRole("button", { name: /confirm delivery/i })
      );
      const cancel = await screen.findByRole("button", { name: /cancel/i });
      const confirm = await screen.findByRole("button", {
        name: /yes, confirm/i,
      });

      // The trap pulls focus to the first control on the next frame.
      await waitFor(() => expect(cancel).toHaveFocus());

      await user.tab();
      expect(confirm).toHaveFocus();

      // Tab on the last control wraps back inside the dialog, never out.
      await user.tab();
      expect(cancel).toHaveFocus();
    });

    it("gives every control a visible focus outline", () => {
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      expect(
        screen
          .getByRole("button", { name: /confirm delivery/i })
          .className.includes("focus-visible:")
      ).toBe(true);
    });

    it("still dismisses the dialog with Escape", async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDeliveryButton escrowId={ESCROW_ID} onSuccess={vi.fn()} />
      );

      await user.click(
        screen.getByRole("button", { name: /confirm delivery/i })
      );
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  });
});