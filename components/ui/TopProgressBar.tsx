"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopProgressBar() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname or search params change, complete the progress bar
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300); // Wait for the transition to finish before hiding
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      
      // Don't intercept if it's opening in a new tab or has a target
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        target.target === "_blank" ||
        target.target === "_top"
      ) {
        return;
      }

      // Check if the link is internal and goes to a different path
      const href = target.href;
      if (!href) return;

      const targetUrl = new URL(href, window.location.origin);
      if (targetUrl.origin !== window.location.origin) return;

      // Only show progress for different paths (ignoring hash changes)
      if (
        targetUrl.pathname !== window.location.pathname ||
        targetUrl.search !== window.location.search
      ) {
        setIsNavigating(true);
        setProgress(15);
      }
    };

    // Use event delegation on the document body
    const handleDocumentClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const anchor = (e.target as Element).closest("a");
      if (anchor) {
        // Fake the currentTarget property for the handler
        const eventCopy = Object.create(e);
        Object.defineProperty(eventCopy, "currentTarget", {
          value: anchor,
          writable: false,
        });
        handleAnchorClick(eventCopy as unknown as MouseEvent);
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Simulate progress increasing over time
  useEffect(() => {
    if (isNavigating && progress < 90) {
      timerRef.current = setTimeout(() => {
        setProgress((prev) => {
          // Slow down the progress as it gets higher
          const inc = prev < 50 ? 10 : prev < 80 ? 5 : 2;
          return Math.min(prev + inc, 90);
        });
      }, 300);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isNavigating, progress]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out dark:bg-blue-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
