import { describe, expect, it, vi } from "vitest";

import {
  getSessionRefreshSchedule,
  handleSessionExpired,
  LEGACY_SESSION_EXPIRED_EVENTS,
  LEGACY_STORAGE_KEYS,
  MIN_SESSION_REFRESH_DELAY_MS,
  PUBLIC_KEY_STORAGE_KEY,
  SESSION_EXPIRED_EVENT,
  SESSION_KEY,
  SESSION_REFRESH_LEAD_MS,
  SESSION_STORAGE_KEYS,
} from "./session";

const NOW = 1_700_000_000_000;

/** An `exp` claim (seconds) for a token with `ms` left at {@link NOW}. */
function expiringIn(ms: number): number {
  return (NOW + ms) / 1000;
}

describe("getSessionRefreshSchedule", () => {
  it("renews a normal-lifetime token one lead period before it expires", () => {
    const oneHour = 60 * 60 * 1000;

    expect(getSessionRefreshSchedule(expiringIn(oneHour), NOW)).toEqual({
      kind: "refresh",
      delayMs: oneHour - SESSION_REFRESH_LEAD_MS,
    });
  });

  it.each([
    ["one second", 1_000],
    ["half the floor", MIN_SESSION_REFRESH_DELAY_MS / 2],
    ["just under the lead period", SESSION_REFRESH_LEAD_MS - 1],
    ["just over the lead period", SESSION_REFRESH_LEAD_MS + 1],
  ])(
    "floors the delay for a token with %s left instead of firing immediately",
    (_label, timeLeftMs) => {
      const schedule = getSessionRefreshSchedule(expiringIn(timeLeftMs), NOW);

      // The whole point of the bound: a short-lived token must never produce a
      // zero-delay renewal, because each renewal reschedules the next one.
      expect(schedule).toEqual({
        kind: "refresh",
        delayMs: MIN_SESSION_REFRESH_DELAY_MS,
      });
    },
  );

  it("never returns a delay below the floor for any positive lifetime", () => {
    for (let timeLeftMs = 1; timeLeftMs < SESSION_REFRESH_LEAD_MS; timeLeftMs += 997) {
      const schedule = getSessionRefreshSchedule(expiringIn(timeLeftMs), NOW);

      expect(schedule.kind).toBe("refresh");
      expect(
        schedule.kind === "refresh" ? schedule.delayMs : 0,
      ).toBeGreaterThanOrEqual(MIN_SESSION_REFRESH_DELAY_MS);
    }
  });

  it.each([
    ["already lapsed", -1_000],
    ["lapsing exactly now", 0],
  ])("reports a token %s as expired", (_label, timeLeftMs) => {
    expect(getSessionRefreshSchedule(expiringIn(timeLeftMs), NOW)).toEqual({
      kind: "unusable",
      reason: "expired",
    });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "1700000000"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["an object", { exp: 1 }],
  ])("reports %s as an invalid expiry rather than a NaN delay", (_label, exp) => {
    // `setTimeout(fn, NaN)` runs on the next tick, which is how a malformed
    // claim used to turn into an immediate re-authentication.
    expect(getSessionRefreshSchedule(exp, NOW)).toEqual({
      kind: "unusable",
      reason: "invalid-expiry",
    });
  });

  it("defaults to the current time", () => {
    const schedule = getSessionRefreshSchedule(Date.now() / 1000 + 3600);

    expect(schedule.kind).toBe("refresh");
  });
});

describe("handleSessionExpired", () => {
  it("clears all session storage keys in localStorage and legacy keys in sessionStorage", () => {
    window.localStorage.setItem(SESSION_KEY, "test-jwt");
    window.localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, "test-public-key");
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.setItem(key, "legacy-local-val");
      window.sessionStorage.setItem(key, "legacy-session-val");
    }

    // Unrelated user preferences
    window.localStorage.setItem("theme", "dark");
    window.localStorage.setItem("user-pref", "compact");
    window.sessionStorage.setItem("tab-index", "2");

    handleSessionExpired();

    // Session keys are removed
    for (const key of SESSION_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    for (const key of LEGACY_STORAGE_KEYS) {
      expect(window.sessionStorage.getItem(key)).toBeNull();
    }

    // Unrelated keys are strictly preserved
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(window.localStorage.getItem("user-pref")).toBe("compact");
    expect(window.sessionStorage.getItem("tab-index")).toBe("2");
  });

  it("dispatches the canonical expiry event and legacy events to listeners", () => {
    const canonicalListener = vi.fn();
    const legacyListeners = LEGACY_SESSION_EXPIRED_EVENTS.map(() => vi.fn());

    window.addEventListener(SESSION_EXPIRED_EVENT, canonicalListener);
    LEGACY_SESSION_EXPIRED_EVENTS.forEach((eventName, idx) => {
      window.addEventListener(eventName, legacyListeners[idx]);
    });

    try {
      handleSessionExpired();

      expect(canonicalListener).toHaveBeenCalledTimes(1);
      legacyListeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, canonicalListener);
      LEGACY_SESSION_EXPIRED_EVENTS.forEach((eventName, idx) => {
        window.removeEventListener(eventName, legacyListeners[idx]);
      });
    }
  });

  it("produces an isolated, single teardown when wired from producer to listener", () => {
    window.localStorage.setItem(SESSION_KEY, "active-jwt");
    window.localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, "active-key");

    let inMemoryToken: string | null = "active-jwt";
    let inMemoryKey: string | null = "active-key";
    let teardownCount = 0;

    const onExpired = () => {
      if (inMemoryToken || inMemoryKey) {
        teardownCount++;
        inMemoryToken = null;
        inMemoryKey = null;
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    try {
      handleSessionExpired();

      expect(teardownCount).toBe(1);
      expect(inMemoryToken).toBeNull();
      expect(inMemoryKey).toBeNull();
      expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    }
  });
});
