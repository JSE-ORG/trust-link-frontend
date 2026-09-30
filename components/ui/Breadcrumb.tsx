import { ChevronRight } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Accessible breadcrumb trail rendered inside a `nav[aria-label="Breadcrumb"]`.
 *
 * - Every item except the last one (or any item without an `href`) renders as a
 *   plain-text crumb; the last crumb is the current page and carries
 *   `aria-current="page"`.
 * - The trail wraps onto multiple lines on narrow viewports and every label
 *   truncates with an ellipsis when it would otherwise overflow, so long
 *   route params (escrow / dispute ids) never blow out the mobile layout.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("min-w-0 text-sm text-zinc-500 dark:text-zinc-400", className)}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isLink = Boolean(item.href) && !isLast;

          const content = (
            <>
              {item.icon ? (
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span className="min-w-0 truncate">{item.label}</span>
            </>
          );

          return (
            <li key={index} className="flex min-w-0 max-w-full items-center">
              {index > 0 && (
                <ChevronRight
                  className="mr-2 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLink ? (
                <a
                  href={item.href}
                  className="flex min-w-0 items-center gap-1.5 rounded transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {content}
                </a>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 items-center gap-1.5",
                    isLast && "font-medium text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
