import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import EscrowCountdown, {
  COUNTDOWN_WARNING_MS,
  formatCountdown,
  getTimeRemaining,
} from "../EscrowCountdown";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "payment.expiredCountdown": "Expired",
        "payment.timeRemaining": "Time remaining",
      })[key] ?? key,
  }),
}));

afterEach(() => {
  vi.useRealTimers();
});

describe("EscrowCountdown", () => {
  it("formats and clamps remaining time, and rejects invalid timestamps", () => {
    expect(getTimeRemaining("not-a-date", 0)).toBeNull();
    expect(getTimeRemaining("1970-01-01T00:00:01.000Z", 2000)).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
    });
    expect(
      formatCountdown({ days: 0, hours: 0, minutes: 4, seconds: 7, totalMs: 247000 })
    ).toBe("4m 07s");
  });

  it("renders a live countdown and ticks once per second", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(<EscrowCountdown expiresAt={new Date(now.getTime() + 3000).toISOString()} />);

    expect(screen.getByRole("timer")).toHaveTextContent("3s");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("2s");
  });

  it("uses warning styling inside the warning window", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(
      <EscrowCountdown
        expiresAt={new Date(now.getTime() + COUNTDOWN_WARNING_MS - 1).toISOString()}
      />
    );

    expect(screen.getByTestId("escrow-countdown")).toHaveClass("border-amber-300");
    expect(screen.getByText("Time remaining")).toBeInTheDocument();
  });

  it("shows the expired badge and calls onExpire once when time runs out", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const onExpire = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(
      <EscrowCountdown
        expiresAt={new Date(now.getTime() + 2000).toISOString()}
        onExpire={onExpire}
      />
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("escrow-expired-badge")).toHaveTextContent("Expired");
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("renders nothing for an invalid expiry timestamp", () => {
    vi.useFakeTimers();

    const { container } = render(<EscrowCountdown expiresAt="invalid" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("supports an already-expired status and custom class name", () => {
    vi.useFakeTimers();

    render(
      <EscrowCountdown
        expiresAt="2030-01-01T00:00:00.000Z"
        forceExpired
        className="custom-countdown"
      />
    );

    expect(screen.getByTestId("escrow-countdown")).toHaveClass("custom-countdown");
    expect(screen.getByTestId("escrow-expired-badge")).toBeInTheDocument();
  });
});