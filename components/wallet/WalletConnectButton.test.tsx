import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import WalletConnectButton from "./WalletConnectButton";

vi.mock("@/lib/stellar/freighter", () => ({
  isFreighterInstalled: vi.fn(),
  connectFreighter: vi.fn(),
  signTransaction: vi.fn(),
}));

import * as freighter from "@/lib/stellar/freighter";

describe("WalletConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows Connect Wallet when disconnected", () => {
    render(<WalletConnectButton />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("shows connecting indicator while connecting", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(true);
    (freighter.connectFreighter as unknown as vi.Mock).mockResolvedValue({ publicKey: "GABCDE12345XYZ" });
    (freighter.signTransaction as unknown as vi.Mock).mockResolvedValue("signed-tx");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ transaction: "challenge", network_passphrase: "Test Network" }),
              }),
            0
          )
        )
    );
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "jwt-token" }) });

    render(<WalletConnectButton />);
    const button = screen.getByRole("button", { name: /^Connect Wallet$/i });

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: /connecting/i })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: /gabcde\.\.\.5xyz/i })).toBeInTheDocument());
  });

  it("shows truncated address when connected", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(true);
    (freighter.connectFreighter as unknown as vi.Mock).mockResolvedValue({ publicKey: "GABCDEFGHIJKLMNO123" });
    (freighter.signTransaction as unknown as vi.Mock).mockResolvedValue("signed-tx");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: "challenge", network_passphrase: "Test Network" }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "jwt-token" }) });

    render(<WalletConnectButton />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect Wallet$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /gabcde\.\.\.O123/i })).toBeInTheDocument());
  });

  it("shows install prompt when Freighter is absent", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(false);
    render(<WalletConnectButton />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect Wallet$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /install freighter/i })).toBeInTheDocument());
  });

  it("is keyboard accessible in disconnected state", async () => {
    render(<WalletConnectButton />);
    const button = screen.getByRole("button", { name: /^Connect Wallet$/i });
    button.focus();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  });

  it("is keyboard accessible when connected", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(true);
    (freighter.connectFreighter as unknown as vi.Mock).mockResolvedValue({ publicKey: "GABCDEF1234XYZ" });
    (freighter.signTransaction as unknown as vi.Mock).mockResolvedValue("signed-tx");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: "challenge", network_passphrase: "Test Network" }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "jwt-token" }) });

    render(<WalletConnectButton />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect Wallet$/i }));
    const connectedButton = await screen.findByRole("button", { name: /gabcde\.\.\.4xyz/i });
    connectedButton.focus();
    expect(connectedButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  });
});
