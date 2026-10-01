import { describe, expect, it, vi } from "vitest";

import { computeBackoffDelay, PollTimeoutError,pollWithBackoff } from "./poll";

describe("computeBackoffDelay", () => {
  it("grows geometrically between attempts", () => {
    const options = { initialDelayMs: 100, factor: 2, jitterRatio: 0, maxDelayMs: 10_000 };

    expect(computeBackoffDelay(1, options)).toBe(100);
    expect(computeBackoffDelay(2, options)).toBe(200);
    expect(computeBackoffDelay(3, options)).toBe(400);
    expect(computeBackoffDelay(4, options)).toBe(800);
  });

  it("caps the delay at maxDelayMs", () => {
    const options = { initialDelayMs: 100, factor: 2, jitterRatio: 0, maxDelayMs: 500 };

    expect(computeBackoffDelay(10, options)).toBe(500);
  });

  it("spreads the delay by up to +/-jitterRatio", () => {
    const options = { initialDelayMs: 100, factor: 1, jitterRatio: 0.2, maxDelayMs: 10_000 };

    // random() === 1 -> +20%, random() === 0 -> -20%
    expect(computeBackoffDelay(1, { ...options, random: () => 1 })).toBe(120);
    expect(computeBackoffDelay(1, { ...options, random: () => 0 })).toBe(80);
    expect(computeBackoffDelay(1, { ...options, random: () => 0.5 })).toBe(100);
  });

  it("keeps jittered delays within the jitter band of the cap", () => {
    const options = { initialDelayMs: 100, factor: 10, jitterRatio: 0.2, maxDelayMs: 1_000 };

    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const delay = computeBackoffDelay(8, { ...options, random: () => random });
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1_200);
    }
  });

  it("never returns a negative delay", () => {
    expect(
      computeBackoffDelay(1, { initialDelayMs: 10, jitterRatio: 1, random: () => 0 })
    ).toBe(0);
  });
});

describe("pollWithBackoff", () => {
  function noSleep() {
    return vi.fn(async () => {});
  }

  it("returns the first non-null value", async () => {
    const check = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ status: "SUCCESS" });

    const result = await pollWithBackoff({
      check,
      sleep: noSleep(),
      random: () => 0.5,
      now: () => 0,
    });

    expect(result).toEqual({ status: "SUCCESS" });
    expect(check).toHaveBeenCalledTimes(3);
  });

  it("does not sleep when the first check already succeeds", async () => {
    const sleep = noSleep();

    await pollWithBackoff({
      check: vi.fn().mockResolvedValue("ready"),
      sleep,
      random: () => 0.5,
      now: () => 0,
    });

    expect(sleep).not.toHaveBeenCalled();
  });

  it("treats undefined as pending", async () => {
    const check = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue("done");

    await expect(
      pollWithBackoff({ check, sleep: noSleep(), random: () => 0.5, now: () => 0 })
    ).resolves.toBe("done");
  });

  it("grows the delay between retries instead of polling flat out", async () => {
    const delays: number[] = [];
    const check = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue("done");

    await pollWithBackoff({
      check,
      sleep: async (ms) => {
        delays.push(ms);
      },
      random: () => 0.5,
      now: () => 0,
      initialDelayMs: 100,
      factor: 2,
    });

    expect(delays).toEqual([100, 200, 400]);
  });

  it("propagates an error thrown by check", async () => {
    const check = vi.fn().mockRejectedValue(new Error("TxFailed: boom"));

    await expect(
      pollWithBackoff({ check, sleep: noSleep(), now: () => 0 })
    ).rejects.toThrow("TxFailed: boom");
  });

  describe("timeout", () => {
    it("throws a PollTimeoutError with the attempt count", async () => {
      let clock = 0;
      const check = vi.fn().mockImplementation(async () => {
        clock += 100;
        return null;
      });

      await expect(
        pollWithBackoff({
          check,
          sleep: noSleep(),
          now: () => clock,
          timeoutMs: 250,
        })
      ).rejects.toThrow(PollTimeoutError);
    });

    it("stops polling once the budget is spent", async () => {
      let clock = 0;
      const check = vi.fn().mockImplementation(async () => {
        clock += 100;
        return null;
      });

      await expect(
        pollWithBackoff({
          check,
          sleep: noSleep(),
          now: () => clock,
          timeoutMs: 300,
        })
      ).rejects.toThrow();

      expect(check.mock.calls.length).toBeLessThanOrEqual(4);
    });

    it("hands the attempt count to onTimeout", async () => {
      let clock = 0;
      const check = vi.fn().mockImplementation(async () => {
        clock += 100;
        return null;
      });
      const onTimeout = vi.fn(
        (attempts: number) => new Error(`gave up after ${attempts}`)
      );

      await expect(
        pollWithBackoff({
          check,
          sleep: noSleep(),
          now: () => clock,
          timeoutMs: 250,
          onTimeout,
        })
      ).rejects.toThrow("gave up after 3");

      expect(onTimeout).toHaveBeenCalledWith(3);
    });

    it("does not sleep after the budget is exhausted", async () => {
      let clock = 0;
      const sleep = vi.fn(async () => {});
      const check = vi.fn().mockImplementation(async () => {
        clock += 100;
        return null;
      });

      await expect(
        pollWithBackoff({ check, sleep, now: () => clock, timeoutMs: 0 })
      ).rejects.toThrow(PollTimeoutError);

      expect(check).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });
  });
});
