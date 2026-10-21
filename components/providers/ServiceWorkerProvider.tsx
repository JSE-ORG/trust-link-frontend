"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { captureError } from "@/lib/logger";

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const serviceWorker = navigator.serviceWorker;
    const workerStateListeners = new Map<ServiceWorker, EventListener>();
    let registration: ServiceWorkerRegistration | null = null;
    let isMounted = true;
    let reloadAfterControllerChange = false;
    let hasReloaded = false;

    const handleControllerChange = () => {
      if (!reloadAfterControllerChange || hasReloaded) return;
      reloadAfterControllerChange = false;
      hasReloaded = true;
      serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      window.location.reload();
    };

    const handleUpdateFound = () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      let prompted = false;
      const handleStateChange: EventListener = () => {
        if (newWorker.state === "installed" && serviceWorker.controller && !prompted) {
          prompted = true;
          newWorker.removeEventListener("statechange", handleStateChange);
          workerStateListeners.delete(newWorker);
          toast("Update available", {
            description: "A new version of TrustLink is ready.",
            action: {
              label: "Refresh",
              onClick: () => {
                const waitingWorker = registration?.waiting;
                if (!isMounted || !waitingWorker) return;
                reloadAfterControllerChange = true;
                waitingWorker.postMessage({ action: "SKIP_WAITING" });
              },
            },
            duration: Infinity,
          });
        } else if (newWorker.state === "activated" || newWorker.state === "redundant") {
          newWorker.removeEventListener("statechange", handleStateChange);
          workerStateListeners.delete(newWorker);
        }
      };

      workerStateListeners.set(newWorker, handleStateChange);
      newWorker.addEventListener("statechange", handleStateChange);
    };

    async function register() {
      try {
        const currentRegistration = await serviceWorker.register("/sw.js");
        if (!isMounted) return;
        registration = currentRegistration;
        registration.addEventListener("updatefound", handleUpdateFound);
      } catch (err) {
        captureError(err, { scope: "ui", action: "registerServiceWorker" });
      }
    }

    serviceWorker.addEventListener("controllerchange", handleControllerChange);
    void register();

    return () => {
      isMounted = false;
      serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      registration?.removeEventListener("updatefound", handleUpdateFound);
      for (const [worker, listener] of workerStateListeners) {
        worker.removeEventListener("statechange", listener);
      }
      workerStateListeners.clear();
    };
  }, []);

  return null;
}
