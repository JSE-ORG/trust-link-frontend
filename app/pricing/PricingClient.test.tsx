import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearSubscriptionCache, useSubscription } from "@/components/providers/SubscriptionProvider";
import { upgradeSubscription } from "@/lib/api";
import type { Subscription } from "@/types";

import PricingClient from "./PricingClient";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

const upgradedSubscription: Subscription = { plan: "PRO", vendorId: "vendor-a" };

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/providers/SubscriptionProvider", () => ({
  useSubscription: vi.fn(),
  clearSubscriptionCache: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ upgradeSubscription: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("PricingClient upgrade journeys", () => {
  let refetch: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem("wallet.jwt", "current-token");
    refetch = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    vi.mocked(useSubscription).mockReturnValue({
      plan: "FREE", subscription: null, isPro: false, isLoading: false, refetch,
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("presents FREE and PRO plans and an available upgrade action", () => {
    render(<PricingClient />);

    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$19")).toBeInTheDocument();
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeEnabled();
    expect(upgradeSubscription).not.toHaveBeenCalled();
  });

  it("awaits the upgrade, invalidates cache, then awaits refetch before navigating", async () => {
    const user = userEvent.setup();
    const upgrade = deferred<Awaited<ReturnType<typeof upgradeSubscription>>>();
    const refresh = deferred<void>();
    vi.mocked(upgradeSubscription).mockReturnValue(upgrade.promise);
    refetch.mockReturnValue(refresh.promise);
    render(<PricingClient />);
    // The token is read at click time, rather than captured during rendering.
    localStorage.setItem("wallet.jwt", "latest-token");
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    expect(upgradeSubscription).toHaveBeenCalledExactlyOnceWith("latest-token");
    const pendingButton = screen.getByRole("button", { name: "Upgrading…" });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(upgradeSubscription).toHaveBeenCalledTimes(1);
    expect(clearSubscriptionCache).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    await act(async () => upgrade.resolve(upgradedSubscription));
    expect(clearSubscriptionCache).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(clearSubscriptionCache).mock.invocationCallOrder[0]).toBeLessThan(
      refetch.mock.invocationCallOrder[0],
    );
    expect(screen.getByRole("button", { name: "Upgrading…" })).toBeDisabled();
    expect(push).not.toHaveBeenCalled();

    await act(async () => refresh.resolve());
    expect(push).toHaveBeenCalledExactlyOnceWith("/dashboard?upgraded=1");
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeEnabled();
  });

  it.each([
    [new Error("Billing unavailable"), "Billing unavailable"],
    ["unexpected failure", "Upgrade failed. Please try again."],
  ])("shows feedback and permits retry after rejection %j", async (reason, message) => {
    const user = userEvent.setup();
    const upgrade = deferred<Awaited<ReturnType<typeof upgradeSubscription>>>();
    vi.mocked(upgradeSubscription).mockReturnValueOnce(upgrade.promise);
    render(<PricingClient />);
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    await act(async () => upgrade.reject(reason));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message);
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeEnabled();
    expect(clearSubscriptionCache).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    const retry = deferred<Awaited<ReturnType<typeof upgradeSubscription>>>();
    vi.mocked(upgradeSubscription).mockReturnValueOnce(retry.promise);
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(screen.queryByText(message)).not.toBeInTheDocument();
    expect(upgradeSubscription).toHaveBeenCalledTimes(2);
    await act(async () => retry.resolve(upgradedSubscription));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard?upgraded=1"));
  });

  it("reports refetch failures and restores the action without success navigation", async () => {
    const user = userEvent.setup();
    vi.mocked(upgradeSubscription).mockResolvedValue(upgradedSubscription);
    refetch.mockRejectedValue(new Error("Refresh failed"));
    render(<PricingClient />);
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    expect(await screen.findByText("Refresh failed")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Refresh failed");
    expect(clearSubscriptionCache).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it.each([null, ""])("redirects without billing when the token is %j", async (token) => {
    const user = userEvent.setup();
    if (token === null) localStorage.removeItem("wallet.jwt");
    else localStorage.setItem("wallet.jwt", token);
    render(<PricingClient />);
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    expect(push).toHaveBeenCalledExactlyOnceWith("/");
    expect(upgradeSubscription).not.toHaveBeenCalled();
    expect(clearSubscriptionCache).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("disables upgrades while subscription state is loading", async () => {
    const user = userEvent.setup();
    vi.mocked(useSubscription).mockReturnValue({
      plan: "FREE", subscription: null, isPro: false, isLoading: true, refetch,
    });
    render(<PricingClient />);
    const button = screen.getByRole("button", { name: "Upgrade to Pro" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(upgradeSubscription).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the active PRO plan without an upgrade action", () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: "PRO", subscription: null, isPro: true, isLoading: false, refetch,
    });
    render(<PricingClient />);

    expect(screen.getByText(/Active plan/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upgrade to Pro" })).not.toBeInTheDocument();
    expect(upgradeSubscription).not.toHaveBeenCalled();
  });
});
