/**
 * Mock for next/dynamic in the Vitest jsdom environment.
 *
 * next/dynamic uses webpack-specific code-splitting that isn't available in
 * Vite. This shim synchronously resolves the dynamic import so the wrapped
 * component renders immediately in tests.
 */
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function dynamic<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T } | T>
): T {
  // We can't await in a synchronous context, so return a component that
  // triggers the load via React's lazy/Suspense mechanism in tests.
  const LazyComponent = React.lazy(async () => {
    const mod = await loader();
    // Handle both `{ default: Component }` and bare component shapes.
    if (typeof mod === "function") return { default: mod };
    return mod as { default: T };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Wrapper = (props: any) =>
    React.createElement(
      React.Suspense,
      { fallback: React.createElement("div", null, "Loading...") },
      React.createElement(LazyComponent as unknown as React.ComponentType, props)
    );

  return Wrapper as unknown as T;
}
