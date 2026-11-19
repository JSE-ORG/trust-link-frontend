import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import FeaturedArtistSection from "@/components/featured/FeaturedArtistSection";
import CommandPalette, { COMMANDS } from "@/components/ui/CommandPalette";
import nextConfig from "@/next.config";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Primary navigation targets and route tree integrity", () => {
  it("redirects legacy /verify route to /tracking in next.config.ts", async () => {
    if (typeof nextConfig.redirects === "function") {
      const redirects = await nextConfig.redirects();
      const verifyRedirect = redirects.find((r) => r.source === "/verify");
      expect(verifyRedirect).toBeDefined();
      expect(verifyRedirect?.destination).toBe("/tracking");
      expect(verifyRedirect?.permanent).toBe(true);

      const trackRedirect = redirects.find((r) => r.destination === "/track");
      expect(trackRedirect).toBeUndefined();
    }
  });

  it("configures CommandPalette commands without absent routes", () => {
    const routes = COMMANDS.map((c) => c.route);

    // Bare /track and /dispute should no longer exist
    expect(routes).not.toContain("/track");
    expect(routes).not.toContain("/dispute");

    // Replaced with valid routes
    expect(routes).toContain("/tracking");
    expect(routes).toContain("/docs");

    const trackingCommand = COMMANDS.find((c) => c.label === "Tracking");
    expect(trackingCommand?.route).toBe("/tracking");

    const disputeGuide = COMMANDS.find((c) => c.label.includes("Dispute"));
    expect(disputeGuide?.route).toBe("/docs");
  });

  it("navigates to /tracking and /docs when selected in CommandPalette", async () => {
    mockPush.mockClear();
    render(<CommandPalette />);

    // Open palette with meta+k
    fireEvent.keyDown(document, { key: "k", metaKey: true });

    // Select Tracking
    const trackingBtn = screen.getByRole("button", { name: /Tracking/i });
    await userEvent.click(trackingBtn);
    expect(mockPush).toHaveBeenCalledWith("/tracking");

    // Re-open palette and select Dispute Guide
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    const disputeBtn = screen.getByRole("button", { name: /Dispute Guide/i });
    await userEvent.click(disputeBtn);
    expect(mockPush).toHaveBeenCalledWith("/docs");
  });

  it("does not render absent /vendor route in FeaturedArtistSection while retaining dynamic artist links", () => {
    const { container } = render(<FeaturedArtistSection />);

    const links = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );

    // Bare /vendor directory link should be removed
    expect(links).not.toContain("/vendor");

    // Dynamic parameterized /vendor/:id links are preserved
    const dynamicVendorLinks = links.filter((href) =>
      href?.startsWith("/vendor/")
    );
    expect(dynamicVendorLinks.length).toBeGreaterThan(0);
    expect(dynamicVendorLinks).toContain("/vendor/GBAM5V6X2J7E3...K4L9M2N8P1");
  });
});
