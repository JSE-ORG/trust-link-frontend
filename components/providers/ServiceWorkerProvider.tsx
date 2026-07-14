"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function ServiceWorkerProvider() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          let prompted = false;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller && !prompted) {
              prompted = true;
              toast("Update available", {
                description: "A new version of TrustLink is ready.",
                action: {
                  label: "Refresh",
                  onClick: () => {
                    if (registration.waiting) {
                      registration.waiting.postMessage({ action: "SKIP_WAITING" });
                    }
                    window.location.reload();
                  },
                },
                duration: Infinity,
              });
            }
          });
        });
      } catch (err) {
        console.error("Service Worker registration failed:", err);
      }
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    register();
  }, []);

  return null;
}
