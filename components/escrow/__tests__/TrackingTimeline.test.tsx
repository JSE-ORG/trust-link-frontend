import { cleanup,render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TrackingTimeline, { type ShipmentStage } from "../TrackingTimeline";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

describe("TrackingTimeline Accessibility and Functional Logic", () => {
  afterEach(() => {
    cleanup();
  });

  const stages: ShipmentStage[] = [
    "ORDER_PLACED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  const stageLabels: Record<ShipmentStage, string> = {
    ORDER_PLACED: "Order Placed",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "In Transit",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
  };

  it.each(stages)("renders correctly when currentStage is %s", (stageId) => {
    render(<TrackingTimeline currentStage={stageId} />);

    // Verify the correct stage is marked as current with aria-current="step"
    const currentLi = screen.getByRole("listitem", { current: "step" });
    expect(currentLi).toHaveTextContent(stageLabels[stageId as ShipmentStage]);

    // Verify completed stages show checkmark
    const currentIndex = stages.indexOf(stageId);
    const checkmarks = screen.queryAllByTestId("checkmark-icon");
    expect(checkmarks).toHaveLength(currentIndex);
  });

  it("updates aria-live status region when state changes", () => {
    const { rerender } = render(<TrackingTimeline currentStage="ORDER_PLACED" />);
    
    let status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Order Placed/);

    rerender(<TrackingTimeline currentStage="PICKED_UP" />);
    status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Picked Up/);
  });

  it("has correct accessibility attributes on root elements", () => {
    render(<TrackingTimeline currentStage="IN_TRANSIT" />);

    // Section should have aria-label
    expect(screen.getByRole("region", { name: /tracking timeline/i })).toBeInTheDocument();

    // Status region should be polite and atomic
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");

    // List should be present
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("verifies that upcoming stages are not marked as current or completed", () => {
    render(<TrackingTimeline currentStage="PICKED_UP" />);
    
    const allStages = screen.getAllByRole("listitem");
    
    // PICKED_UP is index 1
    // ORDER_PLACED (index 0) should be completed (has checkmark)
    // PICKED_UP (index 1) should be current (aria-current="step")
    // IN_TRANSIT, etc. should be upcoming (neither)

    expect(allStages[0]).not.toHaveAttribute("aria-current");
    expect(allStages[1]).toHaveAttribute("aria-current", "step");
    expect(allStages[2]).not.toHaveAttribute("aria-current");
    
    const checkmarks = screen.getAllByTestId("checkmark-icon");
    expect(checkmarks).toHaveLength(1);
  });
});
