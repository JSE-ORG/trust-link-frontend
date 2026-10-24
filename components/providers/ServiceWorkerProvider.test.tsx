import { act, render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureError } from "@/lib/logger";

import { ServiceWorkerProvider } from "./ServiceWorkerProvider";

vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/lib/logger", () => ({ captureError: vi.fn() }));

class MockWorker extends EventTarget {
  state: ServiceWorkerState = "installing";
  postMessage = vi.fn();
}

class MockRegistration extends EventTarget {
  installing: MockWorker | null = null;
  waiting: MockWorker | null = null;
}

class MockServiceWorkerContainer extends EventTarget {
  controller: MockWorker | null = null;
  register = vi.fn();
}

describe("ServiceWorkerProvider", () => {
  const originalLocation = window.location;
  let registration: MockRegistration;
  let serviceWorker: MockServiceWorkerContainer;
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    registration = new MockRegistration();
    serviceWorker = new MockServiceWorkerContainer();
    serviceWorker.register.mockResolvedValue(registration);
    reload = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: serviceWorker,
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  async function renderRegistered() {
    const view = render(<ServiceWorkerProvider />);
    await waitFor(() => expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js"));
    return view;
  }

  it("reloads once after an accepted update takes control", async () => {
    serviceWorker.controller = new MockWorker();
    const installing = new MockWorker();
    const waiting = new MockWorker();
    registration.installing = installing;
    registration.waiting = waiting;
    await renderRegistered();

    act(() => registration.dispatchEvent(new Event("updatefound")));
    installing.state = "installed";
    act(() => installing.dispatchEvent(new Event("statechange")));

    expect(toast).toHaveBeenCalledWith(
      "Update available",
      expect.objectContaining({ action: expect.objectContaining({ label: "Refresh" }) })
    );
    const toastOptions = vi.mocked(toast).mock.calls[0][1] as unknown as {
      action: { onClick: (...args: never[]) => void };
    };

    act(() => toastOptions.action.onClick());
    expect(waiting.postMessage).toHaveBeenCalledWith({ action: "SKIP_WAITING" });
    expect(reload).not.toHaveBeenCalled();

    act(() => serviceWorker.dispatchEvent(new Event("controllerchange")));
    act(() => serviceWorker.dispatchEvent(new Event("controllerchange")));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not prompt or reload for first installation without a controller", async () => {
    const installing = new MockWorker();
    registration.installing = installing;
    await renderRegistered();

    act(() => registration.dispatchEvent(new Event("updatefound")));
    installing.state = "installed";
    act(() => installing.dispatchEvent(new Event("statechange")));
    act(() => serviceWorker.dispatchEvent(new Event("controllerchange")));

    expect(toast).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("removes controller and registration listeners on unmount", async () => {
    const removeServiceWorkerListener = vi.spyOn(serviceWorker, "removeEventListener");
    const removeRegistrationListener = vi.spyOn(registration, "removeEventListener");
    const { unmount } = await renderRegistered();

    unmount();
    act(() => serviceWorker.dispatchEvent(new Event("controllerchange")));

    expect(removeServiceWorkerListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function)
    );
    expect(removeRegistrationListener).toHaveBeenCalledWith(
      "updatefound",
      expect.any(Function)
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it("reports a failed registration through the logger, not the console", async () => {
    const failure = new Error("sw.js 404");
    serviceWorker.register.mockRejectedValue(failure);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ServiceWorkerProvider />);

    await waitFor(() =>
      expect(captureError).toHaveBeenCalledWith(failure, {
        scope: "ui",
        action: "registerServiceWorker",
      })
    );
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});