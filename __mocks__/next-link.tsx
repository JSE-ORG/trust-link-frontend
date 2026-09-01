/**
 * Mock for next/link in the Vitest jsdom environment.
 *
 * Renders a plain <a> element so Link-based components can be tested
 * without the full Next.js router context.
 */
import React from "react";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
}

export default function Link({ href, children, ...rest }: LinkProps) {
  return React.createElement("a", { href, ...rest }, children);
}
