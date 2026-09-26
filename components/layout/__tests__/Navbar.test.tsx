import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "../Navbar";

const mockToggleNetwork = vi.fn();
let mockIsMainnet = true;

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: () => ({
    toggleNetwork: mockToggleNetwork,
    isMainnet: mockIsMainnet,
  }),
}));

vi.mock("@/components/ui/ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMainnet = true;
  });

  it("renders the TrustLink brand", () => {
    render(<Navbar />);
    expect(screen.getByText("TrustLink")).toBeInTheDocument();
  });

  it("shows Mainnet when isMainnet is true", () => {
    render(<Navbar />);
    expect(screen.getByText("Mainnet")).toBeInTheDocument();
  });

  it("shows Testnet when isMainnet is false", () => {
    mockIsMainnet = false;
    render(<Navbar />);
    expect(screen.getByText("Testnet")).toBeInTheDocument();
  });

  it("calls toggleNetwork on button click", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("switch"));
    expect(mockToggleNetwork).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label for mainnet", () => {
    render(<Navbar />);
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-label",
      "Switch to Testnet"
    );
  });

  it("has correct aria-label for testnet", () => {
    mockIsMainnet = false;
    render(<Navbar />);
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-label",
      "Switch to Mainnet"
    );
  });

  it("sets aria-checked based on isMainnet", () => {
    render(<Navbar />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls toggleNetwork on Enter key", () => {
    render(<Navbar />);
    fireEvent.keyDown(screen.getByRole("switch"), { key: "Enter" });
    expect(mockToggleNetwork).toHaveBeenCalledTimes(1);
  });

  it("calls toggleNetwork on Space key", () => {
    render(<Navbar />);
    fireEvent.keyDown(screen.getByRole("switch"), { key: " " });
    expect(mockToggleNetwork).toHaveBeenCalledTimes(1);
  });

  it("renders the ThemeToggle", () => {
    render(<Navbar />);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });
});
